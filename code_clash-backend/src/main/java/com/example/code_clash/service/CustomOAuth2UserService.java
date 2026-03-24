package com.example.code_clash.service;

import com.example.code_clash.entity.User;
import com.example.code_clash.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    @Autowired
    private UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User oauthUser = super.loadUser(request);

        Map<String,Object> attributes = oauthUser.getAttributes();

        String provider = request.getClientRegistration().getRegistrationId();
        String providerId = attributes.get("id").toString();
        String username = (String) attributes.get("login");
        String email = (String) attributes.get("email");

        Optional<User> existingUser = userRepository.findByProviderAndProviderId(provider, providerId);

        User user;

        if(existingUser.isPresent()){
            user = existingUser.get();
        }else{
            user = new User();
            user.setProvider(provider);
            user.setProviderId(providerId);
            user.setUsername(username);
            user.setEmail(email);
            userRepository.save(user);
        }
        return oauthUser;
    }
}
