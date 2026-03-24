package com.example.code_clash.controller;

import com.example.code_clash.dto.CompileRequest;
import com.example.code_clash.dto.CompileResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/compile")
@RequiredArgsConstructor
public class CompileController {

    private final RestTemplate restTemplate;

    private String judge0BaseUrl = "https://ce.judge0.com";

    @PostMapping
    public ResponseEntity<CompileResponse> compile(@RequestBody CompileRequest request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            body.put("source_code", encode(request.getCode()));
            body.put("language_id", request.getLanguageId());
            body.put("stdin", request.getStdin() != null ? encode(request.getStdin()) : null);
            body.put("base64_encoded", true);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    judge0BaseUrl + "/submissions?base64_encoded=true&wait=true",
                    entity,
                    Map.class
            );

            Map<String, Object> result = response.getBody();

            if (result == null) {
                return ResponseEntity.status(500).body(
                        new CompileResponse("ERROR", null, "No response from Judge0", null, null, null)
                );
            }

            String output     = decode(result.get("stdout"));
            String stderr     = decode(result.get("stderr"));
            String compileOut = decode(result.get("compile_output"));
            String status     = extractStatus(result);

            Double time = result.get("time") != null
                    ? Double.parseDouble(result.get("time").toString())
                    : null;

            Integer memory = result.get("memory") != null
                    ? Integer.parseInt(result.get("memory").toString())
                    : null;

            return ResponseEntity.ok(
                    new CompileResponse(status, output, stderr, compileOut, time, memory)
            );

        } catch (Exception e) {
            return ResponseEntity.status(500).body(
                    new CompileResponse("ERROR", null, e.getMessage(), null, null, null)
            );
        }
    }

    private String encode(String data) {
        return Base64.getEncoder().encodeToString(data.getBytes());
    }

    private String decode(Object val) {
        if (val == null) return null;
        try {
            return new String(Base64.getDecoder().decode(val.toString()));
        } catch (Exception e) {
            return val.toString();
        }
    }

    @SuppressWarnings("unchecked")
    private String extractStatus(Map<String, Object> map) {
        Object statusObj = map.get("status");
        if (statusObj instanceof Map<?, ?> statusMap) {
            return statusMap.get("description").toString();
        }
        return "Unknown";
    }
}