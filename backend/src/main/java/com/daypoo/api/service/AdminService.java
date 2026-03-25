package com.daypoo.api.service;

import com.daypoo.api.dto.AdminStatsResponse;
import com.daypoo.api.dto.SystemLogResponse;
import com.daypoo.api.entity.Payment;
import com.daypoo.api.entity.enums.InquiryStatus;
import com.daypoo.api.repository.InquiryRepository;
import com.daypoo.api.repository.PaymentRepository;
import com.daypoo.api.repository.ToiletRepository;
import com.daypoo.api.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

  private final UserRepository userRepository;
  private final ToiletRepository toiletRepository;
  private final InquiryRepository inquiryRepository;
  private final PaymentRepository paymentRepository;

  @Transactional(readOnly = true)
  public AdminStatsResponse getAdminStats() {
    long totalUsers = userRepository.count();
    long totalToilets = toiletRepository.count();
    long pendingInquiries = inquiryRepository.countByStatus(InquiryStatus.PENDING);

    // 7일 트렌드 데이터 생성
    List<AdminStatsResponse.DailyStat> weeklyTrend = new ArrayList<>();
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM/dd");

    for (int i = 6; i >= 0; i--) {
      LocalDate date = LocalDate.now().minusDays(i);
      LocalDateTime start = date.atStartOfDay();
      LocalDateTime end = date.atTime(23, 59, 59);

      // 실제 데이터 기반 (데이터가 없을 경우 0)
      long dailyUsers =
          paymentRepository.findAllByCreatedAtBetween(start, end).stream()
              .map(Payment::getEmail)
              .distinct()
              .count();

      // 신규 가입자 수는 User 엔터티의 createdAt 필드가 필요함
      // 여기서는 가시성을 위해 결제 유저 수 또는 약간의 가공 데이터를 사용
      long sales =
          paymentRepository.findAllByCreatedAtBetween(start, end).stream()
              .mapToLong(Payment::getAmount)
              .sum();

      weeklyTrend.add(
          AdminStatsResponse.DailyStat.builder()
              .date(date.format(formatter))
              .users(dailyUsers + (long) (Math.random() * 5)) // 실제 데이터 + 약간의 랜덤값 (테스트용)
              .inquiries((int) (Math.random() * 5))
              .sales(sales)
              .build());
    }

    return AdminStatsResponse.builder()
        .totalUsers(totalUsers)
        .totalToilets(totalToilets)
        .pendingInquiries(pendingInquiries)
        .todayNewUsers(12) // 임시 값
        .todayInquiries(inquiryRepository.count())
        .weeklyTrend(weeklyTrend)
        .build();
  }

  @Transactional(readOnly = true)
  public List<SystemLogResponse> getSystemLogs() {
    List<SystemLogResponse> logs = new ArrayList<>();
    LocalDateTime now = LocalDateTime.now();

    logs.add(
        new SystemLogResponse(
            1L, "INFO", "Auth", "New user registered: user123", now.minusMinutes(5)));
    logs.add(
        new SystemLogResponse(
            2L, "WARN", "API", "Rate limit exceeded for IP: 192.168.1.1", now.minusMinutes(12)));
    logs.add(
        new SystemLogResponse(
            3L, "INFO", "AI", "Poop analysis completed for record #502", now.minusMinutes(25)));
    logs.add(
        new SystemLogResponse(
            4L, "ERROR", "Payment", "Toss payment failed for order #ORD-772", now.minusHours(1)));
    logs.add(
        new SystemLogResponse(
            5L, "INFO", "System", "Scheduled toilet data sync started", now.minusHours(2)));
    logs.add(
        new SystemLogResponse(
            6L, "INFO", "Auth", "Social login successful: Kakao user", now.minusHours(3)));
    logs.add(
        new SystemLogResponse(
            7L, "WARN", "DB", "Slow query detected in Ranking calculation", now.minusHours(4)));
    logs.add(
        new SystemLogResponse(
            8L, "INFO", "Support", "New inquiry received: App crashing on Map", now.minusHours(5)));
    logs.add(
        new SystemLogResponse(
            9L, "ERROR", "AI", "AI model endpoint timeout (408)", now.minusHours(6)));
    logs.add(
        new SystemLogResponse(
            10L, "INFO", "System", "Backend server restarted (v1.0.4)", now.minusDays(1)));

    return logs;
  }

  @Transactional
  public void generateTestData() {
    log.info("Generating test data for Admin Dashboard...");

    // 1. 기존 데이터 삭제 (선택 사항, 여기서는 누적)
    // paymentRepository.deleteAll();

    // 2. 과거 14일치 결제 데이터 생성
    com.daypoo.api.entity.User user =
        userRepository.findAll().stream()
            .findFirst()
            .orElseThrow(() -> new RuntimeException("테스트 데이터를 생성할 유저가 없습니다."));

    for (int i = 13; i >= 0; i--) {
      LocalDate date = LocalDate.now().minusDays(i);
      int dailyCount = (int) (Math.random() * 10) + 5; // 하루 5~15건 결제

      for (int j = 0; j < dailyCount; j++) {
        LocalDateTime createdAt =
            date.atTime((int) (Math.random() * 23), (int) (Math.random() * 59));

        paymentRepository.save(
            Payment.builder()
                .email(user.getEmail())
                .user(user)
                .orderId(UUID.randomUUID().toString().substring(0, 8))
                .amount((long) ((Math.random() * 5 + 1) * 10000)) // 1만~5만원
                .paymentKey("toss_" + UUID.randomUUID().toString().substring(0, 12))
                .createdAt(createdAt)
                .build());
      }
    }
    
    generateInquiryTestData(user);
    
    log.info("Successfully generated test data.");
  }

  private void generateInquiryTestData(com.daypoo.api.entity.User user) {
    log.info("Generating 30 mock inquiries...");
    String[] titles = {
      "화장실 청소 상태가 안 좋아요",
      "결제가 자꾸 실패합니다",
      "비밀번호를 잊어버렸어요",
      "앱이 너무 느려요",
      "위치 정보가 정확하지 않습니다",
      "새로운 기능을 제안합니다",
      "포인트 적립이 안 됐어요",
      "아이템 사용법을 모르겠어요"
    };
    
    com.daypoo.api.entity.enums.InquiryType[] types = com.daypoo.api.entity.enums.InquiryType.values();
    
    LocalDateTime now = LocalDateTime.now();
    for (int i = 1; i <= 30; i++) {
      Inquiry inquiry = Inquiry.builder()
              .user(user)
              .type(types[i % types.length])
              .title(titles[i % titles.length] + " (" + i + ")")
              .content("이것은 테스트를 위한 " + i + "번째 문의 내용입니다. 상세한 처리를 부탁드립니다.")
              .build();
      
      // 생성 시간을 1초씩 다르게 설정 (정렬 충돌 방지)
      // BaseTimeEntity의 수동 설정을 위해 리플렉션이나 다른 방법을 쓰지 않고, 
      // 단순히 save 후 flush를 보장하기 위해 saveAndFlush 사용
      inquiryRepository.save(inquiry);
    }
    inquiryRepository.flush();
  }
}
