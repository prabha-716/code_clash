package com.example.code_clash.service;

import org.springframework.stereotype.Service;
import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OnlineUserService {

    private final Set<String> onlineUsers = Collections.newSetFromMap(new ConcurrentHashMap<>());

    public void userConnected(String userId) {
        onlineUsers.add(userId);
        System.out.println("🟢 Online users: " + onlineUsers);
    }

    public void userDisconnected(String userId) {
        onlineUsers.remove(userId);
    }

    public boolean isOnline(String userId) {
        return onlineUsers.contains(userId);
    }

    public Set<String> getOnlineUsers() {
        return Collections.unmodifiableSet(onlineUsers);
    }
}