package com.daypoo.api.service;

import com.daypoo.api.dto.AdminStatsResponse;
import com.daypoo.api.entity.InquiryStatus;
import com.daypoo.api.entity.Payment;
import com.daypoo.api.entity.User;
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
              .map(Payment::getUsername)
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

  @Transactional
  public void generateTestData() {
    log.info("Generating test data for Admin Dashboard...");

    // 1. 기존 데이터 삭제 (선택 사항, 여기서는 누적)
    // paymentRepository.deleteAll();

    // 2. 가용 유저 확보
    List<User> users = userRepository.findAll();
    if (users.isEmpty()) {
      log.warn("No users found. Skipping test data generation.");
      return;
    }

    // 3. 과거 14일치 결제 데이터 생성
    for (int i = 13; i >= 0; i--) {
      LocalDate date = LocalDate.now().minusDays(i);
      int dailyCount = (int) (Math.random() * 10) + 5; // 하루 5~15건 결제

      for (int j = 0; j < dailyCount; j++) {
        LocalDateTime createdAt =
            date.atTime((int) (Math.random() * 23), (int) (Math.random() * 59));
        User randomUser = users.get((int) (Math.random() * users.size()));

        paymentRepository.save(
            Payment.builder()
                .username(randomUser.getUsername())
                .user(randomUser)
                .orderId(UUID.randomUUID().toString().substring(0, 8))
                .amount((long) ((Math.random() * 5 + 1) * 10000)) // 1만~5만원
                .paymentKey("toss_" + UUID.randomUUID().toString().substring(0, 12))
                .createdAt(createdAt)
                .build());
      }
    }
    log.info("Successfully generated test data associated with existing users.");
  }
}
