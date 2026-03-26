package com.daypoo.api.service;

import com.daypoo.api.dto.AiMonthlyReportRequest;
import com.daypoo.api.dto.AiReportRequest;
import com.daypoo.api.dto.HealthReportHistoryResponse;
import com.daypoo.api.dto.HealthReportResponse;
import com.daypoo.api.dto.VisitLogResponse;
import com.daypoo.api.dto.WeeklySummaryData;
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
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
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
  private final RankingService rankingService;

  private static final String REPORT_CACHE_KEY_PREFIX = "daypoo:reports:v6:";

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
      HealthReportSnapshot s = snapshot.get();
      // 구버전 스냅샷(신규 통계 필드가 없는 경우)은 무시하고 재생성 유도
      if (s.getMostFrequentBristol() != null) {
        log.info("Returning DB snapshot {} report for user {}", type, user.getId());

        List<Integer> weeklyScores = null;
        if (s.getWeeklyHealthScores() != null && !s.getWeeklyHealthScores().isBlank()) {
          weeklyScores =
              Arrays.stream(s.getWeeklyHealthScores().split(","))
                  .map(Integer::parseInt)
                  .collect(Collectors.toList());
        }

        Map<Integer, Integer> bristolDist = null;
        if (s.getBristolDistribution() != null) {
          try {
            bristolDist =
                objectMapper.readValue(
                    s.getBristolDistribution(),
                    new com.fasterxml.jackson.core.type.TypeReference<Map<Integer, Integer>>() {});
          } catch (JsonProcessingException e) {
            log.warn("Failed to parse bristol distribution from snapshot", e);
          }
        }

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
            .mostFrequentBristol(s.getMostFrequentBristol())
            .mostFrequentCondition(s.getMostFrequentCondition())
            .mostFrequentDiet(s.getMostFrequentDiet())
            .healthyRatio(s.getHealthyRatio())
            .weeklyHealthScores(weeklyScores)
            .improvementTrend(s.getImprovementTrend())
            .bristolDistribution(bristolDist)
            .avgDailyRecordCount(s.getAvgDailyRecordCount())
            .build();
      } else {
        log.info(
            "Old snapshot found for user {}, forcing re-generation to include new metrics",
            user.getId());
      }
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

    // 6. AI 호출 및 결과 수신 (MONTHLY는 요약 데이터 전송, 그 외는 raw 데이터 전송)
    HealthReportResponse aiResponse;
    List<Integer> weeklyHealthScores = null;
    String improvementTrend = null;
    Map<Integer, Integer> bristolDistribution = null;
    Double avgDailyRecordCount = null;

    if (type == ReportType.MONTHLY) {
      List<WeeklySummaryData> weeklySummaries = buildWeeklySummaries(records, startTime);
      log.info(
          "Computing MONTHLY stats for user {}. Weekly summaries: {}",
          user.getId(),
          weeklySummaries);

      weeklyHealthScores =
          weeklySummaries.stream()
              .map(s -> s.recordCount() == 0 ? 0 : 50 + s.healthyRatio() / 2)
              .collect(Collectors.toList());
      log.info("Calculated weekly health scores: {}", weeklyHealthScores);

      improvementTrend = computeImprovementTrend(weeklyHealthScores);
      bristolDistribution = computeBristolDistribution(records);
      avgDailyRecordCount = computeAvgDailyRecordCount(records, startTime);

      log.info(
          "Trend results - Trend: {}, Distribution: {}, AvgDaily: {}",
          improvementTrend,
          bristolDistribution,
          avgDailyRecordCount);

      AiMonthlyReportRequest monthlyRequest =
          new AiMonthlyReportRequest(user.getId().toString(), type.name(), weeklySummaries);
      aiResponse = aiClient.analyzeMonthlyReport(monthlyRequest);
    } else {
      aiResponse = aiClient.analyzeHealthReport(requestDto);
    }

    // 7. 통계 계산 (공통)
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

    // 8. 최종 리포트 구성 (AI 응답 + 계산된 통계 + MONTHLY 필드)
    HealthReportResponse response =
        HealthReportResponse.builder()
            .reportType(aiResponse.reportType())
            .healthScore(aiResponse.healthScore())
            .summary(aiResponse.summary())
            .solution(aiResponse.solution())
            .insights(aiResponse.insights())
            .recordCount(records.size())
            .periodStart(startTime)
            .periodEnd(endTime)
            .analyzedAt(LocalDateTime.now().toString())
            .mostFrequentBristol(mostFrequentBristol)
            .mostFrequentCondition(mostFrequentCondition)
            .mostFrequentDiet(mostFrequentDiet)
            .healthyRatio(healthyRatio)
            // MONTHLY 필드
            .weeklyHealthScores(weeklyHealthScores)
            .improvementTrend(improvementTrend)
            .bristolDistribution(bristolDistribution)
            .avgDailyRecordCount(avgDailyRecordCount)
            .build();

    // 7. DB 영구 저장 (Snapshot)
    saveSnapshot(user, type, response);

    // DAILY 리포트 생성 시 건강왕 랭킹 업데이트
    if (type == ReportType.DAILY) {
      rankingService.updateHealthRank(user, (double) response.healthScore());
    }

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
      String weeklyScoresStr =
          response.weeklyHealthScores() != null
              ? response.weeklyHealthScores().stream()
                  .map(v -> v == null ? "0" : String.valueOf(v))
                  .collect(Collectors.joining(","))
              : null;

      String bristolDistJson = null;
      if (response.bristolDistribution() != null) {
        bristolDistJson = objectMapper.writeValueAsString(response.bristolDistribution());
      }

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
              .mostFrequentBristol(response.mostFrequentBristol())
              .mostFrequentCondition(response.mostFrequentCondition())
              .mostFrequentDiet(response.mostFrequentDiet())
              .healthyRatio(response.healthyRatio())
              .weeklyHealthScores(weeklyScoresStr)
              .improvementTrend(response.improvementTrend())
              .bristolDistribution(bristolDistJson)
              .avgDailyRecordCount(response.avgDailyRecordCount())
              .build());
    } catch (Exception e) {
      log.error("Failed to save report snapshot: {}", e.getMessage());
    }
  }

  private LocalDateTime getStartTime(ReportType type) {
    return switch (type) {
      case DAILY -> LocalDateTime.now().minusDays(1);
      case WEEKLY -> LocalDateTime.now().minusWeeks(1);
      case MONTHLY -> LocalDateTime.now().minusWeeks(4);
    };
  }

  private List<WeeklySummaryData> buildWeeklySummaries(
      List<PooRecord> records, LocalDateTime startTime) {
    List<WeeklySummaryData> summaries = new ArrayList<>();
    for (int week = 0; week < 4; week++) {
      LocalDateTime weekStart = startTime.plusWeeks(week);
      LocalDateTime weekEnd =
          (week == 3) ? LocalDateTime.now().plusMinutes(1) : startTime.plusWeeks(week + 1);
      List<PooRecord> weekRecords =
          records.stream()
              .filter(
                  r -> !r.getCreatedAt().isBefore(weekStart) && r.getCreatedAt().isBefore(weekEnd))
              .collect(Collectors.toList());

      if (weekRecords.isEmpty()) {
        summaries.add(new WeeklySummaryData(week + 1, 0, 0.0, 0, "", ""));
        continue;
      }

      double avgBristol =
          weekRecords.stream()
              .filter(r -> r.getBristolScale() != null)
              .mapToInt(PooRecord::getBristolScale)
              .average()
              .orElse(0.0);

      long healthyCount =
          weekRecords.stream()
              .filter(
                  r ->
                      r.getBristolScale() != null
                          && r.getBristolScale() >= 3
                          && r.getBristolScale() <= 4)
              .count();
      int healthyRatio = (int) (healthyCount * 100 / weekRecords.size());

      String topDiet =
          computeTopTags(
              weekRecords.stream()
                  .flatMap(
                      r ->
                          r.getDietTags() != null
                              ? Arrays.stream(r.getDietTags().split(","))
                              : Stream.empty())
                  .collect(Collectors.toList()),
              3);
      String topCondition =
          computeTopTags(
              weekRecords.stream()
                  .flatMap(
                      r ->
                          r.getConditionTags() != null
                              ? Arrays.stream(r.getConditionTags().split(","))
                              : Stream.empty())
                  .collect(Collectors.toList()),
              3);

      summaries.add(
          new WeeklySummaryData(
              week + 1,
              weekRecords.size(),
              Math.round(avgBristol * 10) / 10.0,
              healthyRatio,
              topDiet,
              topCondition));
    }
    return summaries;
  }

  private String computeImprovementTrend(List<Integer> scores) {
    if (scores == null || scores.size() < 4) return "STABLE";
    // 앞 2주 평균 vs 뒤 2주 평균
    double firstHalf = (getScore(scores, 0) + getScore(scores, 1)) / 2.0;
    double secondHalf = (getScore(scores, 2) + getScore(scores, 3)) / 2.0;

    if (secondHalf - firstHalf > 5) return "IMPROVING";
    if (firstHalf - secondHalf > 5) return "DECLINING";
    return "STABLE";
  }

  private int getScore(List<Integer> scores, int index) {
    Integer s = scores.get(index);
    return s != null ? s : 50; // default for empty weeks
  }

  private Map<Integer, Integer> computeBristolDistribution(List<PooRecord> records) {
    return records.stream()
        .map(PooRecord::getBristolScale)
        .filter(Objects::nonNull)
        .collect(
            Collectors.groupingBy(
                scale -> scale,
                Collectors.collectingAndThen(Collectors.counting(), Long::intValue)));
  }

  private Double computeAvgDailyRecordCount(List<PooRecord> records, LocalDateTime startTime) {
    long days = ChronoUnit.DAYS.between(startTime, LocalDateTime.now());
    if (days <= 0) days = 1;
    double avg = (double) records.size() / days;
    return Math.round(avg * 10) / 10.0;
  }

  private String computeTopTags(List<String> tags, int limit) {
    if (tags == null || tags.isEmpty()) return "";
    return tags.stream()
        .filter(Objects::nonNull)
        .filter(s -> !s.isBlank())
        .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
        .entrySet()
        .stream()
        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
        .limit(limit)
        .map(Map.Entry::getKey)
        .collect(Collectors.joining(","));
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
