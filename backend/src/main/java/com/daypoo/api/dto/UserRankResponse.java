package com.daypoo.api.dto;

import lombok.Builder;

@Builder
public record UserRankResponse(
    Long userId,
    String nickname,
    String titleName,
    int level,
    long score,
    long rank
) {}
