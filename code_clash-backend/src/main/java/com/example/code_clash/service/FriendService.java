package com.example.code_clash.service;

import com.example.code_clash.entity.Friendship;
import com.example.code_clash.entity.User;
import com.example.code_clash.repository.FriendshipRepository;
import com.example.code_clash.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FriendService {

    @Autowired
    private FriendshipRepository friendshipRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // send a friend request
    public Map<String, String> sendRequest(User sender, Long receiverId) {

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (sender.getId().equals(receiverId)) {
            return Map.of("error", "You cannot add yourself");
        }

        boolean alreadyExists =
                friendshipRepository.findBySenderAndReceiver(sender, receiver).isPresent() ||
                        friendshipRepository.findBySenderAndReceiver(receiver, sender).isPresent();

        if (alreadyExists) {
            return Map.of("error", "Request already sent or already friends");
        }

        Friendship friendship = new Friendship();
        friendship.setSender(sender);
        friendship.setReceiver(receiver);
        friendship.setStatus("PENDING");
        friendshipRepository.save(friendship);

        // ✅ notify receiver instantly via WebSocket
        messagingTemplate.convertAndSendToUser(
                receiver.getId().toString(),
                "/queue/battle",
                Map.of(
                        "type", "FRIEND_REQUEST",
                        "friendshipId", friendship.getId(),
                        "fromUsername", sender.getUsername(),
                        "fromId", sender.getId()
                )
        );

        return Map.of("message", "Friend request sent to " + receiver.getUsername());
    }

    // accept a friend request
    public Map<String, String> acceptRequest(User receiver, Long friendshipId) {

        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!friendship.getReceiver().getId().equals(receiver.getId())) {
            return Map.of("error", "Not your request to accept");
        }

        friendship.setStatus("ACCEPTED");
        friendshipRepository.save(friendship);

        // ✅ notify sender that request was accepted
        messagingTemplate.convertAndSendToUser(
                friendship.getSender().getId().toString(),
                "/queue/battle",
                Map.of(
                        "type", "FRIEND_ACCEPTED",
                        "fromUsername", receiver.getUsername(),
                        "fromId", receiver.getId()
                )
        );

        return Map.of("message", "You are now friends with " + friendship.getSender().getUsername());
    }

    // get all friends
    // FriendService.java — inject OnlineUserService and add online field

    @Autowired
    private OnlineUserService onlineUserService;

    public List<Map<String, Object>> getFriends(User user) {
        return friendshipRepository.findAllFriends(user)
                .stream()
                .map(f -> {
                    User friend = f.getSender().getId().equals(user.getId())
                            ? f.getReceiver()
                            : f.getSender();

                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("friendshipId", f.getId());
                    map.put("id", friend.getId());
                    map.put("username", friend.getUsername());
                    map.put("rating", friend.getRating());
                    // ✅ check online status
                    map.put("online", onlineUserService.isOnline(friend.getId().toString()));
                    return map;
                })
                .collect(Collectors.toList());
    }

    // get pending requests
    public List<Map<String, Object>> getPendingRequests(User user) {
        return friendshipRepository.findByReceiverAndStatus(user, "PENDING")
                .stream()
                .map(f -> Map.<String, Object>of(
                        "friendshipId", f.getId(),
                        "from", f.getSender().getUsername(),
                        "fromId", f.getSender().getId()
                ))
                .collect(Collectors.toList());
    }

    // check if two users are friends
    public boolean areFriends(User user1, User user2) {
        return friendshipRepository.findBySenderAndReceiver(user1, user2)
                .map(f -> f.getStatus().equals("ACCEPTED"))
                .orElse(
                        friendshipRepository.findBySenderAndReceiver(user2, user1)
                                .map(f -> f.getStatus().equals("ACCEPTED"))
                                .orElse(false)
                );
    }
}