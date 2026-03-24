package com.example.code_clash.controller;

import com.example.code_clash.entity.Battle;
import com.example.code_clash.entity.Problem;
import com.example.code_clash.entity.User;
import com.example.code_clash.repository.BattleRepository;
import com.example.code_clash.repository.ProblemRepository;
import com.example.code_clash.repository.UserRepository;
import com.example.code_clash.service.FriendService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Controller
public class WebSocketController {

    @Autowired private FriendService friendService;
    @Autowired private BattleRepository battleRepository;
    @Autowired private ProblemRepository problemRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private SimpMessagingTemplate messagingTemplate;

    // ✅ use @Payload String instead of reading raw bytes
    @MessageMapping("/challenge.send")
    public void sendChallenge(@Payload String body, Message<?> message) {
        SimpMessageHeaderAccessor accessor = SimpMessageHeaderAccessor.wrap(message);

        // ✅ get userId from principal instead of session attribute
        String userId = accessor.getUser() != null ? accessor.getUser().getName() : null;

        if (userId == null) {
            System.out.println("❌ userId is null in challenge.send");
            return;
        }

        User sender = userRepository.findById(Long.parseLong(userId)).orElse(null);
        if (sender == null) {
            System.out.println("❌ sender not found for userId: " + userId);
            return;
        }

        Long friendId;
        try {
            friendId = Long.parseLong(body.trim());
        } catch (Exception e) {
            System.out.println("❌ invalid friendId: " + body);
            return;
        }

        System.out.println("⚔️ Challenge from " + sender.getUsername() + " to userId " + friendId);

        User friend = userRepository.findById(friendId).orElse(null);
        if (friend == null) {
            System.out.println("❌ friend not found: " + friendId);
            return;
        }

        if (!friendService.areFriends(sender, friend)) {
            messagingTemplate.convertAndSendToUser(
                    sender.getId().toString(), "/queue/battle",
                    Map.of("type", "ERROR", "message", "Not friends")
            );
            return;
        }

        messagingTemplate.convertAndSendToUser(
                friend.getId().toString(), "/queue/battle",
                Map.of(
                        "type", "CHALLENGE_REQUEST",
                        "fromId", sender.getId(),
                        "fromUsername", sender.getUsername(),
                        "fromRating", sender.getRating()
                )
        );

        messagingTemplate.convertAndSendToUser(
                sender.getId().toString(), "/queue/battle",
                Map.of("type", "CHALLENGE_SENT", "toUsername", friend.getUsername())
        );

        System.out.println("✅ Challenge sent to " + friend.getUsername());
    }

    @MessageMapping("/challenge.accept")
    public void acceptChallenge(@Payload String body, Message<?> message) {
        SimpMessageHeaderAccessor accessor = SimpMessageHeaderAccessor.wrap(message);
        String userId = accessor.getUser() != null ? accessor.getUser().getName() : null;
        if (userId == null) return;

        User accepter = userRepository.findById(Long.parseLong(userId)).orElse(null);
        if (accepter == null) return;

        Long challengerId;
        try {
            challengerId = Long.parseLong(body.trim());
        } catch (Exception e) { return; }

        User challenger = userRepository.findById(challengerId).orElse(null);
        if (challenger == null) return;

        Problem problem = problemRepository.findRandomProblem();
        Battle battle = new Battle();
        battle.setRoomId(UUID.randomUUID().toString());
        battle.setPlayer1(challenger);
        battle.setPlayer2(accepter);
        battle.setProblem(problem);
        battle.setStatus("ONGOING");
        battle.setStartedAt(LocalDateTime.now());
        battleRepository.save(battle);

        // In acceptChallenge method — replace problemData map
        Map<String, Object> problemData = new java.util.HashMap<>();
        problemData.put("id", problem.getId());
        problemData.put("title", problem.getTitle());
        problemData.put("description", problem.getDescription());
        problemData.put("difficulty", problem.getDifficulty());
// ✅ convert to new ArrayList to detach from Hibernate session
        problemData.put("examples", problem.getExamples() != null
                ? new java.util.ArrayList<>(problem.getExamples())
                : new java.util.ArrayList<>()

        );
        problemData.put("testCases", problem.getTestCases());

        messagingTemplate.convertAndSendToUser(
                challenger.getId().toString(), "/queue/battle",
                Map.of(
                        "type", "BATTLE_START",
                        "roomId", battle.getRoomId(),
                        "opponent", accepter.getUsername(),
                        "opponentRating", accepter.getRating(),
                        "problem", problemData
                )
        );

        messagingTemplate.convertAndSendToUser(
                accepter.getId().toString(), "/queue/battle",
                Map.of(
                        "type", "BATTLE_START",
                        "roomId", battle.getRoomId(),
                        "opponent", challenger.getUsername(),
                        "opponentRating", challenger.getRating(),
                        "problem", problemData
                )
        );

        System.out.println("🏟️ Battle started: " + battle.getRoomId());
    }

    @MessageMapping("/challenge.decline")
    public void declineChallenge(@Payload String body, Message<?> message) {
        SimpMessageHeaderAccessor accessor = SimpMessageHeaderAccessor.wrap(message);
        String userId = accessor.getUser() != null ? accessor.getUser().getName() : null;
        if (userId == null) return;

        User decliner = userRepository.findById(Long.parseLong(userId)).orElse(null);
        if (decliner == null) return;

        Long challengerId;
        try {
            challengerId = Long.parseLong(body.trim());
        } catch (Exception e) { return; }

        messagingTemplate.convertAndSendToUser(
                challengerId.toString(), "/queue/battle",
                Map.of("type", "CHALLENGE_DECLINED", "byUsername", decliner.getUsername())
        );
    }
}
