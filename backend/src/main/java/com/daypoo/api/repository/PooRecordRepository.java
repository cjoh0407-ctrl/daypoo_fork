package com.daypoo.api.repository;

import com.daypoo.api.entity.PooRecord;
import com.daypoo.api.entity.User;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PooRecordRepository extends JpaRepository<PooRecord, Long> {
  List<PooRecord> findAllByUserAndCreatedAtAfterOrderByCreatedAtDesc(
      User user, LocalDateTime dateTime);

  long countByUser(User user);
}
