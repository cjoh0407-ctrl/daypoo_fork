package com.daypoo.api.repository;

import com.daypoo.api.entity.HealthReportSnapshot;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.ReportType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HealthReportSnapshotRepository extends JpaRepository<HealthReportSnapshot, Long> {
  Optional<HealthReportSnapshot> findFirstByUserAndReportTypeAndCreatedAtBetweenOrderByCreatedAtDesc(
      User user, ReportType reportType, LocalDateTime from, LocalDateTime to);

  List<HealthReportSnapshot> findByUserOrderByCreatedAtDesc(User user);
}
