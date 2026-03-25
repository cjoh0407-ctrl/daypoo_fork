package com.daypoo.api.global.config;

import com.daypoo.api.entity.*;
import com.daypoo.api.entity.enums.InquiryType;
import com.daypoo.api.entity.enums.Role;
import com.daypoo.api.global.GeometryUtil;
import com.daypoo.api.repository.InquiryRepository;
import com.daypoo.api.repository.ToiletRepository;
import com.daypoo.api.repository.ToiletReviewRepository;
import com.daypoo.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

  private final UserRepository userRepository;
  private final ToiletRepository toiletRepository;
  private final InquiryRepository inquiryRepository;
  private final ToiletReviewRepository toiletReviewRepository;
  private final PasswordEncoder passwordEncoder;
  private final GeometryUtil geometryUtil;

  @Override
  public void run(String... args) {
    try {
      log.info("🏁 DataInitializer started...");

      initializeUsers();
      initializeToiletsAndReviews();
      initializeInquiries();

      log.info("✅ DataInitializer completed.");
    } catch (Exception e) {
      log.error("❌ DataInitializer failed: {}. Server will continue to start.", e.getMessage(), e);
    }
  }

  private void initializeUsers() {
    // Admin
    userRepository
        .findByEmail("admin@admin.com")
        .ifPresentOrElse(
            existingAdmin -> {
              if (existingAdmin.getRole() != Role.ROLE_ADMIN) {
                existingAdmin.updateRole(Role.ROLE_ADMIN);
                userRepository.save(existingAdmin);
              }
            },
            () -> {
              userRepository.save(
                  User.builder()
                      .password(passwordEncoder.encode("admin1234"))
                      .nickname("관리자")
                      .email("admin@admin.com")
                      .role(Role.ROLE_ADMIN)
                      .build());
            });

    // 일반 유저
    if (!userRepository.existsByEmail("user1@daypoo.com")) {
      userRepository.save(
          User.builder()
              .password(passwordEncoder.encode("1234"))
              .nickname("급똥전문가")
              .email("user1@daypoo.com")
              .role(Role.ROLE_USER)
              .build());
    }

    if (!userRepository.existsByEmail("user2@daypoo.com")) {
      userRepository.save(
          User.builder()
              .password(passwordEncoder.encode("1234"))
              .nickname("장건강지킴이")
              .email("user2@daypoo.com")
              .role(Role.ROLE_USER)
              .build());
    }
  }

  private void initializeToiletsAndReviews() {
    if (toiletRepository.count() == 0) {
      Toilet t1 =
          toiletRepository.save(
              Toilet.builder()
                  .name("강남역 2호선 공중화장실")
                  .mngNo("GN-001")
                  .location(geometryUtil.createPoint(127.0276, 37.4979))
                  .address("서울특별시 강남구 강남대로 396")
                  .is24h(true)
                  .isUnisex(false)
                  .openHours("00:00-24:00")
                  .build());

      Toilet t2 =
          toiletRepository.save(
              Toilet.builder()
                  .name("마포역 5호선 화장실")
                  .mngNo("MP-005")
                  .location(geometryUtil.createPoint(126.9460, 37.5393))
                  .address("서울특별시 마포구 마포대로 33")
                  .is24h(false)
                  .isUnisex(true)
                  .openHours("05:30-24:00")
                  .build());

      Toilet t3 =
          toiletRepository.save(
              Toilet.builder()
                  .name("대치동 선릉공원 화장실")
                  .mngNo("DC-012")
                  .location(geometryUtil.createPoint(127.0490, 37.5050))
                  .address("서울특별시 강남구 삼성동 141")
                  .is24h(true)
                  .isUnisex(false)
                  .build());

      // 리뷰 데이터 추가
      User u1 = userRepository.findByEmail("user1@daypoo.com").orElse(null);
      User u2 = userRepository.findByEmail("user2@daypoo.com").orElse(null);

      if (u1 != null && u2 != null) {
        addReview(u1, t1, 5, "clean,tissue", "정말 깨끗하고 관리가 잘 되어 있어요. 강남역 최고 명소!");
        addReview(u2, t1, 4, "clean", "사람은 많지만 청소 주기가 빨라서 쓸만합니다.");
        addReview(u1, t2, 3, "tissue", "휴지는 있는데 좀 좁아요.");
        addReview(u2, t2, 4, "clean,tissue", "마포역 근처에서 가장 찾기 쉽고 괜찮은 곳.");
        addReview(u1, t3, 2, "narrow", "밤에는 조금 어둡고 무서워요. 관리가 필요할 듯.");
      }
    }
  }

  private void addReview(User user, Toilet toilet, int rating, String tags, String comment) {
    toiletReviewRepository.save(
        ToiletReview.builder()
            .user(user)
            .toilet(toilet)
            .rating(rating)
            .emojiTags(tags)
            .comment(comment)
            .build());

    // 통계 업데이트
    Double avg = toiletReviewRepository.calculateAvgRatingByToiletId(toilet.getId());
    long count = toiletReviewRepository.countByToiletId(toilet.getId());
    toilet.updateReviewStats(avg != null ? avg : 0.0, (int) count);
    if (count >= 5) {
      toilet.updateAiSummary("많은 분들이 깔끔하고 휴지가 넉넉하다고 평가해주셨습니다.");
    }
    toiletRepository.save(toilet);
  }

  private void initializeInquiries() {
    if (inquiryRepository.count() == 0) {
      User user = userRepository.findByEmail("user1@daypoo.com").orElse(null);
      if (user != null) {
        inquiryRepository.save(
            Inquiry.builder()
                .user(user)
                .type(InquiryType.PAYMENT_ITEM)
                .title("아이템 구매 후 인벤토리 확인이 안 돼요")
                .content("휴지 팩을 구매했는데 인벤토리에 들어오지 않았습니다. 확인 부탁드립니다.")
                .build());

        inquiryRepository.save(
            Inquiry.builder()
                .user(user)
                .type(InquiryType.TOILET_ERROR)
                .title("강남역 화장실 위치가 좀 달라요")
                .content("지도의 위치와 실제 위치가 약 50m 정도 차이가 납니다. 수정 요청드려요.")
                .build());

        inquiryRepository.save(
            Inquiry.builder()
                .user(user)
                .type(InquiryType.OTHERS)
                .title("AI 건강분석 결과가 이상합니다")
                .content("오늘 아침 기록을 분석했는데 비정상적으로 좋게 나왔어요. 원래 이런가요?")
                .build());
      }
    }
  }
}
