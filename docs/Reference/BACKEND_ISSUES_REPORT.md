# 🔧 DayPoo 백엔드 API 이슈 리포트 및 해결 방안

## 📋 개요
프론트엔드 정리 작업 중 백엔드 API와의 불일치 및 누락된 엔드포인트들을 발견했습니다. 아래는 발견된 이슈와 구체적인 해결 방안입니다.

---

## ❗ 이슈 1: 알림 일괄 읽음 처리 API 부재

### 문제
- 프론트엔드가 `POST /api/v1/notifications/mark-all-read`를 호출하지만 백엔드에 해당 엔드포인트가 없음
- 현재는 `PATCH /api/v1/notifications/{notificationId}/read`만 존재 (개별 읽음 처리만 가능)

### 해결 방법

**NotificationController.java에 추가:**
```java
/** 모든 알림 일괄 읽음 처리 */
@PostMapping("/mark-all-read")
@Operation(summary = "모든 알림 일괄 읽음 처리", description = "사용자의 모든 미읽음 알림을 읽음 상태로 변경합니다.")
public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal String email) {
    User user = getUserByEmail(email);
    notificationService.markAllAsRead(user);
    return ResponseEntity.ok().build();
}
```

**NotificationService.java에 추가:**
```java
/** 모든 알림 일괄 읽음 처리 */
@Transactional
public void markAllAsRead(User user) {
    List<Notification> notifications = notificationRepository.findAllByUserAndIsReadFalse(user);
    notifications.forEach(Notification::markAsRead);
}
```

**NotificationRepository.java에 추가:**
```java
List<Notification> findAllByUserAndIsReadFalse(User user);
```

---

## ❗ 이슈 2: 알림 삭제 API 부재

### 문제
- 프론트엔드가 `DELETE /api/v1/notifications/{id}`를 호출하지만 백엔드에 해당 엔드포인트가 없음

### 해결 방법

**NotificationController.java에 추가:**
```java
/** 알림 삭제 */
@DeleteMapping("/{notificationId}")
@Operation(summary = "알림 삭제", description = "특정 알림을 삭제합니다.")
public ResponseEntity<Void> deleteNotification(
    @PathVariable Long notificationId,
    @AuthenticationPrincipal String email) {
    User user = getUserByEmail(email);
    notificationService.deleteNotification(notificationId, user);
    return ResponseEntity.ok().build();
}
```

**NotificationService.java에 추가:**
```java
/** 알림 삭제 (본인 확인) */
@Transactional
public void deleteNotification(Long notificationId, User user) {
    Notification notification = notificationRepository
        .findById(notificationId)
        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 알림입니다."));

    // 본인의 알림인지 확인
    if (!notification.getUser().getId().equals(user.getId())) {
        throw new IllegalArgumentException("본인의 알림만 삭제할 수 있습니다.");
    }

    notificationRepository.delete(notification);
}
```

---

## ⚠️ 이슈 3: SSE 인증 방식 불일치 (확인 필요)

### 문제
- **프론트엔드**: `EventSource`는 커스텀 헤더를 지원하지 않아 `?token=xxx` 쿼리 파라미터로 JWT 전송
- **백엔드**: `JwtAuthenticationFilter`가 `Authorization` 헤더에서만 토큰 추출 (쿼리 파라미터 미지원)
- 현재 `/api/v1/notifications/subscribe` SSE 연결이 인증 실패할 가능성 있음

### 현재 코드 (JwtAuthenticationFilter.java):
```java
private String resolveToken(HttpServletRequest request) {
    String bearerToken = request.getHeader("Authorization");
    if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
        return bearerToken.substring(7);
    }
    return null;  // ← 쿼리 파라미터는 체크하지 않음
}
```

### 해결 방법 (Option 1 - 권장)

**JwtAuthenticationFilter.java 수정:**
```java
private String resolveToken(HttpServletRequest request) {
    // 1. Authorization 헤더에서 토큰 추출 (기존 방식)
    String bearerToken = request.getHeader("Authorization");
    if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
        return bearerToken.substring(7);
    }

    // 2. 쿼리 파라미터에서 토큰 추출 (SSE용)
    String tokenParam = request.getParameter("token");
    if (StringUtils.hasText(tokenParam)) {
        return tokenParam;
    }

    return null;
}
```

### 해결 방법 (Option 2 - SSE 엔드포인트만 허용)

SSE 엔드포인트에만 쿼리 파라미터 인증을 허용하려면:

```java
private String resolveToken(HttpServletRequest request) {
    // 1. Authorization 헤더 우선
    String bearerToken = request.getHeader("Authorization");
    if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
        return bearerToken.substring(7);
    }

    // 2. SSE 엔드포인트만 쿼리 파라미터 허용
    String requestURI = request.getRequestURI();
    if (requestURI != null && requestURI.contains("/notifications/subscribe")) {
        String tokenParam = request.getParameter("token");
        if (StringUtils.hasText(tokenParam)) {
            return tokenParam;
        }
    }

    return null;
}
```

**테스트 방법:**
1. 프론트엔드에서 SSE 연결 시도
2. 브라우저 Network 탭에서 `/notifications/subscribe?token=xxx` 요청 확인
3. 401 Unauthorized 없이 연결 성공하는지 확인

---

## 📌 이슈 4: 리뷰 시스템 API 전체 부재

### 문제
- 프론트엔드에 화장실 리뷰 UI (별점, 이모지 태그, 댓글) 구현되어 있음
- 백엔드에 리뷰 관련 Entity, Repository, Service, Controller 전혀 없음
- 현재 프론트엔드는 MOCK 데이터로 대체 → "준비 중" 표시로 변경됨

### 필요 작업
리뷰 기능이 필요하다면 다음 사항들을 새로 구현해야 합니다:

1. **Review Entity** (화장실별 리뷰)
   - toiletId, userId, rating (1-5), comment, emojiTags, bristolType 등

2. **API 엔드포인트**
   - `POST /api/v1/toilets/{toiletId}/reviews` - 리뷰 작성
   - `GET /api/v1/toilets/{toiletId}/reviews` - 리뷰 목록 조회
   - `DELETE /api/v1/reviews/{reviewId}` - 리뷰 삭제

3. **프론트엔드 연동**
   - `ToiletPopup.tsx`에서 실제 API 호출하도록 수정

**우선순위**: 현재 프론트엔드에서는 "준비 중" 표시로 처리되어 있으므로, 급하지 않음. 추후 구현 시 협의 필요.

---

## ✅ 적용 우선순위

1. **🔴 High**: 이슈 3 (SSE 인증) - 현재 실시간 알림이 작동하지 않을 가능성
2. **🟡 Medium**: 이슈 1, 2 (알림 API) - 프론트엔드 기능 완성도 개선
3. **🟢 Low**: 이슈 4 (리뷰 시스템) - 현재 사용 안 함

---

## 🔍 테스트 체크리스트

수정 후 다음 항목들을 테스트해주세요:

- [ ] SSE 연결 (`/api/v1/notifications/subscribe?token=xxx`) 성공
- [ ] 실시간 알림 수신 확인
- [ ] `POST /api/v1/notifications/mark-all-read` 호출 성공
- [ ] `DELETE /api/v1/notifications/{id}` 호출 성공
- [ ] Swagger UI에서 새 엔드포인트 문서화 확인

---

## 📎 관련 파일 위치

### 수정이 필요한 파일들:
- `backend/src/main/java/com/daypoo/api/controller/NotificationController.java`
- `backend/src/main/java/com/daypoo/api/service/NotificationService.java`
- `backend/src/main/java/com/daypoo/api/repository/NotificationRepository.java`
- `backend/src/main/java/com/daypoo/api/security/JwtAuthenticationFilter.java`

### 참고 파일들:
- `backend/src/main/java/com/daypoo/api/entity/Notification.java`
- `backend/src/main/java/com/daypoo/api/security/SecurityConfig.java`

---

**작성자**: 프론트엔드 팀
**작성일**: 2026-03-24
**관련 커밋**: 프론트엔드 API 호출 수정 완료
