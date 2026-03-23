package com.daypoo.api.dto;

import com.daypoo.api.entity.User;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record UserResponse(
    Long id,
    String email,
    String nickname,
    String role,
    int level,
    long exp,
    long points,
    LocalDateTime createdAt) {
  public static UserResponse from(User user) {
    return UserResponse.builder()
        .id(user.getId())
        .email(user.getEmail())
        .nickname(user.getNickname())
        .role(user.getRole().name())
        .level(user.getLevel())
        .exp(user.getExp())
        .points(user.getPoints())
        .createdAt(user.getCreatedAt())
        .build();
  }
}
