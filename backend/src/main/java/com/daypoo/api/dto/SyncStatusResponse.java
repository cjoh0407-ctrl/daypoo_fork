package com.daypoo.api.dto;

import lombok.Builder;

@Builder
public record SyncStatusResponse(
    String status, // "IDLE", "RUNNING", "COMPLETED", "FAILED"
    Integer totalCount, // 완료 시 신규 등록 합계
    String startedAt, // 시작 시각 (ISO 8601 문자열)
    String completedAt, // 완료/실패 시각
    String errorMessage // 실패 시 상세 메시지
    ) {}
