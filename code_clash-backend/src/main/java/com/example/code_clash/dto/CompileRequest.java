package com.example.code_clash.dto;


import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CompileRequest {
    private String code;
    private int languageId;
    private String stdin;
}