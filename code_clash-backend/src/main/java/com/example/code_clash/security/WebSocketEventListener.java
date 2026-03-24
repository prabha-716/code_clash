package com.example.code_clash.security;

import com.example.code_clash.service.OnlineUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

@Component
public class WebSocketEventListener {

    @Autowired
    private OnlineUserService onlineUserService;

    @EventListener
    public void handleConnect(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String userId = getUserId(accessor);
        if (userId != null) {
            onlineUserService.userConnected(userId);
            System.out.println("✅ User connected: " + userId);
        }
    }

    // ✅ also mark online on subscribe (more reliable)
    @EventListener
    public void handleSubscribe(SessionSubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String userId = getUserId(accessor);
        if (userId != null) {
            onlineUserService.userConnected(userId);
        }
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String userId = getUserId(accessor);
        if (userId != null) {
            onlineUserService.userDisconnected(userId);
            System.out.println("❌ User disconnected: " + userId);
        }
    }

    private String getUserId(StompHeaderAccessor accessor) {
        // try principal first
        if (accessor.getUser() != null && accessor.getUser().getName() != null) {
            return accessor.getUser().getName();
        }
        // fallback to session attributes
        if (accessor.getSessionAttributes() != null) {
            Object user = accessor.getSessionAttributes().get("userId");
            if (user != null) return user.toString();
        }
        return null;
    }
}