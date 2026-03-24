package com.example.code_clash.service;

import com.example.code_clash.entity.Problem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class JudgeService {

    private final RestTemplate restTemplate;

    // Falls back to the free public Judge0 instance — same as CompileController
    @Value("${judge0.base-url:https://ce.judge0.com}")
    private String judge0BaseUrl;

    public JudgeService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    // ─────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────

    /**
     * Run {@code code} against every test case in {@code problem}.
     * Returns a map shaped exactly like what the frontend expects:
     * <pre>
     * {
     *   "status":      "ACCEPTED" | "WRONG_ANSWER" | "ERROR",
     *   "testResults": [ { index, passed, input, expected, actual, error } ]
     * }
     * </pre>
     */
    public Map<String, Object> runAgainstTestCases(String code, int languageId, Problem problem) {
        List<Map<String, Object>> testCases = parseTestCases(problem.getTestCases());

        if (testCases.isEmpty()) {
            return buildResult("ERROR", Collections.emptyList(), "No test cases found for this problem.");
        }

        List<Map<String, Object>> testResults = new ArrayList<>();
        boolean allPassed = true;

        for (int i = 0; i < testCases.size(); i++) {
            Map<String, Object> tc     = testCases.get(i);
            String input               = getString(tc, "input");
            String expectedRaw         = getString(tc, "output");
            String expected            = expectedRaw != null ? expectedRaw.trim() : "";

            Map<String, Object> tcResult = new LinkedHashMap<>();
            tcResult.put("index", i + 1);
            tcResult.put("input", input);
            tcResult.put("expected", expected);

            try {
                Map<String, Object> judge0Response = submitToJudge0(code, languageId, input);
                String status  = extractStatus(judge0Response);
                String stdout  = decode(judge0Response.get("stdout"));
                String stderr  = decode(judge0Response.get("stderr"));
                String compile = decode(judge0Response.get("compile_output"));
                String actual  = stdout != null ? stdout.trim() : "";

                boolean passed = "Accepted".equalsIgnoreCase(status) && actual.equals(expected);

                tcResult.put("passed", passed);
                tcResult.put("actual", actual);

                if (!passed) {
                    allPassed = false;
                    if (hasRuntimeError(status)) {
                        String errMsg = stderr != null ? stderr : compile;
                        tcResult.put("error", "ERROR: " + (errMsg != null ? errMsg.trim() : status));
                    } else {
                        // Wrong answer — no error tag, just the bad output
                        tcResult.put("error", actual.isEmpty() ? "(empty output)" : null);
                    }
                } else {
                    tcResult.put("error", null);
                }

            } catch (Exception e) {
                allPassed = false;
                tcResult.put("passed", false);
                tcResult.put("actual", null);
                tcResult.put("error", "ERROR: " + e.getMessage());
            }

            testResults.add(tcResult);
        }

        String overallStatus = allPassed ? "ACCEPTED" : "WRONG_ANSWER";
        return buildResult(overallStatus, testResults, null);
    }

    // ─────────────────────────────────────────────────────────────
    // Judge0 interaction
    // ─────────────────────────────────────────────────────────────

    /**
     * POST a single submission to Judge0 with wait=true and return the raw response body.
     */
    private Map<String, Object> submitToJudge0(String code, int languageId, String stdin) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("source_code",   encode(code));
        body.put("language_id",   languageId);
        body.put("stdin",         stdin != null ? encode(stdin) : null);
        body.put("base64_encoded", true);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        @SuppressWarnings("unchecked")
        ResponseEntity<Map> response = restTemplate.postForEntity(
                judge0BaseUrl + "/submissions?base64_encoded=true&wait=true",
                entity,
                Map.class
        );

        if (response.getBody() == null) {
            throw new RuntimeException("No response from Judge0");
        }

        //noinspection unchecked
        return (Map<String, Object>) response.getBody();
    }

    // ─────────────────────────────────────────────────────────────
    // Test-case parsing
    // ─────────────────────────────────────────────────────────────

    /**
     * Parse the JSON string stored in {@code problem.testCases}.
     * Accepts both:
     *   - JSON array:  [{"input":"...","output":"..."},...]
     *   - JSON object: {"input":"...","output":"..."} (single case)
     */
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parseTestCases(String testCasesJson) {
        if (testCasesJson == null || testCasesJson.isBlank()) return Collections.emptyList();

        try {
            // Try array first
            if (testCasesJson.trim().startsWith("[")) {
                // Minimal JSON array parsing without Jackson dependency
                // If you already have Jackson on the classpath (you almost certainly do via Spring Boot):
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                return mapper.readValue(testCasesJson,
                        mapper.getTypeFactory().constructCollectionType(List.class, Map.class));
            } else if (testCasesJson.trim().startsWith("{")) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                Map<String, Object> single = mapper.readValue(testCasesJson, Map.class);
                return Collections.singletonList(single);
            }
        } catch (Exception e) {
            // fall through
        }
        return Collections.emptyList();
    }

    // ─────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────

    private Map<String, Object> buildResult(String status,
                                            List<Map<String, Object>> testResults,
                                            String errorMessage) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", status);
        result.put("testResults", testResults);
        if (errorMessage != null) result.put("error", errorMessage);
        return result;
    }

    @SuppressWarnings("unchecked")
    private String extractStatus(Map<String, Object> map) {
        Object statusObj = map.get("status");
        if (statusObj instanceof Map<?, ?> statusMap) {
            Object desc = statusMap.get("description");
            return desc != null ? desc.toString() : "Unknown";
        }
        return "Unknown";
    }

    private boolean hasRuntimeError(String status) {
        if (status == null) return false;
        String s = status.toLowerCase();
        return s.contains("error") || s.contains("exception")
                || s.contains("time limit") || s.contains("memory limit")
                || s.contains("runtime");
    }

    private String encode(String data) {
        if (data == null) return null;
        return Base64.getEncoder().encodeToString(data.getBytes());
    }

    private String decode(Object val) {
        if (val == null) return null;
        try {
            return new String(Base64.getDecoder().decode(val.toString().trim()));
        } catch (Exception e) {
            return val.toString();
        }
    }

    private String getString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }
}