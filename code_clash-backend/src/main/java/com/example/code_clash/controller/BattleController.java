package com.example.code_clash.controller;

import com.example.code_clash.entity.Battle;
import com.example.code_clash.entity.User;
import com.example.code_clash.repository.BattleRepository;
import com.example.code_clash.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/battle")
@RequiredArgsConstructor
public class BattleController {

    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    private BattleRepository battleRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * POST /battle/forfeit
     * Called when a player clicks "Exit / Forfeit" mid-battle.
     * - Marks the battle FINISHED with the opponent as winner
     * - Winner gets +3 rating, forfeiter gets -2 rating (floor 0)
     * - Broadcasts BATTLE_END to both players via WebSocket
     */
    @PostMapping("/forfeit")
    public Map<String, Object> forfeit(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {

        String roomId = (String) body.get("roomId");

        Battle battle = battleRepository.findByRoomId(roomId)
                .orElseThrow(() -> new RuntimeException("Battle not found"));

        // Guard: only forfeit ongoing battles
        if (!battle.getStatus().equals("ONGOING")) {
            return Map.of("status", "ERROR", "reason", "Battle already finished");
        }

        // Guard: caller must be a participant
        boolean isPlayer = battle.getPlayer1().getId().equals(user.getId()) ||
                battle.getPlayer2().getId().equals(user.getId());
        if (!isPlayer) {
            return Map.of("status", "ERROR", "reason", "Not your battle");
        }

        // Determine winner (the one who did NOT forfeit)
        User forfeiter = user;
        User winner    = battle.getPlayer1().getId().equals(user.getId())
                ? battle.getPlayer2()
                : battle.getPlayer1();

        // Persist battle result
        battle.setStatus("FINISHED");
        battle.setWinnerId(winner.getId().toString());
        battleRepository.save(battle);

        // Rating deltas: winner +3, forfeiter -2 (floor at 0)
        int winnerDelta   = 3;
        int forfeiterDelta = -2;

        int winnerNewRating   = Math.max(0, winner.getRating()   + winnerDelta);
        int forfeiterNewRating = Math.max(0, forfeiter.getRating() + forfeiterDelta);

        winner.setRating(winnerNewRating);
        forfeiter.setRating(forfeiterNewRating);
        userRepository.save(winner);
        userRepository.save(forfeiter);

        // Notify winner: they won because opponent forfeited
        messagingTemplate.convertAndSendToUser(
                winner.getId().toString(), "/queue/battle",
                Map.of(
                        "type",         "BATTLE_END",
                        "result",       "FORFEIT",          // frontend treats FORFEIT as WIN
                        "winner",       winner.getUsername(),
                        "forfeiter",    forfeiter.getUsername(),
                        "ratingDelta",  winnerDelta,
                        "newRating",    winnerNewRating
                )
        );

        // Notify forfeiter: they lost
        messagingTemplate.convertAndSendToUser(
                forfeiter.getId().toString(), "/queue/battle",
                Map.of(
                        "type",         "BATTLE_END",
                        "result",       "LOSE",
                        "winner",       winner.getUsername(),
                        "forfeiter",    forfeiter.getUsername(),
                        "ratingDelta",  forfeiterDelta,
                        "newRating",    forfeiterNewRating
                )
        );

        return Map.of("status", "OK", "message", "Battle forfeited");
    }
}