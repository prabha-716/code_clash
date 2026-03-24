package com.example.code_clash.repository;

import com.example.code_clash.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User,Long> {
    Optional<User> findByProviderAndProviderId(String provider, String providerId);
}
