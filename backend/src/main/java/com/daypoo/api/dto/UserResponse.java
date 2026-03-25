package com.daypoo.api.dto;

import com.daypoo.api.entity.User;
import com.daypoo.api.entity.Subscription;
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
    String birthDate,
    String createdAt,
    Long equippedTitleId,
    String equippedTitleName,
    Boolean isPro,
    SubscriptionResponse subscription) {

  public static UserResponse from(User user) {
    return UserResponse.from(user, null, user.getActiveSubscription());
  }

  public static UserResponse from(User user, String equippedTitleName) {
    return UserResponse.from(user, equippedTitleName, user.getActiveSubscription());
  }

  public static UserResponse from(
      User user, String equippedTitleName, Subscription subscription) {

    return UserResponse.builder()
        .id(user.getId())
        .email(user.getEmail())
        .nickname(user.getNickname())
        .role(user.getRole().name())
        .level(user.getLevel())
        .exp(user.getExp())
        .points(user.getPoints())
        .birthDate(null)
        .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
        .equippedTitleId(user.getEquippedTitleId())
        .equippedTitleName(equippedTitleName)
        .isPro(user.isPro())
        .subscription(SubscriptionResponse.from(subscription))
        .build();
  }
}
