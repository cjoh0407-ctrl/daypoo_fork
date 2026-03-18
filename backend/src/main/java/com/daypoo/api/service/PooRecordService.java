package com.daypoo.api.service;

import com.daypoo.api.dto.AiAnalysisResponse;
import com.daypoo.api.dto.PooRecordCreateRequest;
import com.daypoo.api.dto.PooRecordResponse;
import com.daypoo.api.entity.PooRecord;
import com.daypoo.api.entity.Toilet;
import com.daypoo.api.entity.User;
import com.daypoo.api.mapper.PooRecordMapper;
import com.daypoo.api.repository.PooRecordRepository;
import com.daypoo.api.repository.ToiletRepository;
import com.daypoo.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
  private final PooRecordMapper recordMapper;
  private final AiClient aiClient;

  private final RankingService rankingService;

  // 보상 설정
  private static final int REWARD_EXP = 10;
  private static final int REWARD_POINTS = 5;

  @Transactional
  public PooRecordResponse createRecord(String username, PooRecordCreateRequest request) {

    // 1. 엔티티 검증
    User user =
        userRepository
            .findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found: " + username));

    Toilet toilet =
        toiletRepository
            .findById(request.toiletId())
            .orElseThrow(() -> new RuntimeException("Toilet not found: " + request.toiletId()));

    // 2. 물리적 위치 반경 내(50m)에 있는지 공간 쿼리 검증
    boolean isNear =
        locationVerificationService.isWithinAllowedDistance(
            request.toiletId(), request.latitude(), request.longitude());

    if (!isNear) {
      throw new RuntimeException("화장실 반경(50m) 밖에서는 인증할 수 없습니다.");
    }

    // 3. 레디스 Rate Limiter(어뷰징 체크)
    boolean allowed = locationVerificationService.checkAndSetCooldown(user.getId(), toilet.getId());
    if (!allowed) {
      throw new RuntimeException("이미 최근 코인/경험치를 획득한 화장실입니다.");
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

    // 5. 기록 생성
    PooRecord record =
        PooRecord.builder()
            .user(user)
            .toilet(toilet)
            .bristolScale(finalBristolScale)
            .color(finalColor)
            .conditionTags(String.join(",", request.conditionTags()))
            .dietTags(String.join(",", request.dietTags()))
            .build();

    PooRecord savedRecord = recordRepository.save(record);

    // 6. 유저 보상 체계(TX)
    user.addExpAndPoints(REWARD_EXP, REWARD_POINTS);
    userRepository.save(user); // 포인트 변경 사항 명시적 저장

    // 7. 실시간 랭킹 업데이트
    rankingService.updateGlobalRank(user);

    // 지역 이름 추출 (주소의 3번째 단어를 동네 이름으로 가정 - 예: "서울시 강남구 역삼동" -> "역삼동")
    String regionName = "기타";
    if (toilet.getAddress() != null && !toilet.getAddress().isEmpty()) {
      String[] addressParts = toilet.getAddress().split(" ");
      if (addressParts.length >= 3) {
        regionName = addressParts[2];
      }
    }
    rankingService.updateRegionRank(user, regionName);

    log.info(
        "User {} earned {} EXP and {} Points for recording toilet {}. Global/Region rank updated.",
        username,
        REWARD_EXP,
        REWARD_POINTS,
        toilet.getId());

    // 8. Response 조합
    return PooRecordResponse.builder()
        .id(savedRecord.getId())
        .toiletId(toilet.getId())
        .toiletName(toilet.getName())
        .bristolScale(savedRecord.getBristolScale())
        .color(savedRecord.getColor())
        .conditionTags(request.conditionTags())
        .dietTags(request.dietTags())
        .createdAt(savedRecord.getCreatedAt())
        .build();
  }
}
