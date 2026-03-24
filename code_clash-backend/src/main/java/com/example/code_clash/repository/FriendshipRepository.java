package com.example.code_clash.repository;

import com.example.code_clash.entity.Friendship;
import com.example.code_clash.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    Optional<Friendship> findBySenderAndReceiver(User sender, User receiver);

    @Query("SELECT f FROM Friendship f WHERE (f.sender = :user OR f.receiver = :user) AND f.status = 'ACCEPTED'")
    List<Friendship> findAllFriends(@Param("user") User user);

    List<Friendship> findByReceiverAndStatus(User receiver, String status);
}