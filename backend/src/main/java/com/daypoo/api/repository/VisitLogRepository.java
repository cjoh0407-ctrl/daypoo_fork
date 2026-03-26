package com.daypoo.api.repository;

import com.daypoo.api.entity.Toilet;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.VisitLog;
import com.daypoo.api.entity.enums.VisitEventType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VisitLogRepository extends JpaRepository<VisitLog, Long> {
  List<VisitLog> findByUserOrderByCreatedAtDesc(User user);

  List<VisitLog> findByUserAndEventTypeOrderByCreatedAtDesc(User user, VisitEventType eventType);

  List<VisitLog> findByToiletOrderByCreatedAtDesc(Toilet toilet);

  /** 특정 유저의 모든 방문 로그 삭제 (회원 탈퇴용) */
  void deleteAllByUser(User user);
}
