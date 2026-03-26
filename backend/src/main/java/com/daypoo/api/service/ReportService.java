package com.daypoo.api.service;

import com.daypoo.api.dto.AiReportRequest;
import com.daypoo.api.dto.HealthReportHistoryResponse;
import com.daypoo.api.dto.HealthReportResponse;
import com.daypoo.api.dto.VisitLogResponse;
import com.daypoo.api.entity.HealthReportSnapshot;
import com.daypoo.api.entity.PooRecord;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.NotificationType;
import com.daypoo.api.entity.enums.ReportType;
import com.daypoo.api.repository.HealthReportSnapshotRepository;
import com.daypoo.api.repository.PooRecordRepository;
import com.daypoo.api.repository.UserRepository;
import com.daypoo.api.repository.VisitLogRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
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
  private final HealthReportSnapshotRepository snapshotRepository;
  private final VisitLogRepository visitLogRepository;

  private static final String REPORT_CACHE_KEY_PREFIX = "daypoo:reports:";

  /** AI 건강 리포트 생성 및 조회 */
  public HealthReportResponse generateReport(User user, ReportType type) {
    String cacheKey =
        REPORT_CACHE_KEY_PREFIX
            + type.name()
            + ":"
            + user.getId()
            + ":"
            + LocalDateTime.now().toLocalDate();

    // 1. 캐시 확인
    String cachedReport = redisTemplate.opsForValue().get(cacheKey);
    if (cachedReport != null) {
      try {
        log.info("Returning cached {} report for user {}", type, user.getId());
        return objectMapper.readValue(cachedReport, HealthReportResponse.class);
      } catch (JsonProcessingException e) {
        log.warn("Failed to parse cached report", e);
      }
    }

    // 2. DB 스냅샷 확인 (오늘 생성된 동일 타입 리포트 재사용)
    LocalDateTime startTime = getStartTime(type);
    LocalDateTime endTime = LocalDateTime.now();
    LocalDateTime todayStart = endTime.toLocalDate().atStartOfDay();
    LocalDateTime tomorrowStart = todayStart.plusDays(1);

    var snapshot =
        snapshotRepository.findFirstByUserAndReportTypeAndCreatedAtBetweenOrderByCreatedAtDesc(
            user, type, todayStart, tomorrowStart);

    if (snapshot.isPresent()) {
      log.info("Returning DB snapshot {} report for user {}", type, user.getId());
      HealthReportSnapshot s = snapshot.get();
      return HealthReportResponse.builder()
          .reportType(s.getReportType().name())
          .healthScore(s.getHealthScore())
          .summary(s.getSummary())
          .solution(s.getSolution())
          .insights(s.getInsights() != null ? List.of(s.getInsights().split(",")) : List.of())
          .recordCount(s.getRecordCount())
          .periodStart(s.getPeriodStart())
          .periodEnd(s.getPeriodEnd())
          .analyzedAt(s.getCreatedAt().toString())
          .mostFrequentBristol(null)
          .mostFrequentCondition(null)
          .mostFrequentDiet(null)
          .healthyRatio(null)
          .build();
    }

    // 3. 포인트 차감 (데일리 무료 제외)
    if (type.getPrice() > 0) {
      user.deductPoints(type.getPrice());
      userRepository.save(user);
    }

    // 4. 기록 조회
    List<PooRecord> records =
        recordRepository.findAllByUserAndCreatedAtAfterOrderByCreatedAtDesc(user, startTime);

    if (records.isEmpty()) {
      throw new IllegalStateException("분석할 배변 기록이 없습니다.");
    }

    // 5. AI 서비스 요청 데이터 구성
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

    AiReportRequest requestDto =
        new AiReportRequest(user.getId().toString(), type.name(), recordDataList);

    // 6. AI 호출 및 결과 수신
    HealthReportResponse response = aiClient.analyzeHealthReport(requestDto);

    // stats 계산
    Integer mostFrequentBristol =
        computeMostFrequent(
            records.stream()
                .map(PooRecord::getBristolScale)
                .filter(Objects::nonNull)
                .collect(Collectors.toList()));
    String mostFrequentCondition =
        computeMostFrequentTag(
            records.stream()
                .flatMap(
                    r ->
                        r.getConditionTags() != null
                            ? Arrays.stream(r.getConditionTags().split(","))
                            : Stream.empty())
                .collect(Collectors.toList()));
    String mostFrequentDiet =
        computeMostFrequentTag(
            records.stream()
                .flatMap(
                    r ->
                        r.getDietTags() != null
                            ? Arrays.stream(r.getDietTags().split(","))
                            : Stream.empty())
                .collect(Collectors.toList()));
    long healthyCount =
        records.stream()
            .filter(
                r ->
                    r.getBristolScale() != null
                        && r.getBristolScale() >= 3
                        && r.getBristolScale() <= 4)
            .count();
    Integer healthyRatio = records.isEmpty() ? null : (int) (healthyCount * 100 / records.size());

    // 7. AI 응답 기반 최종 리포트 구성
    response =
        HealthReportResponse.builder()
            .reportType(response.reportType())
            .healthScore(response.healthScore())
            .summary(response.summary())
            .solution(response.solution())
            .insights(response.insights())
            .recordCount(records.size())
            .periodStart(startTime)
            .periodEnd(endTime)
            .analyzedAt(LocalDateTime.now().toString())
            .mostFrequentBristol(mostFrequentBristol)
            .mostFrequentCondition(mostFrequentCondition)
            .mostFrequentDiet(mostFrequentDiet)
            .healthyRatio(healthyRatio)
            .build();

    // 7. DB 영구 저장 (Snapshot)
    saveSnapshot(user, type, response);

    // 8. 결과 캐싱 (24시간 유지)
    try {
      String serialized = objectMapper.writeValueAsString(response);
      if (serialized != null) {
        redisTemplate.opsForValue().set(cacheKey, serialized, 24, TimeUnit.HOURS);
      }
    } catch (JsonProcessingException e) {
      log.warn("Failed to cache report", e);
    }

    // 9. 알림 전송
    notificationService.send(
        user,
        NotificationType.HEALTH,
        type.name() + " 건강 리포트가 도착했습니다!",
        "AI가 분석한 당신의 최신 건강 분석 리포트를 지금 바로 확인해보세요.",
        "/reports/" + type.name().toLowerCase());

    return response;
  }

  /** 리포트 히스토리 조회 (PRO/PREMIUM 전용) */
  @Transactional(readOnly = true)
  public List<HealthReportHistoryResponse> getReportHistory(User user) {
    return snapshotRepository.findByUserOrderByCreatedAtDesc(user).stream()
        .map(HealthReportHistoryResponse::from)
        .collect(Collectors.toList());
  }

  /** 건강 점수 트렌드 조회 (PRO/PREMIUM 전용) */
  @Transactional(readOnly = true)
  public List<Integer> getHealthTrend(User user) {
    return snapshotRepository.findByUserOrderByCreatedAtDesc(user).stream()
        .limit(10) // 최근 10개
        .map(HealthReportSnapshot::getHealthScore)
        .collect(Collectors.toList());
  }

  /** 방문 패턴 데이터 조회 (PRO/PREMIUM 전용) */
  @Transactional(readOnly = true)
  public List<VisitLogResponse> getVisitPatterns(User user) {
    return visitLogRepository.findByUserOrderByCreatedAtDesc(user).stream()
        .map(VisitLogResponse::from)
        .collect(Collectors.toList());
  }

  private void saveSnapshot(User user, ReportType type, HealthReportResponse response) {
    try {
      snapshotRepository.save(
          HealthReportSnapshot.builder()
              .user(user)
              .reportType(type)
              .healthScore(response.healthScore())
              .summary(response.summary())
              .solution(response.solution())
              .insights(response.insights() != null ? String.join(",", response.insights()) : null)
              .recordCount(response.recordCount())
              .periodStart(response.periodStart())
              .periodEnd(response.periodEnd())
              .build());
    } catch (Exception e) {
      log.error("Failed to save report snapshot: {}", e.getMessage());
    }
  }

  private LocalDateTime getStartTime(ReportType type) {
    return switch (type) {
      case DAILY -> LocalDateTime.now().minusDays(1);
      case WEEKLY -> LocalDateTime.now().minusWeeks(1);
      case MONTHLY -> LocalDateTime.now().minusMonths(1);
    };
  }

  private <T> T computeMostFrequent(List<T> items) {
    if (items == null || items.isEmpty()) return null;
    return items.stream()
        .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
        .entrySet()
        .stream()
        .max(Map.Entry.comparingByValue())
        .map(Map.Entry::getKey)
        .orElse(null);
  }

  private String computeMostFrequentTag(List<String> tags) {
    Object frequent = computeMostFrequent(tags);
    return frequent != null ? frequent.toString() : null;
  }
}
