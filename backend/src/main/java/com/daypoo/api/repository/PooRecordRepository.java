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

  @Query(
      value = "SELECT p FROM PooRecord p JOIN FETCH p.toilet WHERE p.user = :user",
      countQuery = "SELECT COUNT(p) FROM PooRecord p WHERE p.user = :user")
  Page<PooRecord> findByUserOrderByCreatedAtDesc(@Param("user") User user, Pageable pageable);

  long countByUser(User user);

  @Query("SELECT COUNT(DISTINCT p.toilet) FROM PooRecord p WHERE p.user = :user")
  long countDistinctToiletsByUser(@Param("user") User user);

  void deleteAllByUser(User user);

  @Query(
      "SELECT p.toilet.id as toiletId, COUNT(p) as visitCount FROM PooRecord p WHERE p.user = :user GROUP BY p.toilet.id")
  List<VisitCountProjection> findVisitCountsByUser(@Param("user") User user);

  @Query("SELECT COUNT(p) FROM PooRecord p WHERE p.user.id = :userId")
  long countByUserId(@Param("userId") Long userId);

  // 지역별 기록 수
  @Query("SELECT COUNT(p) FROM PooRecord p WHERE p.user = :user AND p.regionName = :region")
  long countByUserAndRegionName(@Param("user") User user, @Param("region") String region);

  // 지역별 고유 화장실 수
  @Query(
      "SELECT COUNT(DISTINCT p.toilet) FROM PooRecord p WHERE p.user = :user AND p.regionName = :region")
  long countDistinctToiletsByUserAndRegionName(
      @Param("user") User user, @Param("region") String region);

  @Query("SELECT DISTINCT p.regionName FROM PooRecord p WHERE p.regionName IS NOT NULL")
  List<String> findDistinctRegionNames();
}
