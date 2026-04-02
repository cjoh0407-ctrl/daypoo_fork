# PRO 멤버십 구독 시스템 구축 가이드 (백엔드 팀 전달용)

## Context (문제 상황)

### 현재 문제점
사용자가 PRO 멤버십을 결제했지만, 다음 두 가지 문제가 발생하고 있습니다:

1. **결제는 성공하지만 PRO 기능이 잠긴 상태 유지**
   - 7일/30일 리포트가 여전히 잠금 상태
   - 사용자는 결제했지만 혜택을 받지 못함

2. **PRO 멤버십 상태가 DB에 저장되지 않음**
   - 결제 후 User의 role이 업데이트되지 않음
   - 페이지 새로고침해도 PRO 상태가 반영되지 않음

### 근본 원인 분석

#### 1. Role Enum에 PRO/PREMIUM 역할이 없음
**현재 상태** (`Role.java`):
```java
public enum Role {
  ROLE_USER,   // 일반 사용자
  ROLE_ADMIN   // 관리자
}
```
→ `ROLE_PRO`, `ROLE_PREMIUM` 정의되지 않음

#### 2. PaymentService가 역할을 업그레이드하지 않음
**현재 로직** (`PaymentService.java:82`):
```java
addPointsToUser(user, amount);  // 포인트만 추가
// 역할 업데이트 로직 없음!
```
→ 결제 성공해도 User의 role은 `ROLE_USER` 그대로 유지

#### 3. 프론트엔드는 존재하지 않는 역할을 체크
**프론트엔드 로직** (`MyPage.tsx:1103`):
```typescript
const isPro = user?.role && ['ROLE_PRO', 'ROLE_PREMIUM', 'ROLE_ADMIN'].includes(user.role);
```
→ 백엔드에 없는 역할을 확인하므로 항상 `false`

### 해결 방향

**Subscription(구독) 테이블 기반 멤버십 시스템 구축**

- Role enum은 기본 권한(`ROLE_USER`, `ROLE_ADMIN`)만 유지
- 별도 `Subscription` 테이블로 멤버십 상태 관리
- 구독 시작일/만료일 자동 관리
- 자동 갱신/취소 로직 지원
- 구독 히스토리 보관

이 방식은 Netflix, Spotify 등 주요 구독 서비스의 표준 아키텍처입니다.

---

## 1. Subscription 테이블 설계

### 1.1 Subscription Entity 생성

**파일 위치**: `backend/src/main/java/com/daypoo/api/entity/Subscription.java`

```java
package com.daypoo.api.entity;

import com.daypoo.api.entity.enums.BillingCycle;
import com.daypoo.api.entity.enums.SubscriptionPlan;
import com.daypoo.api.entity.enums.SubscriptionStatus;
import com.daypoo.api.global.BaseTimeEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "subscriptions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Subscription extends BaseTimeEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(nullable = false)
  @Enumerated(EnumType.STRING)
  private SubscriptionPlan plan;  // BASIC, PRO, PREMIUM

  @Column(name = "start_date", nullable = false)
  private LocalDateTime startDate;

  @Column(name = "end_date")
  private LocalDateTime endDate;

  @Column(nullable = false)
  @Enumerated(EnumType.STRING)
  private SubscriptionStatus status;  // ACTIVE, CANCELLED, EXPIRED

  @Column(name = "billing_cycle")
  @Enumerated(EnumType.STRING)
  private BillingCycle billingCycle;  // MONTHLY, YEARLY

  @Column(name = "is_auto_renewal", nullable = false)
  private boolean isAutoRenewal = true;

  // 최근 결제 참조 (선택사항)
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "last_payment_id")
  private Payment lastPayment;

  @Builder
  public Subscription(
      User user,
      SubscriptionPlan plan,
      LocalDateTime startDate,
      LocalDateTime endDate,
      SubscriptionStatus status,
      BillingCycle billingCycle,
      boolean isAutoRenewal,
      Payment lastPayment) {
    this.user = user;
    this.plan = plan;
    this.startDate = startDate;
    this.endDate = endDate;
    this.status = status;
    this.billingCycle = billingCycle;
    this.isAutoRenewal = isAutoRenewal;
    this.lastPayment = lastPayment;
  }

  // === 비즈니스 로직 ===

  /** 구독 활성화 */
  public void activate(LocalDateTime newEndDate) {
    this.status = SubscriptionStatus.ACTIVE;
    this.endDate = newEndDate;
  }

  /** 구독 취소 */
  public void cancel() {
    this.status = SubscriptionStatus.CANCELLED;
    this.isAutoRenewal = false;
  }

  /** 구독 만료 */
  public void expire() {
    this.status = SubscriptionStatus.EXPIRED;
  }

  /** 구독 갱신 */
  public void renew(LocalDateTime newEndDate, Payment payment) {
    this.startDate = LocalDateTime.now();
    this.endDate = newEndDate;
    this.status = SubscriptionStatus.ACTIVE;
    this.lastPayment = payment;
  }

  /** 활성 구독 여부 확인 */
  public boolean isActive() {
    return status == SubscriptionStatus.ACTIVE
        && endDate != null
        && endDate.isAfter(LocalDateTime.now());
  }

  /** 자동 갱신 비활성화 */
  public void disableAutoRenewal() {
    this.isAutoRenewal = false;
  }

  /** 자동 갱신 활성화 */
  public void enableAutoRenewal() {
    this.isAutoRenewal = true;
  }
}
```

### 1.2 User Entity 관계 추가

**파일 위치**: `backend/src/main/java/com/daypoo/api/entity/User.java`

**기존 코드에 추가**:
```java
@OneToMany(mappedBy = "user", cascade = CascadeType.REMOVE, orphanRemoval = true)
private List<Subscription> subscriptions = new ArrayList<>();

/**
 * 현재 활성 구독 조회
 * @return 활성 구독 또는 null
 */
public Subscription getActiveSubscription() {
  return subscriptions.stream()
      .filter(Subscription::isActive)
      .findFirst()
      .orElse(null);
}

/**
 * PRO 멤버십 여부 확인
 * @return PRO 이상 멤버십이면 true
 */
public boolean isPro() {
  Subscription active = getActiveSubscription();
  if (active == null) return false;

  SubscriptionPlan plan = active.getPlan();
  return plan == SubscriptionPlan.PRO || plan == SubscriptionPlan.PREMIUM;
}

/**
 * 특정 플랜 확인
 * @param plan 확인할 플랜
 * @return 해당 플랜이면 true
 */
public boolean hasPlan(SubscriptionPlan plan) {
  Subscription active = getActiveSubscription();
  return active != null && active.getPlan() == plan;
}
```

---

## 2. 새로운 Enum 정의

### 2.1 SubscriptionPlan Enum

**파일 위치**: `backend/src/main/java/com/daypoo/api/entity/enums/SubscriptionPlan.java`

```java
package com.daypoo.api.entity.enums;

public enum SubscriptionPlan {
  BASIC(0, "무료 플랜"),           // 기본 무료
  PRO(4900, "PRO 플랜"),           // 7일/30일 리포트
  PREMIUM(9900, "PREMIUM 플랜");    // AI 맞춤 식단 조언 포함

  private final long monthlyPrice;
  private final String displayName;

  SubscriptionPlan(long monthlyPrice, String displayName) {
    this.monthlyPrice = monthlyPrice;
    this.displayName = displayName;
  }

  public long getMonthlyPrice() {
    return monthlyPrice;
  }

  public String getDisplayName() {
    return displayName;
  }

  /** 금액으로 플랜 찾기 */
  public static SubscriptionPlan fromAmount(long amount) {
    for (SubscriptionPlan plan : values()) {
      if (plan.monthlyPrice == amount) {
        return plan;
      }
    }
    return BASIC;  // 기본값
  }
}
```

### 2.2 SubscriptionStatus Enum

**파일 위치**: `backend/src/main/java/com/daypoo/api/entity/enums/SubscriptionStatus.java`

```java
package com.daypoo.api.entity.enums;

public enum SubscriptionStatus {
  ACTIVE,      // 활성 (사용 가능)
  CANCELLED,   // 취소됨 (만료일까지 사용 가능)
  EXPIRED      // 만료됨 (사용 불가)
}
```

### 2.3 BillingCycle Enum

**파일 위치**: `backend/src/main/java/com/daypoo/api/entity/enums/BillingCycle.java`

```java
package com.daypoo.api.entity.enums;

import java.time.LocalDateTime;

public enum BillingCycle {
  MONTHLY(1, "월간"),
  YEARLY(12, "연간");

  private final int months;
  private final String displayName;

  BillingCycle(int months, String displayName) {
    this.months = months;
    this.displayName = displayName;
  }

  public int getMonths() {
    return months;
  }

  public String getDisplayName() {
    return displayName;
  }

  /** 현재 시간 기준으로 만료일 계산 */
  public LocalDateTime calculateEndDate(LocalDateTime startDate) {
    return startDate.plusMonths(months);
  }
}
```

---

## 3. Repository 생성

### 3.1 SubscriptionRepository

**파일 위치**: `backend/src/main/java/com/daypoo/api/repository/SubscriptionRepository.java`

```java
package com.daypoo.api.repository;

import com.daypoo.api.entity.Subscription;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.SubscriptionStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

  /** 사용자의 모든 구독 조회 (최신순) */
  List<Subscription> findAllByUserOrderByCreatedAtDesc(User user);

  /** 사용자의 활성 구독 조회 */
  @Query(
      "SELECT s FROM Subscription s "
          + "WHERE s.user = :user "
          + "AND s.status = :status "
          + "AND s.endDate > :now")
  Optional<Subscription> findActiveSubscription(
      @Param("user") User user,
      @Param("status") SubscriptionStatus status,
      @Param("now") LocalDateTime now);

  /** 만료된 구독 조회 (배치 작업용) */
  @Query(
      "SELECT s FROM Subscription s "
          + "WHERE s.status = 'ACTIVE' "
          + "AND s.endDate < :now")
  List<Subscription> findExpiredSubscriptions(@Param("now") LocalDateTime now);

  /** 자동 갱신 대상 구독 조회 (배치 작업용) */
  @Query(
      "SELECT s FROM Subscription s "
          + "WHERE s.status = 'ACTIVE' "
          + "AND s.isAutoRenewal = true "
          + "AND s.endDate BETWEEN :start AND :end")
  List<Subscription> findSubscriptionsForRenewal(
      @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

  /** 사용자의 구독 히스토리 개수 */
  long countByUser(User user);

  /** 특정 상태의 전체 구독 수 (통계용) */
  long countByStatus(SubscriptionStatus status);
}
```

---

## 4. Service 로직 구현

### 4.1 SubscriptionService

**파일 위치**: `backend/src/main/java/com/daypoo/api/service/SubscriptionService.java`

```java
package com.daypoo.api.service;

import com.daypoo.api.entity.Payment;
import com.daypoo.api.entity.Subscription;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.BillingCycle;
import com.daypoo.api.entity.enums.SubscriptionPlan;
import com.daypoo.api.entity.enums.SubscriptionStatus;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.SubscriptionRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SubscriptionService {

  private final SubscriptionRepository subscriptionRepository;

  /**
   * 새 구독 생성
   *
   * @param user 사용자
   * @param plan 구독 플랜
   * @param billingCycle 결제 주기
   * @param payment 결제 정보
   * @return 생성된 구독
   */
  public Subscription createSubscription(
      User user, SubscriptionPlan plan, BillingCycle billingCycle, Payment payment) {

    // 기존 활성 구독이 있으면 취소
    getActiveSubscription(user)
        .ifPresent(
            existingSub -> {
              log.info("기존 구독 취소: userId={}, plan={}", user.getId(), existingSub.getPlan());
              existingSub.cancel();
            });

    // 새 구독 생성
    LocalDateTime startDate = LocalDateTime.now();
    LocalDateTime endDate = billingCycle.calculateEndDate(startDate);

    Subscription subscription =
        Subscription.builder()
            .user(user)
            .plan(plan)
            .startDate(startDate)
            .endDate(endDate)
            .status(SubscriptionStatus.ACTIVE)
            .billingCycle(billingCycle)
            .isAutoRenewal(true)
            .lastPayment(payment)
            .build();

    subscriptionRepository.save(subscription);
    log.info(
        "새 구독 생성: userId={}, plan={}, endDate={}", user.getId(), plan, endDate);

    return subscription;
  }

  /**
   * 사용자의 활성 구독 조회
   *
   * @param user 사용자
   * @return 활성 구독 (Optional)
   */
  @Transactional(readOnly = true)
  public java.util.Optional<Subscription> getActiveSubscription(User user) {
    return subscriptionRepository.findActiveSubscription(
        user, SubscriptionStatus.ACTIVE, LocalDateTime.now());
  }

  /**
   * 구독 취소
   *
   * @param user 사용자
   */
  public void cancelSubscription(User user) {
    Subscription subscription =
        getActiveSubscription(user)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

    subscription.cancel();
    log.info("구독 취소: userId={}, plan={}", user.getId(), subscription.getPlan());
  }

  /**
   * 자동 갱신 토글
   *
   * @param user 사용자
   * @param enable true면 활성화, false면 비활성화
   */
  public void toggleAutoRenewal(User user, boolean enable) {
    Subscription subscription =
        getActiveSubscription(user)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

    if (enable) {
      subscription.enableAutoRenewal();
    } else {
      subscription.disableAutoRenewal();
    }

    log.info(
        "자동 갱신 변경: userId={}, autoRenewal={}",
        user.getId(),
        subscription.isAutoRenewal());
  }

  /**
   * 구독 갱신
   *
   * @param subscription 갱신할 구독
   * @param payment 새 결제 정보
   */
  public void renewSubscription(Subscription subscription, Payment payment) {
    LocalDateTime newEndDate =
        subscription.getBillingCycle().calculateEndDate(LocalDateTime.now());
    subscription.renew(newEndDate, payment);

    log.info(
        "구독 갱신: userId={}, plan={}, newEndDate={}",
        subscription.getUser().getId(),
        subscription.getPlan(),
        newEndDate);
  }

  /**
   * 만료된 구독 처리 (배치 작업용)
   *
   * @return 처리된 구독 수
   */
  public int expireOverdueSubscriptions() {
    List<Subscription> expiredSubs =
        subscriptionRepository.findExpiredSubscriptions(LocalDateTime.now());

    expiredSubs.forEach(Subscription::expire);

    log.info("만료 처리 완료: count={}", expiredSubs.size());
    return expiredSubs.size();
  }

  /**
   * 사용자의 전체 구독 히스토리 조회
   *
   * @param user 사용자
   * @return 구독 목록
   */
  @Transactional(readOnly = true)
  public List<Subscription> getSubscriptionHistory(User user) {
    return subscriptionRepository.findAllByUserOrderByCreatedAtDesc(user);
  }
}
```

### 4.2 PaymentService 수정

**파일 위치**: `backend/src/main/java/com/daypoo/api/service/PaymentService.java`

**수정할 부분** (82번 줄 이후):

```java
// 기존 코드
addPointsToUser(user, amount);
log.info("✅ Payment confirmed, recorded, and points awarded for user: {}", email);

// ↓↓↓ 아래 코드 추가 ↓↓↓

// 결제 엔티티 저장 (이미 위에서 save 했으므로 변수로 받아야 함)
Payment savedPayment = paymentRepository.save(
    Payment.builder()
        .email(email)
        .user(user)
        .orderId(orderId)
        .amount(amount)
        .paymentKey(paymentKey)
        .build());

// orderId로 구독 플랜 판단
SubscriptionPlan plan = determinePlanFromOrderId(orderId, amount);

// 구독 생성 (PRO, PREMIUM만)
if (plan != SubscriptionPlan.BASIC) {
  subscriptionService.createSubscription(
      user,
      plan,
      BillingCycle.MONTHLY,  // 기본 월간 구독
      savedPayment);
  log.info("✅ Subscription created: userId={}, plan={}", user.getId(), plan);
}
```

**추가 메서드** (PaymentService 클래스 내부):

```java
/**
 * orderId 또는 amount로 구독 플랜 판단
 *
 * @param orderId 주문 ID
 * @param amount 결제 금액
 * @return 구독 플랜
 */
private SubscriptionPlan determinePlanFromOrderId(String orderId, Long amount) {
  // orderId에 플랜 정보가 포함된 경우 (예: "POOPMAP_123456_PRO")
  if (orderId.toUpperCase().contains("PRO")) {
    return SubscriptionPlan.PRO;
  } else if (orderId.toUpperCase().contains("PREMIUM")) {
    return SubscriptionPlan.PREMIUM;
  }

  // orderId에 정보가 없으면 금액으로 판단
  return SubscriptionPlan.fromAmount(amount);
}
```

**생성자에 SubscriptionService 주입 추가**:

```java
private final SubscriptionService subscriptionService;

public PaymentService(
    UserService userService,
    PaymentRepository paymentRepository,
    ObjectMapper objectMapper,
    SubscriptionService subscriptionService,  // 추가
    @Qualifier("externalRestTemplate") RestTemplate restTemplate) {
  this.userService = userService;
  this.paymentRepository = paymentRepository;
  this.objectMapper = objectMapper;
  this.subscriptionService = subscriptionService;  // 추가
  this.restTemplate = restTemplate;
}
```

---

## 5. DTO 설계

### 5.1 SubscriptionResponse

**파일 위치**: `backend/src/main/java/com/daypoo/api/dto/SubscriptionResponse.java`

```java
package com.daypoo.api.dto;

import com.daypoo.api.entity.Subscription;
import com.daypoo.api.entity.enums.BillingCycle;
import com.daypoo.api.entity.enums.SubscriptionPlan;
import com.daypoo.api.entity.enums.SubscriptionStatus;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record SubscriptionResponse(
    Long id,
    SubscriptionPlan plan,
    String planDisplayName,
    SubscriptionStatus status,
    BillingCycle billingCycle,
    LocalDateTime startDate,
    LocalDateTime endDate,
    boolean isAutoRenewal,
    boolean isActive,
    Long daysRemaining) {

  public static SubscriptionResponse from(Subscription subscription) {
    Long daysRemaining = null;
    if (subscription.getEndDate() != null) {
      daysRemaining =
          java.time.Duration.between(LocalDateTime.now(), subscription.getEndDate()).toDays();
    }

    return SubscriptionResponse.builder()
        .id(subscription.getId())
        .plan(subscription.getPlan())
        .planDisplayName(subscription.getPlan().getDisplayName())
        .status(subscription.getStatus())
        .billingCycle(subscription.getBillingCycle())
        .startDate(subscription.getStartDate())
        .endDate(subscription.getEndDate())
        .isAutoRenewal(subscription.isAutoRenewal())
        .isActive(subscription.isActive())
        .daysRemaining(daysRemaining)
        .build();
  }
}
```

### 5.2 UserResponse 수정

**파일 위치**: `backend/src/main/java/com/daypoo/api/dto/UserResponse.java`

**기존 필드에 추가**:

```java
@Builder
public record UserResponse(
    Long id,
    String email,
    String nickname,
    String role,
    int level,
    long exp,
    long points,
    Long equippedTitleId,
    String equippedTitleName,
    Boolean isPro,                    // 추가
    SubscriptionResponse subscription, // 추가
    LocalDateTime createdAt) {

  public static UserResponse from(User user) {
    return UserResponse.from(user, null, null);
  }

  public static UserResponse from(User user, String equippedTitleName) {
    return UserResponse.from(user, equippedTitleName, null);
  }

  public static UserResponse from(
      User user, String equippedTitleName, Subscription subscription) {

    SubscriptionResponse subResponse = null;
    if (subscription != null) {
      subResponse = SubscriptionResponse.from(subscription);
    }

    return UserResponse.builder()
        .id(user.getId())
        .email(user.getEmail())
        .nickname(user.getNickname())
        .role(user.getRole().name())
        .level(user.getLevel())
        .exp(user.getExp())
        .points(user.getPoints())
        .equippedTitleId(user.getEquippedTitleId())
        .equippedTitleName(equippedTitleName)
        .isPro(user.isPro())              // 추가
        .subscription(subResponse)         // 추가
        .createdAt(user.getCreatedAt())
        .build();
  }
}
```

---

## 6. Controller API 엔드포인트 설계

### 6.1 SubscriptionController

**파일 위치**: `backend/src/main/java/com/daypoo/api/controller/SubscriptionController.java`

```java
package com.daypoo.api.controller;

import com.daypoo.api.dto.SubscriptionResponse;
import com.daypoo.api.entity.Subscription;
import com.daypoo.api.entity.User;
import com.daypoo.api.service.SubscriptionService;
import com.daypoo.api.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Subscription", description = "구독 관리 API")
@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

  private final SubscriptionService subscriptionService;
  private final UserService userService;

  /** 내 활성 구독 조회 */
  @Operation(summary = "내 활성 구독 조회", description = "현재 활성화된 구독 정보를 조회합니다.")
  @GetMapping("/me")
  public ResponseEntity<SubscriptionResponse> getMySubscription(
      @AuthenticationPrincipal String email) {
    User user = userService.getByEmail(email);
    Subscription subscription =
        subscriptionService
            .getActiveSubscription(user)
            .orElseThrow(() -> new IllegalArgumentException("활성 구독이 없습니다."));

    return ResponseEntity.ok(SubscriptionResponse.from(subscription));
  }

  /** 구독 히스토리 조회 */
  @Operation(summary = "구독 히스토리", description = "과거 구독 내역을 포함한 전체 히스토리를 조회합니다.")
  @GetMapping("/history")
  public ResponseEntity<List<SubscriptionResponse>> getSubscriptionHistory(
      @AuthenticationPrincipal String email) {
    User user = userService.getByEmail(email);
    List<Subscription> history = subscriptionService.getSubscriptionHistory(user);

    return ResponseEntity.ok(
        history.stream().map(SubscriptionResponse::from).toList());
  }

  /** 구독 취소 */
  @Operation(
      summary = "구독 취소",
      description = "현재 구독을 취소합니다. 만료일까지는 사용 가능합니다.")
  @PostMapping("/cancel")
  public ResponseEntity<String> cancelSubscription(@AuthenticationPrincipal String email) {
    User user = userService.getByEmail(email);
    subscriptionService.cancelSubscription(user);
    return ResponseEntity.ok("구독이 취소되었습니다. 만료일까지 사용 가능합니다.");
  }

  /** 자동 갱신 토글 */
  @Operation(summary = "자동 갱신 설정", description = "자동 갱신을 활성화/비활성화합니다.")
  @PatchMapping("/auto-renewal")
  public ResponseEntity<String> toggleAutoRenewal(
      @AuthenticationPrincipal String email, @RequestParam boolean enable) {
    User user = userService.getByEmail(email);
    subscriptionService.toggleAutoRenewal(user, enable);
    return ResponseEntity.ok(
        enable ? "자동 갱신이 활성화되었습니다." : "자동 갱신이 비활성화되었습니다.");
  }
}
```

### 6.2 AuthService 수정

**파일 위치**: `backend/src/main/java/com/daypoo/api/service/AuthService.java`

**getCurrentUserInfo 메서드 수정**:

```java
@Transactional(readOnly = true)
public UserResponse getCurrentUserInfo() {
  Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
  String email = authentication.getName();
  User user = getByEmail(email);

  String equippedTitleName = null;
  if (user.getEquippedTitleId() != null) {
    equippedTitleName =
        titleRepository
            .findById(user.getEquippedTitleId())
            .map(Title::getName)
            .orElse(null);
  }

  // 활성 구독 정보 추가
  Subscription activeSubscription = user.getActiveSubscription();

  return UserResponse.from(user, equippedTitleName, activeSubscription);
}
```

---

## 7. 프론트엔드 API 명세

### 7.1 API 엔드포인트

| 메서드 | 엔드포인트 | 설명 | 응답 |
|--------|-----------|------|------|
| GET | `/api/v1/auth/me` | 내 정보 조회 (isPro 포함) | UserResponse |
| GET | `/api/v1/subscriptions/me` | 내 활성 구독 조회 | SubscriptionResponse |
| GET | `/api/v1/subscriptions/history` | 구독 히스토리 | List<SubscriptionResponse> |
| POST | `/api/v1/subscriptions/cancel` | 구독 취소 | String |
| PATCH | `/api/v1/subscriptions/auto-renewal?enable=true` | 자동 갱신 설정 | String |

### 7.2 프론트엔드에서 사용할 인터페이스

**파일 위치**: `frontend/src/types/subscription.ts` (신규 생성)

```typescript
export type SubscriptionPlan = 'BASIC' | 'PRO' | 'PREMIUM';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
export type BillingCycle = 'MONTHLY' | 'YEARLY';

export interface SubscriptionResponse {
  id: number;
  plan: SubscriptionPlan;
  planDisplayName: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startDate: string;
  endDate: string;
  isAutoRenewal: boolean;
  isActive: boolean;
  daysRemaining: number | null;
}

export interface UserResponse {
  id: number;
  email: string;
  nickname: string;
  role: string;
  level: number;
  exp: number;
  points: number;
  equippedTitleId: number | null;
  equippedTitleName: string | null;
  isPro: boolean;  // 추가
  subscription: SubscriptionResponse | null;  // 추가
  createdAt: string;
}
```

### 7.3 프론트엔드 사용 예시

**isPro 확인 (기존 방식 대체)**:

```typescript
// ❌ 기존 방식 (백엔드에 role 없어서 동작 안 함)
const isPro = user?.role && ['ROLE_PRO', 'ROLE_PREMIUM', 'ROLE_ADMIN'].includes(user.role);

// ✅ 새로운 방식 (백엔드가 계산해서 줌)
const isPro = user?.isPro || false;
```

**구독 정보 표시**:

```typescript
const subscription = user?.subscription;

if (subscription && subscription.isActive) {
  console.log(`플랜: ${subscription.planDisplayName}`);
  console.log(`남은 일수: ${subscription.daysRemaining}일`);
  console.log(`자동 갱신: ${subscription.isAutoRenewal ? '켜짐' : '꺼짐'}`);
}
```

**결제 완료 후 사용자 정보 새로고침**:

**파일 위치**: `frontend/src/pages/PaymentSuccessPage.tsx`

```typescript
// 기존 코드 (line 31 이후)
await api.post('/payments/confirm', {
  paymentKey,
  orderId,
  amount: Number(amount),
});

// ↓↓↓ 추가 ↓↓↓
// 사용자 정보 새로고침 (isPro, subscription 업데이트)
await refreshUser();

setLoading(false);
```

**AuthContext에서 refreshUser 사용**:

```typescript
import { useAuth } from '../context/AuthContext';

const { refreshUser } = useAuth();

// 결제 완료 후
await refreshUser();  // /api/v1/auth/me 호출하여 user 상태 업데이트
```

---

## 8. 데이터베이스 마이그레이션

### 8.1 Flyway 마이그레이션 SQL

**파일 위치**: `backend/src/main/resources/db/migration/V14__add_subscriptions.sql`

```sql
-- subscriptions 테이블 생성
CREATE TABLE subscriptions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  plan VARCHAR(20) NOT NULL,  -- BASIC, PRO, PREMIUM
  start_date DATETIME NOT NULL,
  end_date DATETIME,
  status VARCHAR(20) NOT NULL,  -- ACTIVE, CANCELLED, EXPIRED
  billing_cycle VARCHAR(20),  -- MONTHLY, YEARLY
  is_auto_renewal BOOLEAN NOT NULL DEFAULT TRUE,
  last_payment_id BIGINT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_subscription_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_subscription_payment FOREIGN KEY (last_payment_id) REFERENCES payments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 인덱스 생성
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);

-- 활성 구독 조회 성능 최적화 인덱스
CREATE INDEX idx_subscriptions_active_lookup ON subscriptions(user_id, status, end_date);
```

---

## 9. 배치 작업 (선택사항)

### 9.1 만료된 구독 자동 처리

**파일 위치**: `backend/src/main/java/com/daypoo/api/scheduler/SubscriptionScheduler.java`

```java
package com.daypoo.api.scheduler;

import com.daypoo.api.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SubscriptionScheduler {

  private final SubscriptionService subscriptionService;

  /** 매일 오전 3시에 만료된 구독 처리 */
  @Scheduled(cron = "0 0 3 * * ?")
  public void expireOverdueSubscriptions() {
    log.info("=== 만료된 구독 처리 시작 ===");
    int count = subscriptionService.expireOverdueSubscriptions();
    log.info("=== 만료 처리 완료: {}건 ===", count);
  }
}
```

**스케줄러 활성화**:

`Application.java`에 `@EnableScheduling` 추가:

```java
@SpringBootApplication
@EnableScheduling  // 추가
public class Application {
  public static void main(String[] args) {
    SpringApplication.run(Application.class, args);
  }
}
```

---

## 10. 검증 계획

### 10.1 백엔드 테스트

**Postman/Insomnia 테스트 시나리오**:

1. **PRO 결제 시뮬레이션**
   ```
   POST /api/v1/payments/confirm
   {
     "paymentKey": "test_key_123",
     "orderId": "POOPMAP_1234567890_PRO",
     "amount": 4900
   }
   ```
   - Payment 레코드 생성 확인
   - Subscription 레코드 생성 확인
   - User의 포인트 증가 확인

2. **사용자 정보 조회**
   ```
   GET /api/v1/auth/me
   ```
   - `isPro: true` 확인
   - `subscription` 객체 존재 확인
   - `subscription.isActive: true` 확인

3. **활성 구독 조회**
   ```
   GET /api/v1/subscriptions/me
   ```
   - 구독 정보 정상 반환 확인

4. **구독 취소**
   ```
   POST /api/v1/subscriptions/cancel
   ```
   - status가 CANCELLED로 변경 확인
   - isAutoRenewal이 false로 변경 확인

### 10.2 프론트엔드 테스트

1. **결제 후 PRO 상태 확인**
   - PRO 결제 완료
   - PaymentSuccessPage에서 refreshUser() 호출
   - MyPage 리포트 탭에서 7일/30일 리포트 잠금 해제 확인

2. **isPro 체크**
   ```typescript
   // MyPage.tsx:1103
   const isPro = user?.isPro || false;
   ```
   - PRO 사용자: 리포트 표시
   - 일반 사용자: 잠금 화면 표시

3. **구독 정보 표시**
   - MyPage 설정 탭에 구독 정보 UI 추가 (선택사항)
   - 플랜명, 남은 일수, 자동 갱신 상태 표시

---

## 11. 구현 체크리스트

### 백엔드 구현

- [ ] **Enum 생성**
  - [ ] SubscriptionPlan.java
  - [ ] SubscriptionStatus.java
  - [ ] BillingCycle.java

- [ ] **Entity 생성**
  - [ ] Subscription.java
  - [ ] User.java에 subscriptions 관계 추가
  - [ ] User.java에 isPro(), getActiveSubscription() 메서드 추가

- [ ] **Repository 생성**
  - [ ] SubscriptionRepository.java

- [ ] **Service 생성**
  - [ ] SubscriptionService.java
  - [ ] PaymentService.java 수정 (createSubscription 호출 추가)
  - [ ] AuthService.java 수정 (UserResponse에 구독 정보 포함)

- [ ] **DTO 생성/수정**
  - [ ] SubscriptionResponse.java
  - [ ] UserResponse.java 수정 (isPro, subscription 필드 추가)

- [ ] **Controller 생성**
  - [ ] SubscriptionController.java

- [ ] **마이그레이션**
  - [ ] V14__add_subscriptions.sql 작성 및 실행

- [ ] **배치 작업 (선택사항)**
  - [ ] SubscriptionScheduler.java

### 프론트엔드 구현

- [ ] **타입 정의**
  - [ ] frontend/src/types/subscription.ts 생성
  - [ ] UserResponse 인터페이스 업데이트

- [ ] **PaymentSuccessPage 수정**
  - [ ] refreshUser() 호출 추가

- [ ] **MyPage 수정**
  - [ ] isPro 체크 로직 변경 (user?.isPro 사용)

- [ ] **구독 관리 UI (선택사항)**
  - [ ] 설정 탭에 구독 정보 표시
  - [ ] 구독 취소 버튼

---

## 12. 참고 자료

### 파일 경로 정리

**백엔드**:
- Entity: `backend/src/main/java/com/daypoo/api/entity/`
- Enum: `backend/src/main/java/com/daypoo/api/entity/enums/`
- Repository: `backend/src/main/java/com/daypoo/api/repository/`
- Service: `backend/src/main/java/com/daypoo/api/service/`
- Controller: `backend/src/main/java/com/daypoo/api/controller/`
- DTO: `backend/src/main/java/com/daypoo/api/dto/`
- 마이그레이션: `backend/src/main/resources/db/migration/`

**프론트엔드**:
- Types: `frontend/src/types/`
- Pages: `frontend/src/pages/`
- Context: `frontend/src/context/`

### 주요 참고 코드

- 기존 Payment 시스템: `PaymentService.java:48-91`
- 기존 User Entity: `User.java`
- 기존 Repository 패턴: `PaymentRepository.java`
- 기존 DTO 패턴: `UserResponse.java`, `ItemResponse.java`

---

## 요약

이 문서는 PRO 멤버십 구독 시스템을 구축하기 위한 완전한 가이드입니다.

**핵심 변경 사항**:
1. Subscription 테이블 추가 (구독 상태, 시작일, 만료일 관리)
2. PaymentService에서 결제 완료 시 Subscription 생성
3. User 엔티티에 isPro() 메서드 추가
4. UserResponse에 isPro, subscription 필드 추가
5. 프론트엔드에서 refreshUser() 호출하여 결제 후 상태 갱신

**장점**:
- ✅ 구독 시작일/만료일 자동 관리
- ✅ 구독 히스토리 보관
- ✅ 자동 갱신/취소 지원
- ✅ 확장 가능한 아키텍처 (연간 플랜, 무료 체험 등)

구현 후 질문사항이나 추가 요구사항이 있으면 언제든 문의해주세요!
