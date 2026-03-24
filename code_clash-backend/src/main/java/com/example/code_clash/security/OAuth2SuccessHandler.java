package com.example.code_clash.security;

import com.example.code_clash.entity.User;
import com.example.code_clash.repository.UserRepository;
import com.example.code_clash.utils.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.security.web.savedrequest.HttpSessionRequestCache;

import java.io.IOException;
import java.util.Map;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

        Map<String, Object> attributes = oauthUser.getAttributes();

        String providerId = attributes.get("id").toString();

        User user = userRepository
                .findByProviderAndProviderId("github", providerId)
                .orElseThrow();

        String token = jwtUtil.generateToken(user);
        System.out.println(token);

        new HttpSessionRequestCache().removeRequest(request, response);

        clearAuthenticationAttributes(request);

        response.sendRedirect("http://localhost:5173/?token=" + token);
    }
}
