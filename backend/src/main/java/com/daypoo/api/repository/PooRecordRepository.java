package com.daypoo.api.repository;

import com.daypoo.api.entity.PooRecord;
import com.daypoo.api.entity.User;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PooRecordRepository extends JpaRepository<PooRecord, Long> {
  List<PooRecord> findAllByUserAndCreatedAtAfterOrderByCreatedAtDesc(
      User user, LocalDateTime dateTime);

  Page<PooRecord> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

  long countByUser(User user);

  @Query("SELECT COUNT(DISTINCT p.toilet) FROM PooRecord p WHERE p.user = :user")
  long countDistinctToiletsByUser(@Param("user") User user);
}
