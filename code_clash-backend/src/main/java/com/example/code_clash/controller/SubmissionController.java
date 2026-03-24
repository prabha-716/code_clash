package com.example.code_clash.controller;

import com.example.code_clash.entity.Battle;
import com.example.code_clash.entity.User;
import com.example.code_clash.repository.BattleRepository;
import com.example.code_clash.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@RestController
@RequestMapping("/submit")
@RequiredArgsConstructor
public class SubmissionController {

    private final RestTemplate restTemplate;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    private BattleRepository battleRepository;

    @Autowired
    private UserRepository userRepository;

    private final ObjectMapper mapper = new ObjectMapper();
    private final String judge0Url = "https://ce.judge0.com";

    @PostMapping
    public Map<String, Object> submit(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) throws Exception {

        String roomId = (String) body.get("roomId");
        String code   = (String) body.get("code");
        int languageId = (int) body.get("languageId");

        Battle battle = battleRepository.findByRoomId(roomId)
                .orElseThrow(() -> new RuntimeException("Battle not found"));

        if (!battle.getStatus().equals("ONGOING")) {
            return Map.of("status", "ERROR", "reason", "Battle already finished");
        }

        boolean isPlayer = battle.getPlayer1().getId().equals(user.getId()) ||
                battle.getPlayer2().getId().equals(user.getId());
        if (!isPlayer) {
            return Map.of("status", "ERROR", "reason", "Not your battle");
        }

        // Parse test cases
        String testCasesJson = battle.getProblem().getTestCases();
        JsonNode testCases   = mapper.readTree(testCasesJson);

        // ── Run each test case and collect per-case results ──────────────────
        List<Map<String, Object>> caseResults = new ArrayList<>();
        boolean allPassed = true;
        String failReason = "";

        int idx = 0;
        for (JsonNode tc : testCases) {
            idx++;
            String input    = tc.get("input").asText();
            String expected = tc.get("output").asText().trim();
            String actual   = runCode(code, languageId, input);

            System.out.println("TC #" + idx + " Input:    " + input);
            System.out.println("TC #" + idx + " Expected: " + expected);
            System.out.println("TC #" + idx + " Got:      " + actual);

            Map<String, Object> caseResult = new LinkedHashMap<>();
            caseResult.put("index", idx);
            caseResult.put("input", input);
            caseResult.put("expected", expected);
            caseResult.put("actual", actual.trim());

            if (actual.startsWith("ERROR:")) {
                caseResult.put("passed", false);
                caseResult.put("error", actual);
                caseResults.add(caseResult);
                if (allPassed) {          // capture first failure reason
                    allPassed = false;
                    failReason = actual;
                }
            } else if (!actual.trim().equals(expected)) {
                caseResult.put("passed", false);
                caseResult.put("error", "Wrong answer");
                caseResults.add(caseResult);
                if (allPassed) {
                    allPassed = false;
                    failReason = "Wrong answer.\nExpected: " + expected + "\nGot: " + actual.trim();
                }
            } else {
                caseResult.put("passed", true);
                caseResult.put("error", null);
                caseResults.add(caseResult);
            }
        }

        // ── Build response ────────────────────────────────────────────────────
        if (!allPassed) {
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("status", "WRONG_ANSWER");
            resp.put("reason", failReason);
            resp.put("testResults", caseResults);
            return resp;
        }

        // ✅ All passed — mark winner and update ratings
        battle.setStatus("FINISHED");
        battle.setWinnerId(user.getId().toString());
        battleRepository.save(battle);

        User opponent = battle.getPlayer1().getId().equals(user.getId())
                ? battle.getPlayer2() : battle.getPlayer1();

        // Rating deltas: winner +3, loser -2
        int winnerDelta = 3;
        int loserDelta  = -2;

        int winnerNewRating = Math.max(0, user.getRating() + winnerDelta);
        int loserNewRating  = Math.max(0, opponent.getRating() + loserDelta);
        user.setRating(winnerNewRating);
        opponent.setRating(loserNewRating);
        // Persist rating changes (assumes UserRepository is injected — see below)
        userRepository.save(user);
        userRepository.save(opponent);

        // Notify both via WebSocket (include rating delta + new rating)
        messagingTemplate.convertAndSendToUser(
                user.getId().toString(), "/queue/battle",
                Map.of("type", "BATTLE_END", "result", "WIN", "winner", user.getUsername(),
                        "ratingDelta", winnerDelta, "newRating", winnerNewRating)
        );
        messagingTemplate.convertAndSendToUser(
                opponent.getId().toString(), "/queue/battle",
                Map.of("type", "BATTLE_END", "result", "LOSE", "winner", user.getUsername(),
                        "ratingDelta", loserDelta, "newRating", loserNewRating)
        );

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("status", "ACCEPTED");
        resp.put("message", "All tests passed! You win!");
        resp.put("testResults", caseResults);
        return resp;
    }

    // ── Judge0 helper ─────────────────────────────────────────────────────────
    private String runCode(String code, int languageId, String input) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> reqBody = new HashMap<>();
        reqBody.put("source_code", Base64.getEncoder().encodeToString(code.getBytes()));
        reqBody.put("language_id", languageId);
        reqBody.put("stdin",       Base64.getEncoder().encodeToString(input.getBytes()));
        reqBody.put("base64_encoded", true);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(reqBody, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(
                judge0Url + "/submissions?base64_encoded=true&wait=true",
                entity, Map.class
        );

        Map<String, Object> result = response.getBody();
        if (result == null) return "ERROR: No response";

        String stdout     = decode(result.get("stdout"));
        String stderr     = decode(result.get("stderr"));
        String compileOut = decode(result.get("compile_output"));

        if (stderr     != null && !stderr.isBlank())     return "ERROR: " + stderr;
        if (compileOut != null && !compileOut.isBlank()) return "ERROR: " + compileOut;
        return stdout != null ? stdout.trim() : "";
    }

    private String decode(Object val) {
        if (val == null) return null;
        try {
            return new String(Base64.getDecoder().decode(val.toString().trim()));
        } catch (Exception e) {
            return val.toString();
        }
    }
}