package com.example.code_clash.controller;

import com.example.code_clash.entity.Problem;
import com.example.code_clash.repository.ProblemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/problems")
public class ProblemController {
    @Autowired
    private ProblemRepository problemRepository;


    @GetMapping
    public List<Problem> getAllProblems() {
        return problemRepository.findAll();
    }

    // GET /problems/1 — get one problem by id
    @GetMapping("/{id}")
    public ResponseEntity<Problem> getProblemById(@PathVariable Long id) {
        return problemRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // GET /problems/difficulty/EASY — filter by difficulty
    @GetMapping("/difficulty/{level}")
    public List<Problem> getByDifficulty(@PathVariable String level) {
        return problemRepository.findByDifficulty(level.toUpperCase());
    }

    // POST /problems — create a problem (admin use)
    @PostMapping
    public Problem createProblem(@RequestBody Problem problem) {
        return problemRepository.save(problem);
    }
}
