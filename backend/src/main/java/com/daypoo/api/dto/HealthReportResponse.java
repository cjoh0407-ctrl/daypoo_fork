package com.daypoo.api.dto;

import java.time.LocalDateTime;
import java.util.List;
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
    String analyzedAt,
    Integer mostFrequentBristol,
    String mostFrequentCondition,
    String mostFrequentDiet,
    Integer healthyRatio) {}
