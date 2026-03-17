package com.daypoo.api.repository;

import com.daypoo.api.entity.PooRecord;
import com.daypoo.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface PooRecordRepository extends JpaRepository<PooRecord, Long> {
    List<PooRecord> findAllByUserAndCreatedAtAfterOrderByCreatedAtDesc(User user, LocalDateTime dateTime);
    long countByUser(User user);
}
