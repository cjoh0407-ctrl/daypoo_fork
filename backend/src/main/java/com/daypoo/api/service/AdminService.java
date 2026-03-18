package com.daypoo.api.service;

import com.daypoo.api.dto.AdminStatsResponse;
import com.daypoo.api.entity.Inquiry;
import com.daypoo.api.entity.InquiryStatus;
import com.daypoo.api.entity.NotificationType;
import com.daypoo.api.repository.InquiryRepository;
import com.daypoo.api.repository.PooRecordRepository;
import com.daypoo.api.repository.ToiletRepository;
import com.daypoo.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class AdminService {

  private final UserRepository userRepository;
  private final PooRecordRepository recordRepository;
  private final ToiletRepository toiletRepository;
  private final InquiryRepository inquiryRepository;
  private final NotificationService notificationService;
  private final GeocodingService geocodingService;

  /** 좌표가 없는 화장실 데이터의 좌표를 지오코딩으로 채워넣습니다. (카카오 API 무료 한도를 고려하여 배치 단위로 수행 가능) */
  public int fillMissingCoordinates(int limit) {
    java.util.List<com.daypoo.api.entity.Toilet> targets =
        toiletRepository.findAll().stream()
            .filter(
                t -> t.getLocation() == null && t.getAddress() != null && !t.getAddress().isEmpty())
            .limit(limit)
            .collect(java.util.stream.Collectors.toList());

    int count = 0;
    for (com.daypoo.api.entity.Toilet toilet : targets) {
      org.locationtech.jts.geom.Point point = geocodingService.geocodeAddress(toilet.getAddress());
      if (point != null) {
        toilet.updateLocation(point);
        toiletRepository.save(toilet);
        count++;
      }
    }
    return count;
  }

  /** 관리자 대시보드 통계 조회 */
  @Transactional(readOnly = true)
  public AdminStatsResponse getDashboardStats() {
    return AdminStatsResponse.builder()
        .totalUsers(userRepository.count())
        .totalRecords(recordRepository.count())
        .totalToilets(toiletRepository.count())
        .pendingInquiries(
            inquiryRepository.findAll().stream()
                .filter(i -> i.getStatus() == InquiryStatus.PENDING)
                .count())
        .build();
  }

  /** 1:1 문의 답변 등록 */
  public void answerInquiry(Long inquiryId, String answer) {
    Inquiry inquiry =
        inquiryRepository
            .findById(inquiryId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 문의입니다."));
    inquiry.answer(answer);
    inquiryRepository.save(inquiry);

    // 유저에게 알림 전송
    notificationService.send(
        inquiry.getUser(),
        NotificationType.SYSTEM,
        "문의하신 내용에 답변이 등록되었습니다.",
        "문의하신 [" + inquiry.getType() + "]에 대한 답변이 완료되었습니다. 내 문의 내역에서 확인하세요!",
        "/my/inquiries");
  }
}
