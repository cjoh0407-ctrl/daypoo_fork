package com.daypoo.api.dto;

import lombok.Builder;

@Builder
public record AdminStatsResponse(
    long totalUsers, long totalRecords, long pendingInquiries, long totalToilets) {}
