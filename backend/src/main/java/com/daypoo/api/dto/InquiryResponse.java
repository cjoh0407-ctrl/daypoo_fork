package com.daypoo.api.dto;

import com.daypoo.api.entity.InquiryStatus;
import com.daypoo.api.entity.InquiryType;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record InquiryResponse(
    Long id,
    InquiryType type,
    String content,
    String answer,
    InquiryStatus status,
    LocalDateTime createdAt) {}
