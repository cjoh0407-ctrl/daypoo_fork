package com.daypoo.api.dto;

import java.util.List;
import lombok.Builder;

@Builder
public record HealthReportResponse(
    String reportType,
    int healthScore,
    String summary,
    String solution,
    List<String> insights,
    String analyzedAt) {}
