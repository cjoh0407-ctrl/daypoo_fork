package com.daypoo.api.service;

import com.daypoo.api.dto.AiAnalysisResponse;
import com.daypoo.api.dto.PooCheckInResponse;
import com.daypoo.api.dto.PooRecordCreateRequest;
import com.daypoo.api.dto.PooRecordResponse;
import com.daypoo.api.entity.PooRecord;
import com.daypoo.api.entity.Toilet;
import com.daypoo.api.entity.User;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.mapper.PooRecordMapper;
import com.daypoo.api.repository.PooRecordRepository;
import com.daypoo.api.repository.ToiletRepository;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
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
    boolean isNear = locationVerificationService.isWithinAllowedDistance(toiletId, lat, lon);
    if (!isNear) {
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

    // 2. 물리적 위치 반경 검증
    boolean isNear =
        locationVerificationService.isWithinAllowedDistance(
            request.toiletId(), request.latitude(), request.longitude());
    if (!isNear) {
      throw new BusinessException(ErrorCode.OUT_OF_RANGE);
    }

    // 2.2 체류 시간 검증
    boolean stayedEnough =
        locationVerificationService.hasStayedLongEnough(user.getId(), toilet.getId());
    if (!stayedEnough) {
      throw new BusinessException(ErrorCode.STAY_TIME_NOT_MET);
    }

    // 3. 레디스 Rate Limiter (어뷰징 체크)
    boolean allowed = locationVerificationService.checkAndSetCooldown(user.getId(), toilet.getId());
    if (!allowed) {
      throw new BusinessException(ErrorCode.COOLDOWN_ACTIVE);
    }

    // 4. AI 분석 또는 수동 입력값 결정
    Integer finalBristolScale = request.bristolScale();
    String finalColor = request.color();
    List<String> aiWarningTags = Collections.emptyList();

    // AI 이미지가 있으면 분석 결과를 우선 적용 (수동 입력이 없더라도 통과 가능)
    if (request.imageBase64() != null && !request.imageBase64().isEmpty()) {
      AiAnalysisResponse aiResult = aiClient.analyzePoopImage(request.imageBase64());
      finalBristolScale = aiResult.bristolScale();
      finalColor = aiResult.color();
      aiWarningTags =
          aiResult.warningTags() != null ? aiResult.warningTags() : Collections.emptyList();
      log.info(
          "AI Analysis result applied: Bristol {}, Color {}, Warnings: {}",
          finalBristolScale,
          finalColor,
          aiWarningTags);
    }

    // 최종 검증: AI 결과도 없고 수동 입력도 없는 경우 에러 처리
    if (finalBristolScale == null || finalColor == null || finalColor.isEmpty()) {
      throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE);
    }

    // 5. 정확한 행정동 명칭 추출 (Reverse Geocoding)
    String regionName = geocodingService.reverseGeocode(request.latitude(), request.longitude());

    // 6. 기록 생성 및 태그 검증 (수동 입력 시 필수값 체크)
    boolean isManual = request.imageBase64() == null || request.imageBase64().isEmpty();

    List<String> conditionTags =
        request.conditionTags() != null ? request.conditionTags() : Collections.emptyList();
    List<String> dietTags =
        request.dietTags() != null ? request.dietTags() : Collections.emptyList();

    // 수동 입력 사용자인데 키워드(태그)가 하나도 없으면 에러 (브리스톨/색상은 위에서 이미 체크됨)
    if (isManual && (conditionTags.isEmpty() || dietTags.isEmpty())) {
      throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE);
    }

    List<String> safeConditionTags = conditionTags;
    List<String> safeDietTags = dietTags;

    PooRecord record =
        PooRecord.builder()
            .user(user)
            .toilet(toilet)
            .bristolScale(finalBristolScale)
            .color(finalColor)
            .conditionTags(String.join(",", safeConditionTags))
            .dietTags(String.join(",", safeDietTags))
            .warningTags(String.join(",", aiWarningTags))
            .regionName(regionName)
            .build();

    PooRecord savedRecord = recordRepository.save(record);

    // 7. 유저 보상 체계(TX)
    user.addExpAndPoints(REWARD_EXP, REWARD_POINTS);

    // 8. 실시간 랭킹 업데이트
    rankingService.updateGlobalRank(user);
    rankingService.updateRegionRank(user, regionName, 5.0);

    // 9. 업적/칭호 달성 검사 (Epic 2)
    titleAchievementService.checkAndGrantTitles(user);

    log.info(
        "User {} earned {} EXP and {} Points for recording toilet {}. Global/Region rank updated.",
        email,
        REWARD_EXP,
        REWARD_POINTS,
        toilet.getId());

    // 8. Response 조합
    return recordMapper.toResponse(savedRecord);
  }

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
