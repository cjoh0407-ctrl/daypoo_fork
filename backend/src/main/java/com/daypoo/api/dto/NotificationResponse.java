package com.daypoo.api.dto;

import com.daypoo.api.entity.NotificationType;
import lombok.Builder;
import java.time.LocalDateTime;

@Builder
public record NotificationResponse(
    Long id,
    NotificationType type,
    String title,
    String content,
    String redirectUrl,
    boolean isRead,
    LocalDateTime createdAt
) {}
