package com.example.code_clash.config;

import com.example.code_clash.entity.Problem;
import com.example.code_clash.repository.ProblemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private ProblemRepository problemRepository;

    @Override
    public void run(String... args) {
        seedIfMissing("Two Sum",
                "Given an array of integers and a target, return indices of two numbers that add up to target.",
                "EASY",
                List.of(
                        "Input: nums=[2,7,11,15], target=9 → Output: [0,1]",
                        "Input: nums=[3,2,4], target=6 → Output: [1,2]"
                ),
                "[" +
                        "{\"input\":\"4\\n2 7 11 15\\n9\",\"output\":\"0 1\"}," +
                        "{\"input\":\"3\\n3 2 4\\n6\",\"output\":\"1 2\"}," +
                        "{\"input\":\"2\\n1 5\\n6\",\"output\":\"0 1\"}" +
                        "]"
        );

        seedIfMissing("Reverse String",
                "Write a function that reverses a string. Read the string from stdin and print the reversed string.",
                "EASY",
                List.of(
                        "Input: hello → Output: olleh",
                        "Input: world → Output: dlrow"
                ),
                "[" +
                        "{\"input\":\"hello\",\"output\":\"olleh\"}," +
                        "{\"input\":\"world\",\"output\":\"dlrow\"}," +
                        "{\"input\":\"abcde\",\"output\":\"edcba\"}" +
                        "]"
        );

        seedIfMissing("Count Vowels",
                "Given a string, count and print the number of vowels (a, e, i, o, u — case-insensitive).",
                "EASY",
                List.of(
                        "Input: Hello World → Output: 3",
                        "Input: rhythm → Output: 0"
                ),
                "[" +
                        "{\"input\":\"Hello World\",\"output\":\"3\"}," +
                        "{\"input\":\"rhythm\",\"output\":\"0\"}," +
                        "{\"input\":\"aeiou\",\"output\":\"5\"}" +
                        "]"
        );

        seedIfMissing("Fibonacci Number",
                "Given a number N, print the N-th Fibonacci number (0-indexed). F(0)=0, F(1)=1.",
                "EASY",
                List.of(
                        "Input: 6 → Output: 8",
                        "Input: 10 → Output: 55"
                ),
                "[" +
                        "{\"input\":\"6\",\"output\":\"8\"}," +
                        "{\"input\":\"10\",\"output\":\"55\"}," +
                        "{\"input\":\"0\",\"output\":\"0\"}," +
                        "{\"input\":\"1\",\"output\":\"1\"}" +
                        "]"
        );

        seedIfMissing("Palindrome Check",
                "Given a string, determine if it reads the same forwards and backwards. Print 'true' or 'false'.",
                "EASY",
                List.of(
                        "Input: racecar → Output: true",
                        "Input: hello → Output: false"
                ),
                "[" +
                        "{\"input\":\"racecar\",\"output\":\"true\"}," +
                        "{\"input\":\"hello\",\"output\":\"false\"}," +
                        "{\"input\":\"madam\",\"output\":\"true\"}" +
                        "]"
        );

        seedIfMissing("Valid Parentheses",
                "Given a string containing '(', ')', '{', '}', '[', ']', determine if the input string is valid. Print 'true' or 'false'.",
                "MEDIUM",
                List.of(
                        "Input: \"()[]{}\" → Output: true",
                        "Input: \"([)]\" → Output: false"
                ),
                "[" +
                        "{\"input\":\"()[]{}\",\"output\":\"true\"}," +
                        "{\"input\":\"([)]\",\"output\":\"false\"}," +
                        "{\"input\":\"{[]}\",\"output\":\"true\"}," +
                        "{\"input\":\"(\",\"output\":\"false\"}" +
                        "]"
        );

        seedIfMissing("Longest Common Prefix",
                "Given N strings (one per line after the count), find and print the longest common prefix among all of them. Print an empty line if there is none.",
                "MEDIUM",
                List.of(
                        "Input: 3 / flower / flow / flight → Output: fl",
                        "Input: 3 / dog / racecar / car → Output: (empty)"
                ),
                "[" +
                        "{\"input\":\"3\\nflower\\nflow\\nflight\",\"output\":\"fl\"}," +
                        "{\"input\":\"3\\ndog\\nracecar\\ncar\",\"output\":\"\"}," +
                        "{\"input\":\"2\\ninterspecies\\ninterstellar\",\"output\":\"inters\"}" +
                        "]"
        );

        seedIfMissing("Maximum Subarray",
                "Given an array of N integers, find the contiguous subarray with the largest sum and print it. (Kadane's Algorithm)",
                "MEDIUM",
                List.of(
                        "Input: N=9, nums=[-2,1,-3,4,-1,2,1,-5,4] → Output: 6",
                        "Input: N=1, nums=[1] → Output: 1"
                ),
                "[" +
                        "{\"input\":\"9\\n-2 1 -3 4 -1 2 1 -5 4\",\"output\":\"6\"}," +
                        "{\"input\":\"1\\n1\",\"output\":\"1\"}," +
                        "{\"input\":\"4\\n-2 -3 -1 -4\",\"output\":\"-1\"}" +
                        "]"
        );

        seedIfMissing("Group Anagrams Count",
                "Given N words (one per line after the count), print the number of groups of anagrams.",
                "MEDIUM",
                List.of(
                        "Input: 6 / eat / tea / tan / ate / nat / bat → Output: 3",
                        "Input: 1 / a → Output: 1"
                ),
                "[" +
                        "{\"input\":\"6\\neat\\ntea\\ntan\\nate\\nnat\\nbat\",\"output\":\"3\"}," +
                        "{\"input\":\"1\\na\",\"output\":\"1\"}," +
                        "{\"input\":\"4\\nabc\\ncba\\nbca\\nxyz\",\"output\":\"2\"}" +
                        "]"
        );

        seedIfMissing("Number of Islands",
                "Given an R×C grid of '1's (land) and '0's (water), count the number of islands. Input: first line is R and C, then R lines of C characters.",
                "MEDIUM",
                List.of(
                        "Input: 4×5 grid with two island clusters → Output: 3",
                        "Input: 4×5 all-water grid → Output: 0"
                ),
                "[" +
                        "{\"input\":\"4 5\\n11110\\n11010\\n11000\\n00000\",\"output\":\"1\"}," +
                        "{\"input\":\"4 5\\n11000\\n11000\\n00100\\n00011\",\"output\":\"3\"}," +
                        "{\"input\":\"1 1\\n0\",\"output\":\"0\"}" +
                        "]"
        );

        seedIfMissing("Trapping Rain Water",
                "Given N non-negative integers representing an elevation map where each bar has width 1, compute how much water it can trap after raining.",
                "HARD",
                List.of(
                        "Input: N=12, height=[0,1,0,2,1,0,1,3,2,1,2,1] → Output: 6",
                        "Input: N=6, height=[4,2,0,3,2,5] → Output: 9"
                ),
                "[" +
                        "{\"input\":\"12\\n0 1 0 2 1 0 1 3 2 1 2 1\",\"output\":\"6\"}," +
                        "{\"input\":\"6\\n4 2 0 3 2 5\",\"output\":\"9\"}," +
                        "{\"input\":\"3\\n3 0 2\",\"output\":\"2\"}" +
                        "]"
        );

        seedIfMissing("Median of Two Sorted Arrays",
                "Given two sorted arrays of sizes M and N, find and print their median. If the median is a whole number print it without decimals, otherwise print with one decimal place.",
                "HARD",
                List.of(
                        "Input: [1,3] and [2] → Output: 2",
                        "Input: [1,2] and [3,4] → Output: 2.5"
                ),
                "[" +
                        "{\"input\":\"2\\n1 3\\n1\\n2\",\"output\":\"2\"}," +
                        "{\"input\":\"2\\n1 2\\n2\\n3 4\",\"output\":\"2.5\"}," +
                        "{\"input\":\"1\\n0\\n1\\n0\",\"output\":\"0\"}" +
                        "]"
        );

        seedIfMissing("Word Ladder Length",
                "Given a begin word, end word, and a dictionary of N words (one per line), find the length of the shortest transformation sequence from begin to end, changing one letter at a time. Print 0 if no path exists.",
                "HARD",
                List.of(
                        "Input: hit → cog, dict=[hot,dot,dog,lot,log,cog] → Output: 5",
                        "Input: hit → cog, dict=[hot,dot,dog,lot,log] → Output: 0"
                ),
                "[" +
                        "{\"input\":\"hit\\ncog\\n6\\nhot\\ndot\\ndog\\nlot\\nlog\\ncog\",\"output\":\"5\"}," +
                        "{\"input\":\"hit\\ncog\\n5\\nhot\\ndot\\ndog\\nlot\\nlog\",\"output\":\"0\"}," +
                        "{\"input\":\"a\\nc\\n2\\na\\nb\",\"output\":\"0\"}" +
                        "]"
        );

        System.out.println("✅ Seeder complete — all problems up to date.");
    }

    /**
     * Inserts a problem only if no problem with that title already exists.
     * Safe to run on every startup — never creates duplicates, always adds new ones.
     */
    private void seedIfMissing(String title, String description, String difficulty,
                               List<String> examples, String testCases) {
        if (problemRepository.existsByTitle(title)) return;

        Problem p = new Problem();
        p.setTitle(title);
        p.setDescription(description);
        p.setDifficulty(difficulty);
        p.setExamples(examples);
        p.setTestCases(testCases);
        problemRepository.save(p);
        System.out.println("  ➕ Seeded: " + title);
    }
}