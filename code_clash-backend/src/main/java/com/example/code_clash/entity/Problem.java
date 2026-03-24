package com.example.code_clash.entity;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "problems")
@Getter
@Setter
public class Problem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String difficulty;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "problem_examples")
    private List<String> examples;

    @Column(columnDefinition = "TEXT")
    private String testCases;
}
