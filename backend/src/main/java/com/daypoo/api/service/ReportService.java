package com.daypoo.api.service;

import com.daypoo.api.dto.AiReportRequest;
import com.daypoo.api.dto.HealthReportResponse;
import com.daypoo.api.entity.NotificationType;
import com.daypoo.api.entity.PooRecord;
import com.daypoo.api.entity.ReportType;
import com.daypoo.api.entity.User;
import com.daypoo.api.repository.PooRecordRepository;
import com.daypoo.api.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

  private final PooRecordRepository recordRepository;
  private final UserRepository userRepository;
  private final AiClient aiClient;
  private final StringRedisTemplate redisTemplate;
  private final ObjectMapper objectMapper;
  private final NotificationService notificationService;

  private static final String REPORT_CACHE_KEY_PREFIX = "daypoo:reports:";

  /** AI 건강 리포트 생성 및 조회 */
  @Transactional
  public HealthReportResponse generateReport(User user, ReportType type) {
    String cacheKey =
        REPORT_CACHE_KEY_PREFIX
            + type.name()
            + ":"
            + user.getId()
            + ":"
            + LocalDateTime.now().toLocalDate();

    // 1. 캐시 확인 (당일 생성된 리포트가 있으면 반환)
    String cachedReport = redisTemplate.opsForValue().get(cacheKey);
    if (cachedReport != null) {
      try {
        log.info("Returning cached {} report for user {}", type, user.getId());
        return objectMapper.readValue(cachedReport, HealthReportResponse.class);
      } catch (JsonProcessingException e) {
        log.warn("Failed to parse cached report", e);
      }
    }

    // 2. 포인트 차감 (데일리 무료 제외)
    if (type.getPrice() > 0) {
      user.deductPoints(type.getPrice());
      userRepository.save(user);
    }

    // 3. 기록 조회 기간 설정
    LocalDateTime startTime = getStartTime(type);
    List<PooRecord> records =
        recordRepository.findAllByUserAndCreatedAtAfterOrderByCreatedAtDesc(user, startTime);

    if (records.isEmpty()) {
      throw new IllegalStateException("분석할 배변 기록이 없습니다.");
    }

    // 4. AI 서비스 요청 데이터 구성
    List<AiReportRequest.PooRecordData> recordDataList =
        records.stream()
            .map(
                r ->
                    new AiReportRequest.PooRecordData(
                        r.getBristolScale(),
                        r.getColor(),
                        r.getConditionTags(),
                        r.getDietTags(),
                        r.getCreatedAt().toString()))
            .collect(Collectors.toList());

    AiReportRequest request =
        new AiReportRequest(user.getId().toString(), type.name(), recordDataList);

    // 5. AI 호출 및 결과 수신
    HealthReportResponse response = aiClient.analyzeHealthReport(request);

    // 6. 결과 캐싱 (24시간 유지)
    try {
      redisTemplate
          .opsForValue()
          .set(cacheKey, objectMapper.writeValueAsString(response), 24, TimeUnit.HOURS);
    } catch (JsonProcessingException e) {
      log.warn("Failed to cache report", e);
    }

    // 7. 알림 전송
    notificationService.send(
        user,
        NotificationType.HEALTH,
        type.name() + " 건강 리포트가 도착했습니다!",
        "AI가 분석한 당신의 최신 건강 분석 리포트를 지금 바로 확인해보세요.",
        "/reports/" + type.name().toLowerCase());

    return response;
  }

  private LocalDateTime getStartTime(ReportType type) {
    return switch (type) {
      case DAILY -> LocalDateTime.now().minusDays(1);
      case WEEKLY -> LocalDateTime.now().minusWeeks(1);
      case MONTHLY -> LocalDateTime.now().minusMonths(1);
    };
  }
}
