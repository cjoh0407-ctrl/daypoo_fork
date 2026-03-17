package com.daypoo.api.dto;

import com.daypoo.api.entity.InquiryStatus;
import com.daypoo.api.entity.InquiryType;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record InquiryResponse(
    Long id,
    InquiryType type,
    String content,
    String answer,
    InquiryStatus status,
    LocalDateTime createdAt
) {}
