package com.example.code_clash.controller;

import com.example.code_clash.entity.Problem;
import com.example.code_clash.repository.ProblemRepository;
import com.example.code_clash.service.JudgeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/practice")
public class PracticeController {

    @Autowired private ProblemRepository problemRepository;
    @Autowired private JudgeService judgeService;

    @PostMapping("/submit")
    public ResponseEntity<?> practiceSubmit(@RequestBody Map<String, Object> body, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        Long problemId;
        int languageId;
        String code;

        try {
            problemId  = Long.parseLong(body.get("problemId").toString());
            languageId = Integer.parseInt(body.get("languageId").toString());
            code       = body.get("code").toString();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid request body"));
        }

        Problem problem = problemRepository.findById(problemId).orElse(null);
        if (problem == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Problem not found"));
        }

        // Run through all test cases — no rating change, no battle room
        Map<String, Object> result = judgeService.runAgainstTestCases(code, languageId, problem);
        return ResponseEntity.ok(result);
    }
}