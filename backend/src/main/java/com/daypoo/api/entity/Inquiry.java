package com.daypoo.api.entity;

import com.daypoo.api.global.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "inquiries")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Inquiry extends BaseTimeEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private InquiryType type;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String content;

  @Column(columnDefinition = "TEXT")
  private String answer;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private InquiryStatus status = InquiryStatus.PENDING;

  @Builder
  public Inquiry(User user, InquiryType type, String content) {
    this.user = user;
    this.type = type;
    this.content = content;
    this.status = InquiryStatus.PENDING;
  }

  public void answer(String answer) {
    this.answer = answer;
    this.status = InquiryStatus.COMPLETED;
  }
}
