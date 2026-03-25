package com.daypoo.api.entity;

import com.daypoo.api.entity.enums.ReportType;
import com.daypoo.api.global.BaseTimeEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "health_report_snapshots")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HealthReportSnapshot extends BaseTimeEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Enumerated(EnumType.STRING)
  @Column(name = "report_type", nullable = false)
  private ReportType reportType;

  @Column(name = "health_score", nullable = false)
  private int healthScore;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String summary;

  @Column(columnDefinition = "TEXT")
  private String solution;

  @Column(columnDefinition = "TEXT")
  private String insights;

  @Column(name = "record_count", nullable = false)
  private int recordCount;

  @Column(name = "period_start", nullable = false)
  private LocalDateTime periodStart;

  @Column(name = "period_end", nullable = false)
  private LocalDateTime periodEnd;

  @Builder
  public HealthReportSnapshot(
      User user,
      ReportType reportType,
      int healthScore,
      String summary,
      String solution,
      String insights,
      int recordCount,
      LocalDateTime periodStart,
      LocalDateTime periodEnd) {
    this.user = user;
    this.reportType = reportType;
    this.healthScore = healthScore;
    this.summary = summary;
    this.solution = solution;
    this.insights = insights;
    this.recordCount = recordCount;
    this.periodStart = periodStart;
    this.periodEnd = periodEnd;
  }
}
