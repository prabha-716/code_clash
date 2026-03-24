package com.example.code_clash.repository;

import com.example.code_clash.entity.Problem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProblemRepository extends JpaRepository<Problem,Long> {
    List<Problem> findByDifficulty(String difficulty);

    boolean existsByTitle(String title);

    // picks a random problem — useful for matchmaking
    @Query(value = "SELECT * FROM problems ORDER BY RANDOM() LIMIT 1", nativeQuery = true)
    Problem findRandomProblem();
}
