package com.daypoo.api.global.config;

import com.daypoo.api.entity.*;
import com.daypoo.api.entity.enums.InquiryType;
import com.daypoo.api.entity.enums.Role;
import com.daypoo.api.global.GeometryUtil;
import com.daypoo.api.repository.InquiryRepository;
import com.daypoo.api.repository.ToiletRepository;
import com.daypoo.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

  private final UserRepository userRepository;
  private final ToiletRepository toiletRepository;
  private final InquiryRepository inquiryRepository;
  private final PasswordEncoder passwordEncoder;
  private final GeometryUtil geometryUtil;

  @Override
  public void run(String... args) throws Exception {
    log.info("🏁 DataInitializer started...");

    // 1. Admin & Users
    if (userRepository.count() == 0) {
      log.info("Creating default users (admin@admin.com, user1@daypoo.com, user2@daypoo.com)...");

      userRepository.save(
          User.builder()
              .password(passwordEncoder.encode("admin1234"))
              .nickname("슈퍼관리자")
              .email("admin@admin.com")
              .role(Role.ROLE_ADMIN)
              .build());

      userRepository.save(
          User.builder()
              .password(passwordEncoder.encode("1234"))
              .nickname("급똥전문가")
              .email("user1@daypoo.com")
              .role(Role.ROLE_USER)
              .build());

      userRepository.save(
          User.builder()
              .password(passwordEncoder.encode("1234"))
              .nickname("장건강지킴이")
              .email("user2@daypoo.com")
              .role(Role.ROLE_USER)
              .build());

      log.info("Default users created.");
    }

    // 2. Toilets
    if (toiletRepository.count() == 0) {
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

      toiletRepository.save(
          Toilet.builder()
              .name("대치동 선릉공원 화장실")
              .mngNo("DC-012")
              .location(geometryUtil.createPoint(127.0490, 37.5050))
              .address("서울특별시 강남구 삼성동 141")
              .is24h(true)
              .isUnisex(false)
              .build());
    }

    // 3. Inquiries
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
    log.info("✅ DataInitializer completed.");
  }
}
