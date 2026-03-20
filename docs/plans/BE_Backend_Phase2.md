# 백엔드 기능 개선 2단계 계획서 (BE-06 ~ BE-09)

> **상태**: 완료  
> **관련 문서**: `docs/plans/plan_project_improvement.md`

## 📋 개요
`plan_project_improvement.md`에 정의된 백엔드 P2~P3 작업을 순차적으로 진행합니다.

---

## 🛠 작업 목록

### 1. [BE-06] 업적 시스템 완성
- **목적**: `UNIQUE_TOILETS` 업적 로직을 구현하고 칭호 획득 시 알림을 연동합니다.
- **대상**:
    - `PooRecordRepository.java`: 유저별 고유 화장실 방문 수 조회 메서드 추가.
    - `TitleAchievementService.java`: 업적 체크 로직 구현 및 알림 발송 로직 추가.
- **상세 내역**:
    - `UNIQUE_TOILETS` 타입 체크: `PooRecordRepository.countUniqueToiletsByUser(User user)` 활용.
    - `grantTitle` 시 `NotificationService.notify()` 호출.

### 2. [BE-07] 로그아웃 및 회원 탈퇴 API
- **목적**: 보안 강화 및 사용자 권리를 위한 기능을 추가합니다.
- **대상**:
    - `AuthService.java`: 로그아웃(토큰 무효화) 및 회원 탈퇴(데이터 삭제) 로직 구현.
    - `AuthController.java`: `POST /api/v1/logout`, `DELETE /api/v1/auth/me` 엔드포인트 추가.
- **상세 내역**:
    - 로그아웃: 클라이언트 측 토큰 삭제 유도 및 서버 측 (Redis 블랙리스트 등) 고려.
    - 회원 탈퇴: Cascade 탈퇴 처리 및 비밀번호 재확인.

### 3. [BE-08] CustomOAuth2UserService 코드 정리
- **목적**: 미사용 코드 및 경고를 해결하여 유지보수성을 높입니다.
- **대상**: `backend/src/main/java/com/daypoo/api/service/CustomOAuth2UserService.java`
- **변경 사항**:
    - 미사용 `import` (User, UUID) 및 `field` (userRepository, passwordEncoder) 제거.
    - 미사용 로컬 변수 `nickname` 정리.

### 4. [BE-09] 에러 핸들링 통일
- **목적**: 시스템 전반의 예외 처리 방식을 `BusinessException`으로 일원화합니다.
- **대상**:
    - `ShopController.java`, `NotificationController.java`, `HealthReportController.java` 등 여러 컨트롤러.
    - `GlobalExceptionHandler.java`.
- **변경 사항**:
    - `IllegalArgumentException` 등을 `BusinessException(ErrorCode.USER_NOT_FOUND)` 등으로 교체.
    - 일관된 JSON 에러 응답 형식 보장.

---

## 📅 일정 및 순서
1. **BE-06** 업적 시스템 및 알림 연동 (P2)
2. **BE-07** 로그아웃 및 회원 탈퇴 (P2)
3. **BE-08** 소셜 서비스 코드 리팩토링 (P3)
4. **BE-09** 전역 에러 핸들링 통일 (P3)

---
[✅ 규칙을 잘 수행했습니다.]
