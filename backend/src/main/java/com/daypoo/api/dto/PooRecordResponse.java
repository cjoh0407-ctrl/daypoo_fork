package com.daypoo.api.dto;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record PooRecordResponse(
    Long id,
    Long userId,
    Long toiletId,
    String toiletName,
    Integer bristolScale,
    String color,
    List<String> conditionTags,
    List<String> dietTags,
    Integer earnedExp,
    Integer earnedPoints,
    LocalDateTime createdAt
) {}
