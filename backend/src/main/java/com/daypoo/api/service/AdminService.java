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

    /**
     * 관리자 대시보드 통계 조회
     */
    @Transactional(readOnly = true)
    public AdminStatsResponse getDashboardStats() {
        return AdminStatsResponse.builder()
                .totalUsers(userRepository.count())
                .totalRecords(recordRepository.count())
                .totalToilets(toiletRepository.count())
                .pendingInquiries(inquiryRepository.findAll().stream()
                        .filter(i -> i.getStatus() == InquiryStatus.PENDING)
                        .count())
                .build();
    }

    /**
     * 1:1 문의 답변 등록
     */
    public void answerInquiry(Long inquiryId, String answer) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 문의입니다."));
        inquiry.answer(answer);
        inquiryRepository.save(inquiry);

        // 유저에게 알림 전송
        notificationService.send(
                inquiry.getUser(),
                NotificationType.SYSTEM,
                "문의하신 내용에 답변이 등록되었습니다.",
                "문의하신 [" + inquiry.getType() + "]에 대한 답변이 완료되었습니다. 내 문의 내역에서 확인하세요!",
                "/my/inquiries"
        );
    }
}
