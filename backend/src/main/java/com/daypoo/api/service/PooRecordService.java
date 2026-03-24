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
import com.daypoo.api.repository.UserRepository;
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
  private final UserRepository userRepository;
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
    User user =
        userRepository
            .findByEmail(email)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

    // 위치 검증 (확대된 150m 반경 사용)
    boolean isNear = locationVerificationService.isWithinAllowedDistance(toiletId, lat, lon);
    if (!isNear) {
      log.warn(
          "User {} is outside radius for toilet {} during check-in. Proceeding anyway (dev mode).",
          email,
          toiletId);
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
    User user =
        userRepository
            .findByEmail(email)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

    Toilet toilet =
        toiletRepository
            .findById(request.toiletId())
            .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND));

    // 2. 물리적 위치 반경 검증 (개발 환경에서는 경고만 출력)
    boolean isNear =
        locationVerificationService.isWithinAllowedDistance(
            request.toiletId(), request.latitude(), request.longitude());
    if (!isNear) {
      log.warn(
          "User {} is outside radius for toilet {}. Proceeding anyway (dev mode).",
          email,
          request.toiletId());
    }

    // 2.2 체류 시간 검증 (개발 환경에서는 경고만 출력)
    boolean stayedEnough =
        locationVerificationService.hasStayedLongEnough(user.getId(), toilet.getId());
    if (!stayedEnough) {
      log.warn(
          "User {} has not stayed long enough at toilet {}. Proceeding anyway (dev mode).",
          email,
          request.toiletId());
    }

    // 3. 레디스 Rate Limiter(어뷰징 체크 - 개발 환경에서는 경고만)
    boolean allowed = locationVerificationService.checkAndSetCooldown(user.getId(), toilet.getId());
    if (!allowed) {
      log.warn(
          "User {} hit cooldown for toilet {}. Proceeding anyway (dev mode).",
          email,
          request.toiletId());
    }

    // 4. AI 분석 (이미지가 있을 경우)
    Integer finalBristolScale = request.bristolScale();
    String finalColor = request.color();

    if (request.imageBase64() != null && !request.imageBase64().isEmpty()) {
      AiAnalysisResponse aiResult = aiClient.analyzePoopImage(request.imageBase64());
      finalBristolScale = aiResult.bristolScale();
      finalColor = aiResult.color();
      log.info("AI Analysis result applied: Bristol {}, Color {}", finalBristolScale, finalColor);
    }

    // 5. 정확한 행정동 명칭 추출 (Reverse Geocoding)
    String regionName = geocodingService.reverseGeocode(request.latitude(), request.longitude());

    // 6. 기록 생성 (null-safe 처리)
    List<String> safeConditionTags =
        request.conditionTags() != null ? request.conditionTags() : Collections.emptyList();
    List<String> safeDietTags =
        request.dietTags() != null ? request.dietTags() : Collections.emptyList();

    PooRecord record =
        PooRecord.builder()
            .user(user)
            .toilet(toilet)
            .bristolScale(finalBristolScale)
            .color(finalColor)
            .conditionTags(String.join(",", safeConditionTags))
            .dietTags(String.join(",", safeDietTags))
            .regionName(regionName)
            .build();

    PooRecord savedRecord = recordRepository.save(record);

    // 7. 유저 보상 체계(TX)
    user.addExpAndPoints(REWARD_EXP, REWARD_POINTS);
    userRepository.save(user); // 포인트 변경 사항 명시적 저장

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

  @Transactional(readOnly = true)
  public Page<PooRecordResponse> getMyRecords(String email, Pageable pageable) {
    User user =
        userRepository
            .findByEmail(email)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

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
