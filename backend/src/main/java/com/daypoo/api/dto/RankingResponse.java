package com.daypoo.api.dto;

import lombok.Builder;
import java.util.List;

@Builder
public record RankingResponse(
    List<UserRankResponse> topRankers,
    UserRankResponse myRank
) {}
