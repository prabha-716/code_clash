package com.example.code_clash.security;

import com.example.code_clash.entity.User;
import com.example.code_clash.repository.UserRepository;
import com.example.code_clash.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URI;
import java.util.Map;

@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) {

        URI uri = request.getURI();

        String query = uri.getQuery();

        if (query != null && query.startsWith("token=")) {
            String token = query.substring(6);

            String userId = jwtUtil.extractUserId(token);

            User user = userRepository.findById(Long.parseLong(userId)).orElse(null);

            if (user != null && jwtUtil.validateToken(token)) {
                attributes.put("userId", user.getId().toString());
                return true;
            }
        }

        return false;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request,
                               ServerHttpResponse response,
                               WebSocketHandler wsHandler,
                               Exception exception) {
    }
}