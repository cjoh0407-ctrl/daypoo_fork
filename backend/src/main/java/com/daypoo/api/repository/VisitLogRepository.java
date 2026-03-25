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
}
