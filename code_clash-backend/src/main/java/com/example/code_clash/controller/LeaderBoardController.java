package com.example.code_clash.controller;

import com.example.code_clash.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
public class LeaderBoardController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/leaderboard")
    public List<Map<String, Object>> getLeaderboard() {
        return userRepository.findAll()
                .stream()
                .sorted((a, b) -> b.getRating() - a.getRating())
                .map(u -> Map.<String, Object>of(
                        "id", u.getId(),
                        "username", u.getUsername(),
                        "rating", u.getRating()
                ))
                .collect(Collectors.toList());
    }
}
