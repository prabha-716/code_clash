// src/main/java/com/example/code_clash/controller/FriendController.java

package com.example.code_clash.controller;

import com.example.code_clash.entity.User;
import com.example.code_clash.service.FriendService;
import com.example.code_clash.service.OnlineUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/friends")
public class FriendController {

    @Autowired
    private FriendService friendService;

    // POST /friends/request?receiverId=2
    @PostMapping("/request")
    public Map<String, String> sendRequest(@AuthenticationPrincipal User user,
                                           @RequestParam Long receiverId) {
        return friendService.sendRequest(user, receiverId);
    }

    // POST /friends/accept?friendshipId=1
    @PostMapping("/accept")
    public Map<String, String> acceptRequest(@AuthenticationPrincipal User user,
                                             @RequestParam Long friendshipId) {
        return friendService.acceptRequest(user, friendshipId);
    }

    @Autowired
    private OnlineUserService onlineUserService;

    @GetMapping
    public List<Map<String, Object>> getFriends(@AuthenticationPrincipal User user) {
        return friendService.getFriends(user)
                .stream()
                .map(f -> {
                    Map<String, Object> friendMap = new java.util.HashMap<>(f);
                    // ✅ add online status
                    friendMap.put("online", onlineUserService.isOnline(f.get("id").toString()));
                    return friendMap;
                })
                .collect(Collectors.toList());
    }

    // GET /friends/requests — pending incoming requests
    @GetMapping("/requests")
    public List<Map<String, Object>> getPendingRequests(@AuthenticationPrincipal User user) {
        return friendService.getPendingRequests(user);
    }
}