package com.daypoo.api.service;

import com.daypoo.api.entity.NotificationType;
import com.daypoo.api.entity.Title;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.UserTitle;
import com.daypoo.api.repository.PooRecordRepository;
import com.daypoo.api.repository.TitleRepository;
import com.daypoo.api.repository.UserTitleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AchievementService {

    private final PooRecordRepository recordRepository;
    private final TitleRepository titleRepository;
    private final UserTitleRepository userTitleRepository;
    private final NotificationService notificationService;

    /**
     * 유저의 업적을 체크하고 칭호를 자동 부여
     */
    @Transactional
    public void checkAndGrantTitles(User user) {
        long recordCount = recordRepository.countByUser(user);

        // 1. 첫 기록 달성 ("초보 쾌변러")
        if (recordCount >= 1) {
            grantTitleIfEligible(user, "초보 쾌변러", "첫 배변 기록을 남긴 유저에게 수여되는 칭호");
        }

        // 2. 10회 기록 달성 ("성실한 배변가")
        if (recordCount >= 10) {
            grantTitleIfEligible(user, "성실한 배변가", "10번의 기록을 남긴 성실한 유저에게 수여되는 칭호");
        }

        // 3. 50회 기록 달성 ("대똥여지도 마스터")
        if (recordCount >= 50) {
            grantTitleIfEligible(user, "대똥여지도 마스터", "50번의 기록을 남긴 진정한 마스터에게 수여되는 칭호");
        }
    }

    private void grantTitleIfEligible(User user, String titleName, String description) {
        // 1. 칭호가 시스템에 등록되어 있는지 확인 (없으면 생성 - 편의상)
        Title title = titleRepository.findByName(titleName)
                .orElseGet(() -> titleRepository.save(Title.builder()
                        .name(titleName)
                        .description(description)
                        .requirementDescription("배변 인증 횟수 충족")
                        .build()));

        // 2. 이미 보유 중인지 확인
        if (!userTitleRepository.existsByUserAndTitleId(user, title.getId())) {
            userTitleRepository.save(UserTitle.builder()
                    .user(user)
                    .title(title)
                    .build());

            // 3. 알림 전송
            notificationService.send(
                    user,
                    NotificationType.SOCIAL,
                    "새로운 칭호를 획득했습니다!",
                    "축하합니다! [" + titleName + "] 칭호를 획득하셨습니다. 마이페이지에서 장착해보세요!",
                    "/my/profile"
            );
            log.info("Title '{}' granted to user {}", titleName, user.getId());
        }
    }
}
