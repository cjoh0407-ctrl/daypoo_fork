package com.daypoo.api.service;

import com.daypoo.api.repository.ToiletRepository;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class LocationVerificationService {

  private final ToiletRepository toiletRepository;
  private final StringRedisTemplate redisTemplate;

  // 허용 제한 거리: 50미터
  private static final double ALLOWED_RADIUS_METERS = 50.0;

  // 어뷰징(도배) 방지 제한 시간: 3시간 (3시간 내 중복 화장실 인증 금지 등)
  // 여기서는 간단히 한 번 인증하면 3시간 동안 동일 화장실 인증 불가
  private static final Duration SUBMIT_COOLDOWN = Duration.ofHours(3);

  /** 유저의 위치가 화장실 좌표랑 허용 범위(50m) 안에 있는지 체크 */
  public boolean isWithinAllowedDistance(Long toiletId, double currentLat, double currentLon) {
    Double distance = toiletRepository.getDistanceToToilet(toiletId, currentLat, currentLon);
    if (distance == null) {
      log.warn("Target toilet {} not found or distance calculation failed.", toiletId);
      return false;
    }

    log.info("Calculated distance to toilet {} is {} meters.", toiletId, distance);
    return distance <= ALLOWED_RADIUS_METERS;
  }

  /** 짧은 시간 동안 반복적인 인증 방어 (Redis 활용) */
  public boolean checkAndSetCooldown(Long userId, Long toiletId) {
    String key = "daypoo:record:cooldown:user:" + userId + ":toilet:" + toiletId;

    Boolean isFirstOrExpired =
        redisTemplate.opsForValue().setIfAbsent(key, "recorded", SUBMIT_COOLDOWN);

    // setIfAbsent는 키가 없어서 세팅이 성공하면 true 반환
    return Boolean.TRUE.equals(isFirstOrExpired);
  }
}
