package com.example.code_clash.dto;

import lombok.Getter;

@Getter
public class HeatmapEntry {

    private String date;
    private long count;

    public HeatmapEntry(String date, long count) {
        this.date = date;
        this.count = count;
    }
}