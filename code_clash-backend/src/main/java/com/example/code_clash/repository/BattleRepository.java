package com.example.code_clash.repository;

import com.example.code_clash.entity.Battle;
import com.example.code_clash.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BattleRepository extends JpaRepository<Battle, Long> {

    Optional<Battle> findByRoomId(String roomId);

    @Query(value =
            "SELECT TO_CHAR(b.started_at, '%Y-%m-%d') AS date, COUNT(*) AS count " +
                    "FROM battles b " +
                    "WHERE (b.player1_id = :userId OR b.player2_id = :userId) " +
                    "AND b.status = 'FINISHED' " +
                    "AND b.started_at IS NOT NULL " +
                    "GROUP BY TO_CHAR(b.started_at, '%Y-%m-%d') " +
                    "ORDER BY date",
            nativeQuery = true)
    List<Object[]> findHeatmapByUserId(@Param("userId") Long userId);



    List<Battle> findByPlayer1OrPlayer2OrderByStartedAtDesc(User player1, User player2);


    @Query("SELECT b FROM Battle b WHERE (b.player1 = :user OR b.player2 = :user) AND b.status = 'FINISHED' ORDER BY b.startedAt DESC")
    List<Battle> findFinishedBattlesByUser(@Param("user") User user);
}