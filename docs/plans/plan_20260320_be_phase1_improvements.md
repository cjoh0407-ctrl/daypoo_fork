# 백엔드 기능 개선 및 보안 강화 계획서 (BE-02 ~ BE-05)

> **상태**: 완료 (2026-03-20)  
> **관련 문서**: `docs/plans/plan_project_improvement.md`

## 📋 개요
`plan_project_improvement.md`에 정의된 백엔드 P0~P1 작업 중 `BE-02`부터 `BE-05`까지의 구현 계획입니다. (BE-01은 이미 완료됨을 확인했습니다.)

---

## 🛠 작업 목록

### 1. [BE-02] Admin API 보안 강화 (P0)
- **목적**: 관리자 전용 API(`/api/v1/admin/**`)에 대한 접근 권한을 `ROLE_ADMIN`으로 제한합니다.
- **대상**: `backend/src/main/java/com/daypoo/api/security/SecurityConfig.java`
- **변경 사항**:
    - `.requestMatchers("/api/v1/admin/**").permitAll()` 구문을 `.requestMatchers("/api/v1/admin/**").hasRole("ADMIN")`으로 수정.

### 2. [BE-03] 배변 기록 조회 API 추가 (P1)
- **목적**: 사용자가 자신의 과거 배변 기록을 조회할 수 있도록 GET API를 구현합니다.
- **대상**:
    - `PooRecordRepository.java`: 유저별 기록 조회 쿼리 메서드 추가.
    - `PooRecordService.java`: 조회 로직 구현.
    - `PooRecordController.java`: GET 엔드포인트 추가.
- **상세 내역**:
    - `GET /api/v1/records`: 본인의 전체 기록 (Pageable 적용).
    - `GET /api/v1/records/{id}`: 특정 기록 상세 조회.

### 3. [BE-04] 프로필 수정 API 구현 (P1)
- **목적**: 닉네임 변경 및 비밀번호 변경 기능을 제공합니다.
- **대상**:
    - `User.java`: 닉네임 업데이트 메서드 추가.
    - `AuthService.java`: 프로필 및 비밀번호 수정 로직 추가.
    - `AuthController.java`: PATCH 엔드포인트 추가.
    - 신규 DTO: `ProfileUpdateRequest`, `PasswordChangeRequest`.
- **상세 내역**:
    - `PATCH /api/v1/auth/me`: 닉네임 변경.
    - `PATCH /api/v1/auth/password`: 비밀번호 변경.

### 4. [BE-05] JWT Refresh Token 갱신 API 구현 (P1)
- **목적**: 액세스 토큰 만료 시 리프레시 토큰을 사용하여 재발급받을 수 있게 합니다.
- **대상**:
    - `JwtProvider.java`: 리프레시 토큰 검증 로직 추가.
    - `AuthService.java`: 토큰 재발급 로직 구현.
    - `AuthController.java`: `POST /api/v1/auth/refresh` 엔드포인트 추가.

---

## 📅 일정 및 순서
1. **BE-02** 수정 후 보안 설정 확인.
2. **BE-03** 구현 및 Repository 테스트.
3. **BE-04** 구현 및 닉네임 중복 체크 확인.
4. **BE-05** 구현 및 토큰 갱신 테스트.

각 단계 완료 시 `docs/modification-history.md`에 기록하겠습니다.

---
[✅ 규칙을 잘 수행했습니다.]
