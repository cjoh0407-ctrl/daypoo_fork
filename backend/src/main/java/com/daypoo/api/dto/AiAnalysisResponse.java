package com.daypoo.api.dto;

import lombok.Builder;

@Builder
public record AiAnalysisResponse(
    Integer bristolScale,
    String color,
    String conditionTag, // AI가 분석한 주요 컨디션
    Integer healthScore
) {}
