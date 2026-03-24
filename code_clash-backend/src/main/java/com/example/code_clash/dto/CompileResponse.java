package com.example.code_clash.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CompileResponse {
    private String status;
    private String output;
    private String stderr;
    private String compileOutput;
    private Double time;
    private Integer memory;

    public CompileResponse(String status, String output, String stderr,
                           String compileOutput, Double time, Integer memory) {
        this.status = status;
        this.output = output;
        this.stderr = stderr;
        this.compileOutput = compileOutput;
        this.time = time;
        this.memory = memory;
    }
}