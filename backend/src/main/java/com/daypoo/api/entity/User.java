package com.daypoo.api.entity;

import com.daypoo.api.global.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 100)
  private String username;

  @Column(nullable = false)
  private String password;

  @Column(nullable = false, unique = true, length = 50)
  private String nickname;

  @Column(name = "equipped_title_id")
  private Long equippedTitleId;

  @Column(nullable = false)
  private int level = 1;

  @Column(nullable = false)
  private long exp = 0L;

  @Column(nullable = false)
  private long points = 0L;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Role role;

  @Builder
  public User(String username, String password, String nickname, Role role) {
    this.username = username;
    this.password = password;
    this.nickname = nickname;
    this.role = role != null ? role : Role.ROLE_USER;
    this.level = 1;
    this.exp = 0L;
    this.points = 0L;
  }

  public enum Role {
    ROLE_USER,
    ROLE_ADMIN
  }

  public void addExpAndPoints(long addedExp, long addedPoints) {
    this.exp += addedExp;
    this.points += addedPoints;

    // Simple level up logic: level * 100 exp to level up
    while (this.exp >= this.level * 100) {
      this.exp -= this.level * 100;
      this.level += 1;
    }
  }

  public void deductPoints(long amount) {
    if (this.points < amount) {
      throw new IllegalStateException("포인트가 부족합니다.");
    }
    this.points -= amount;
  }

  public void equipTitle(Long titleId) {
    this.equippedTitleId = titleId;
  }
}
