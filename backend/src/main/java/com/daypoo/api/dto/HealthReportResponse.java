package com.daypoo.api.dto;

import lombok.Builder;
import java.util.List;

@Builder
public record HealthReportResponse(
    String reportType,
    int healthScore,
    String summary,
    String solution,
    List<String> insights,
    String analyzedAt
) {}
