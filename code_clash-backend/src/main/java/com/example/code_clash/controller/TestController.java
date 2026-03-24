package com.example.code_clash.controller;

import com.example.code_clash.entity.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/user")
    public Object user(@AuthenticationPrincipal User principal) {
        return principal;
    }

    @GetMapping("/test")
    public String test() {
        return "You are authenticated!";
    }
}