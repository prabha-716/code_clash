// src/main/java/com/example/code_clash/entity/Battle.java

package com.example.code_clash.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "battles")
@Getter
@Setter
public class Battle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String roomId; // unique UUID for this battle

    @ManyToOne
    private User player1;

    @ManyToOne
    private User player2;

    @ManyToOne
    private Problem problem;

    private String status; // "WAITING", "ONGOING", "FINISHED"

    private String winnerId;

    private LocalDateTime startedAt;
}