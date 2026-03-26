package com.daypoo.api.service;

import com.daypoo.api.entity.Title;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.UserTitle;
import com.daypoo.api.entity.enums.AchievementType;
import com.daypoo.api.entity.enums.NotificationType;
import com.daypoo.api.repository.PooRecordRepository;
import com.daypoo.api.repository.TitleRepository;
import com.daypoo.api.repository.UserTitleRepository;
import com.daypoo.api.repository.VisitCountProjection;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TitleAchievementService {

  private final PooRecordRepository recordRepository;
  private final TitleRepository titleRepository;
  private final UserTitleRepository userTitleRepository;
  private final NotificationService notificationService;
  private final UserService userService;

  /** 유저의 업적 달성 여부를 검사하고 칭호를 부여함 */
  @Transactional
  public void checkAndGrantTitles(User user) {
    List<Title> allTitles = titleRepository.findAll();

    for (Title title : allTitles) {
      if (userTitleRepository.existsByUserAndTitle(user, title)) {
        continue;
      }

      boolean achieved = checkAchievement(user, title);
      if (achieved) {
        grantTitle(user, title);
      }
    }
  }

  private boolean checkAchievement(User user, Title title) {
    long value = computeProgress(user, title.getAchievementType());
    return value >= title.getAchievementThreshold();
  }

  public long computeProgress(User user, AchievementType type) {
    return switch (type) {
      case TOTAL_RECORDS -> recordRepository.countByUser(user);
      case UNIQUE_TOILETS -> recordRepository.countDistinctToiletsByUser(user);
      case CONSECUTIVE_DAYS -> (long) userService.getConsecutiveDays(user);
      case SAME_TOILET_VISITS ->
          recordRepository.findVisitCountsByUser(user).stream()
              .mapToLong(VisitCountProjection::getVisitCount)
              .max()
              .orElse(0);
      case LEVEL_REACHED -> (long) user.getLevel();
    };
  }

  private void grantTitle(User user, Title title) {
    UserTitle userTitle = UserTitle.builder().user(user).title(title).build();
    userTitleRepository.saveAndFlush(userTitle);
    log.info("New title granted to user {}: {}", user.getEmail(), title.getName());

    // 알림 발송 (Push/In-app)
    String notificationTitle = "새로운 칭호 획득!";
    String notificationContent = String.format("업적을 달성하여 [%s] 칭호를 획득했습니다!", title.getName());
    notificationService.send(
        user, NotificationType.ACHIEVEMENT, notificationTitle, notificationContent, "/mypage");
  }
}
