package com.daypoo.api.service;

import com.daypoo.api.dto.AiAnalysisResponse;
import com.daypoo.api.dto.PooCheckInResponse;
import com.daypoo.api.dto.PooRecordCreateRequest;
import com.daypoo.api.dto.PooRecordResponse;
import com.daypoo.api.entity.PooRecord;
import com.daypoo.api.entity.Toilet;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.VisitLog;
import com.daypoo.api.entity.enums.VisitEventType;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.mapper.PooRecordMapper;
import com.daypoo.api.repository.PooRecordRepository;
import com.daypoo.api.repository.ToiletRepository;
import com.daypoo.api.repository.VisitCountProjection;
import com.daypoo.api.repository.VisitLogRepository;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.dao.DataAccessException;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PooRecordService {

  private final PooRecordRepository recordRepository;
  private final ToiletRepository toiletRepository;
  private final UserService userService;
  private final LocationVerificationService locationVerificationService;
  private final GeocodingService geocodingService;
  private final TitleAchievementService titleAchievementService;
  private final PooRecordMapper recordMapper;
  private final VisitLogRepository visitLogRepository;
  private final AiClient aiClient;

  private final RankingService rankingService;

  // 보상 설정
  private static final int REWARD_EXP = 10;
  private static final int REWARD_POINTS = 5;

  /** 화장실 도착 체크인 담당 */
  @Transactional
  public PooCheckInResponse checkIn(String email, Long toiletId, double lat, double lon) {
    User user = userService.getByEmail(email);

    // 위치 검증 (확대된 150m 반경 사용)
    Double distance = locationVerificationService.getDistanceToToilet(toiletId, lat, lon);
    boolean isNear = distance != null && distance <= 150.0;
    
    if (!isNear) {
      logVisit(user, toiletId, VisitEventType.VERIFICATION_FAILED, null, null, lat, lon, distance, null, "OUT_OF_RANGE");
      throw new BusinessException(ErrorCode.OUT_OF_RANGE);
    }

    // 도착 시간 기록 및 반환 (Fast Check-in 로직 대응)
    long arrivalTimeMillis =
        locationVerificationService.getOrSetArrivalTime(user.getId(), toiletId);
    log.info(
        "User {} checked-in at toilet {}. Arrival Time: {}", email, toiletId, arrivalTimeMillis);

    long elapsedSeconds = (System.currentTimeMillis() - arrivalTimeMillis) / 1000;
    long remainedSeconds = Math.max(0, 60 - elapsedSeconds);

    LocalDateTime firstArrivalTime =
        LocalDateTime.ofInstant(Instant.ofEpochMilli(arrivalTimeMillis), ZoneId.systemDefault());

    logVisit(user, toiletId, VisitEventType.CHECK_IN, firstArrivalTime, null, lat, lon, distance, null, null);

    return new PooCheckInResponse(toiletId, firstArrivalTime, elapsedSeconds, remainedSeconds);
  }

  @Transactional
  public PooRecordResponse createRecord(String email, PooRecordCreateRequest request) {
    // 1. 엔티티 검증
    User user = userService.getByEmail(email);
    Toilet toilet =
        toiletRepository
            .findById(request.toiletId())
            .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND));

    // 2. 위치 및 체류 시간 검증
    validateLocationAndTime(user, toilet, request.latitude(), request.longitude());

    // 3. AI 분석 or 수동 입력값 결정
    PoopAttributes attrs = resolvePoopAttributes(request);

    // 4. Reverse Geocoding
    String regionName = geocodingService.reverseGeocode(request.latitude(), request.longitude());

    // 5. arrival 키 삭제 → 재인증 시 60초 타이머 리셋 허용
    locationVerificationService.resetArrivalTime(user.getId(), toilet.getId());

    // 6. 기록 저장
    PooRecord saved = recordRepository.save(
        PooRecord.builder()
            .user(user)
            .toilet(toilet)
            .bristolScale(attrs.bristolScale())
            .color(attrs.color())
            .conditionTags(String.join(",", attrs.conditionTags()))
            .dietTags(String.join(",", attrs.dietTags()))
            .warningTags(String.join(",", attrs.warningTags()))
            .regionName(regionName)
            .build());

    // 7. 보상 · 랭킹 · 칭호 처리
    applyPostSaveEffects(user, regionName);

    // 8. Visit Log 기록 완료
    long arrivalTimeMillis = locationVerificationService.getOrSetArrivalTime(user.getId(), toilet.getId());
    LocalDateTime arrivalAt = LocalDateTime.ofInstant(Instant.ofEpochMilli(arrivalTimeMillis), ZoneId.systemDefault());
    
    logVisit(user, toilet.getId(), VisitEventType.RECORD_CREATED, arrivalAt, LocalDateTime.now(), 
        request.latitude(), request.longitude(), null, saved, null);

    log.info(
        "User {} earned {} EXP and {} Points for recording toilet {}.",
        email, REWARD_EXP, REWARD_POINTS, toilet.getId());

    return recordMapper.toResponse(saved);
  }

  private void validateLocationAndTime(User user, Toilet toilet, double lat, double lon) {
    Double distance = locationVerificationService.getDistanceToToilet(toilet.getId(), lat, lon);
    if (distance == null || distance > 150.0) {
      logVisit(user, toilet.getId(), VisitEventType.VERIFICATION_FAILED, null, null, lat, lon, distance, null, "OUT_OF_RANGE");
      throw new BusinessException(ErrorCode.OUT_OF_RANGE);
    }
    if (!locationVerificationService.hasStayedLongEnough(user.getId(), toilet.getId())) {
      logVisit(user, toilet.getId(), VisitEventType.VERIFICATION_FAILED, null, null, lat, lon, distance, null, "STAY_TIME_NOT_MET");
      throw new BusinessException(ErrorCode.STAY_TIME_NOT_MET);
    }
  }

  private void logVisit(User user, Long toiletId, VisitEventType eventType, LocalDateTime arrivalAt, 
                        LocalDateTime completedAt, double lat, double lon, Double distance, PooRecord record, String failureReason) {
    try {
      Toilet toilet = toiletRepository.findById(toiletId).orElse(null);
      if (toilet == null) return;

      VisitLog visitLog = VisitLog.builder()
          .user(user)
          .toilet(toilet)
          .eventType(eventType)
          .arrivalAt(arrivalAt)
          .completedAt(completedAt)
          .userLatitude(lat)
          .userLongitude(lon)
          .distanceMeters(distance)
          .pooRecord(record)
          .failureReason(failureReason)
          .dwellSeconds(arrivalAt != null && completedAt != null ? (int) java.time.Duration.between(arrivalAt, completedAt).toSeconds() : null)
          .build();
          
      visitLogRepository.save(visitLog);
    } catch (DataAccessException e) {
      log.error("Failed to log visit: {}", e.getMessage());
    }
  }

  private PoopAttributes resolvePoopAttributes(PooRecordCreateRequest request) {
    boolean hasImage = request.imageBase64() != null && !request.imageBase64().isEmpty();

    if (hasImage) {
      AiAnalysisResponse ai = aiClient.analyzePoopImage(request.imageBase64());
      List<String> warnings = ai.warningTags() != null ? ai.warningTags() : Collections.emptyList();
      log.info("AI Analysis: Bristol {}, Color {}, Warnings: {}", ai.bristolScale(), ai.color(), warnings);
      return new PoopAttributes(ai.bristolScale(), ai.color(), Collections.emptyList(), Collections.emptyList(), warnings);
    }

    Integer bristolScale = request.bristolScale();
    String color = request.color();
    List<String> conditionTags = request.conditionTags() != null ? request.conditionTags() : Collections.emptyList();
    List<String> dietTags = request.dietTags() != null ? request.dietTags() : Collections.emptyList();

    if (bristolScale == null || color == null || color.isEmpty()) {
      throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE);
    }
    if (conditionTags.isEmpty() || dietTags.isEmpty()) {
      throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE);
    }
    return new PoopAttributes(bristolScale, color, conditionTags, dietTags, Collections.emptyList());
  }

  private void applyPostSaveEffects(User user, String regionName) {
    user.addExpAndPoints(REWARD_EXP, REWARD_POINTS);
    rankingService.updateGlobalRank(user);
    rankingService.updateRegionRank(user, regionName, 5.0);
    titleAchievementService.checkAndGrantTitles(user);
  }

  private record PoopAttributes(
      Integer bristolScale,
      String color,
      List<String> conditionTags,
      List<String> dietTags,
      List<String> warningTags) {}

  /** AI 이미지 분석만 수행 (기록 저장 안 함) 프론트엔드 분석 미리보기 UX 지원용 */
  @Transactional(readOnly = true)
  public AiAnalysisResponse analyzeImageOnly(String imageBase64) {
    if (imageBase64 == null || imageBase64.isEmpty()) {
      throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE);
    }
    log.info("Performing AI analysis only (no record creation)");
    return aiClient.analyzePoopImage(imageBase64);
  }

  @Transactional(readOnly = true)
  public Page<PooRecordResponse> getMyRecords(String email, Pageable pageable) {
    User user = userService.getByEmail(email);

    return recordRepository
        .findByUserOrderByCreatedAtDesc(user, pageable)
        .map(recordMapper::toResponse);
  }

  @Transactional(readOnly = true)
  public Map<Long, Long> getMyVisitCounts(String email) {
    User user = userService.getByEmail(email);
    List<VisitCountProjection> rows = recordRepository.findVisitCountsByUser(user);
    Map<Long, Long> result = new HashMap<>();
    for (VisitCountProjection row : rows) {
      if (row != null && row.getToiletId() != null) {
        result.put(row.getToiletId(), row.getVisitCount());
      }
    }
    return result;
  }

  @Transactional(readOnly = true)
  public PooRecordResponse getRecord(String email, Long recordId) {
    PooRecord record =
        recordRepository
            .findById(recordId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND));

    if (!record.getUser().getEmail().equals(email)) {
      throw new BusinessException(ErrorCode.HANDLE_ACCESS_DENIED);
    }

    return recordMapper.toResponse(record);
  }
}
