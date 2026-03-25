package com.daypoo.api.dto;

import java.util.List;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record HealthReportResponse(
    String reportType,
    int healthScore,
    String summary,
    String solution,
    List<String> insights,
    int recordCount,
    LocalDateTime periodStart,
    LocalDateTime periodEnd,
    String analyzedAt) {}
