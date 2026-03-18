package com.daypoo.api.entity;

import com.daypoo.api.global.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "titles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Title extends BaseTimeEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String name;

  @Column(nullable = false)
  private String description;

  @Column(name = "requirement_description")
  private String requirementDescription; // 획득 조건 설명 (예: "인증 50회 이상")

  @Builder
  public Title(String name, String description, String requirementDescription) {
    this.name = name;
    this.description = description;
    this.requirementDescription = requirementDescription;
  }
}
