# 🛠 DayPoo 프로젝트 개선 계획서

> **작성일**: 2026-03-20  
> **작성자**: Antigravity  
> **목적**: 프로젝트 전체 분석을 기반으로 미구현 기능 및 개선 사항을 정리하고 실행 계획을 수립

---

## 📊 현황 요약

| 우선순위 | 백엔드 | 프론트엔드 | 합계 |
|---------|--------|-----------|------|
| P0 (즉시) | 1건 | 2건 | **3건** |
| P1 (단기 1~2일) | 4건 | 2건 | **6건** |
| P2 (중기 3~5일) | 2건 | 2건 | **4건** |
| P3 (장기 1~2주) | 2건 | 2건 | **4건** |
| **합계** | **9건** | **8건** | **17건** |

---

## 🟥 P0 — 즉시 수정 (앱 작동에 필수)

### BE-01. DataInitializer email 필드 추가
- **문제**: `User` 엔티티의 `email` 필드가 `nullable=false`로 설정되어 있으나, `DataInitializer`에서 더미 유저 생성 시 `email`을 주입하지 않아 서버 시작 시 에러 발생 가능
- **대상 파일**: `backend/src/main/java/com/daypoo/api/global/config/DataInitializer.java`
- **작업 내용**:
  - [ ] `admin` 유저에 `.email("admin@daypoo.com")` 추가
  - [ ] `user1` 유저에 `.email("user1@daypoo.com")` 추가
  - [ ] `user2` 유저에 `.email("user2@daypoo.com")` 추가
- **담당**: 백엔드
- **예상 소요**: 10분

---

### FE-01. 소셜 로그인 닉네임 설정 페이지 구현
- **문제**: 백엔드 `OAuth2SuccessHandler`에서 소셜 로그인 신규 사용자를 `/signup/social?registration_token=...`으로 리다이렉트하지만, 프론트엔드에 해당 페이지와 라우트가 존재하지 않음
- **대상 파일**:
  - 신규: `frontend/src/pages/SocialSignupPage.tsx`
  - 수정: `frontend/src/App.tsx` (라우트 추가)
- **작업 내용**:
  - [ ] `SocialSignupPage.tsx` 컴포넌트 생성
  - [ ] URL에서 `registration_token` 쿼리 파라미터 추출
  - [ ] 닉네임 입력 폼 UI 구현 (DayPoo 디자인 시스템 적용)
  - [ ] `GET /api/v1/auth/check-nickname` 호출하여 중복 확인 연동
  - [ ] `POST /api/v1/auth/social/signup` 호출하여 가입 완료 처리
  - [ ] 성공 시 `accessToken` 저장 후 메인 페이지(`/main`)로 이동
  - [ ] `App.tsx`에 `/signup/social` 라우트 등록
- **담당**: 프론트엔드
- **예상 소요**: 2~3시간

---

### FE-02. ForgotPage API 연동 방식 수정
- **문제**: 백엔드 API가 `@RequestParam`으로 파라미터를 받지만, 프론트엔드에서 JSON body로 전송하면 404/400 에러 발생 가능
- **대상 파일**: `frontend/src/pages/ForgotPage.tsx`
- **작업 내용**:
  - [ ] **비밀번호 재설정**: `POST /api/v1/auth/password/reset?email=xxx` (Query Parameter 방식으로 호출)
  - [ ] **아이디 찾기**: `GET /api/v1/auth/find-id?nickname=xxx` (Query Parameter 방식으로 호출)
  - [ ] 응답 데이터를 UI에 반영 (마스킹된 이메일 표시 등)
  - [ ] 에러 핸들링 (유저 없음, 서버 오류 등)
- **담당**: 프론트엔드
- **예상 소요**: 1시간

---

## 🟧 P1 — 단기 (1~2일 내)

### BE-02. Admin API 보안 강화
- **문제**: `SecurityConfig`에서 `/api/v1/admin/**`이 `.permitAll()`로 설정되어 누구나 관리자 API에 접근 가능
- **대상 파일**: `backend/src/main/java/com/daypoo/api/security/SecurityConfig.java`
- **작업 내용**:
  - [ ] `.requestMatchers("/api/v1/admin/**").permitAll()` → `.hasRole("ADMIN")`으로 변경
  - [ ] 프론트엔드 AdminPage 접근 시 권한 검증 로직 추가 필요 (프론트엔드에 전달)
- **담당**: 백엔드
- **예상 소요**: 30분

---

### BE-03. 배변 기록 조회 API 추가
- **문제**: `PooRecordController`에 기록 생성(POST)만 존재하고, 조회(GET) API가 없어 마이페이지에서 과거 기록 확인 불가
- **대상 파일**:
  - `backend/src/main/java/com/daypoo/api/controller/PooRecordController.java`
  - `backend/src/main/java/com/daypoo/api/service/PooRecordService.java`
  - `backend/src/main/java/com/daypoo/api/repository/PooRecordRepository.java`
- **작업 내용**:
  - [ ] `GET /api/v1/records` → 본인의 전체 기록 목록 조회 (페이징: `Pageable` 적용)
  - [ ] `GET /api/v1/records/{id}` → 개별 기록 상세 조회
  - [ ] `PooRecordRepository`에 `findByUserOrderByCreatedAtDesc` 쿼리 메서드 추가
  - [ ] 응답 DTO에 `regionName`, `createdAt` 등 필수 필드 포함 확인
- **담당**: 백엔드
- **예상 소요**: 1~2시간

---

### BE-04. 프로필 수정 API 구현
- **문제**: 현재 `GET /api/v1/auth/me`로 조회만 가능하고, 닉네임/비밀번호 변경 등의 수정 API가 없음
- **대상 파일**:
  - `backend/src/main/java/com/daypoo/api/controller/AuthController.java`
  - `backend/src/main/java/com/daypoo/api/service/AuthService.java`
  - 신규: `backend/src/main/java/com/daypoo/api/dto/ProfileUpdateRequest.java`
  - 신규: `backend/src/main/java/com/daypoo/api/dto/PasswordChangeRequest.java`
- **작업 내용**:
  - [ ] `PATCH /api/v1/auth/me` → 닉네임 변경 (중복 검사 포함)
  - [ ] `PATCH /api/v1/auth/password` → 비밀번호 변경 (현재 비밀번호 확인 → 새 비밀번호 설정)
  - [ ] 요청 DTO 생성 (`ProfileUpdateRequest`, `PasswordChangeRequest`)
  - [ ] `User` 엔티티에 `updateNickname(String nickname)` 메서드 추가
- **담당**: 백엔드
- **예상 소요**: 1~2시간

---

### BE-05. JWT Refresh Token 갱신 API 구현
- **문제**: `accessToken`과 `refreshToken`을 발급하지만, refreshToken으로 accessToken을 재발급하는 API가 없어 토큰 만료 시 재로그인 필요
- **대상 파일**:
  - `backend/src/main/java/com/daypoo/api/controller/AuthController.java`
  - `backend/src/main/java/com/daypoo/api/service/AuthService.java`
  - `backend/src/main/java/com/daypoo/api/security/JwtProvider.java`
- **작업 내용**:
  - [ ] `POST /api/v1/auth/refresh` → refreshToken으로 새 accessToken 발급
  - [ ] `JwtProvider`에 refreshToken 파싱 및 유효성 검증 메서드 추가
  - [ ] 만료된/무효한 refreshToken에 대한 적절한 에러 응답 처리
- **담당**: 백엔드
- **예상 소요**: 1~2시간

---

### FE-03. apiClient 확장 (PUT/PATCH/DELETE)
- **문제**: `apiClient.ts`에 `get`, `post`만 구현되어 있어 프로필 수정, 알림 읽음 처리 등 불가
- **대상 파일**: `frontend/src/services/apiClient.ts`
- **작업 내용**:
  - [ ] `put` 메서드 추가
  - [ ] `patch` 메서드 추가
  - [ ] `delete` 메서드 추가
  - [ ] (선택) 401 에러 시 자동 토큰 갱신 인터셉터 추가
- **담당**: 프론트엔드
- **예상 소요**: 1시간

---

### FE-04. 마이페이지 배변 기록 데이터 연동
- **문제**: 마이페이지에서 실제 배변 기록 데이터를 백엔드로부터 가져오는 API 연동이 안 되어 있음
- **대상 파일**: `frontend/src/pages/MyPage.tsx`
- **작업 내용**:
  - [ ] `GET /api/v1/records` API 호출하여 배변 기록 목록 렌더링
  - [ ] 무한 스크롤 또는 페이지네이션 적용
  - [ ] 빈 기록일 때 안내 UI 표시
- **담당**: 프론트엔드
- **예상 소요**: 1~2시간

---

## 🟨 P2 — 중기 (3~5일 내)

### BE-06. 업적 시스템 완성
- **문제**: `TitleAchievementService`에서 `UNIQUE_TOILETS` 업적 로직이 `return false`로 비어 있고, 칭호 획득 시 알림 발송이 TODO 상태
- **대상 파일**:
  - `backend/src/main/java/com/daypoo/api/service/TitleAchievementService.java`
  - `backend/src/main/java/com/daypoo/api/repository/PooRecordRepository.java`
- **작업 내용**:
  - [ ] `UNIQUE_TOILETS` 타입: `PooRecordRepository`에 유저별 고유 화장실 수 조회 쿼리 추가
  - [ ] `checkAchievement` 메서드에 실제 로직 구현
  - [ ] `grantTitle` 메서드에서 `NotificationService.notify()` 호출하여 인앱 알림 발송
- **담당**: 백엔드
- **예상 소요**: 2~3시간

---

### BE-07. 로그아웃 및 회원 탈퇴 API
- **문제**: 로그아웃 시 토큰 무효화 처리가 없고, 회원 탈퇴 기능이 없음
- **대상 파일**:
  - `backend/src/main/java/com/daypoo/api/controller/AuthController.java`
  - `backend/src/main/java/com/daypoo/api/service/AuthService.java`
- **작업 내용**:
  - [ ] `POST /api/v1/auth/logout` → Redis 블랙리스트에 토큰 등록 또는 쿠키 삭제
  - [ ] `DELETE /api/v1/auth/me` → 사용자 데이터 삭제 (연관 데이터 cascade 처리 포함)
  - [ ] 탈퇴 전 비밀번호 재확인 로직 추가
- **담당**: 백엔드
- **예상 소요**: 2~3시간

---

### FE-05. 마이페이지 프로필 수정 연동
- **문제**: 마이페이지에서 닉네임 변경, 비밀번호 변경 UI가 API와 연동되지 않음
- **대상 파일**: `frontend/src/pages/MyPage.tsx`
- **작업 내용**:
  - [ ] 닉네임 변경 폼 → `PATCH /api/v1/auth/me` 호출
  - [ ] 비밀번호 변경 폼 → `PATCH /api/v1/auth/password` 호출
  - [ ] 성공/실패 토스트 메시지 표시
  - [ ] 로그아웃 버튼 → `POST /api/v1/auth/logout` 호출 후 로그인 페이지 이동
- **담당**: 프론트엔드
- **예상 소요**: 2~3시간

---

### FE-06. 알림 시스템 UI 구현
- **문제**: 백엔드에 SSE 기반 실시간 알림 API가 구현되어 있으나 프론트엔드에서 활용하지 않음
- **대상 파일**:
  - 신규: `frontend/src/components/NotificationPanel.tsx`
  - 수정: `frontend/src/components/Navbar.tsx`
- **작업 내용**:
  - [ ] SSE 구독 (`GET /api/v1/notifications/subscribe`) 연결
  - [ ] 네비바에 안 읽은 알림 개수 배지 표시
  - [ ] 알림 목록 드롭다운/패널 UI 구현
  - [ ] 알림 클릭 시 읽음 처리 (`PATCH /api/v1/notifications/{id}/read`)
- **담당**: 프론트엔드
- **예상 소요**: 3~4시간

---

## 🟩 P3 — 장기 (1~2주 내)

### BE-08. CustomOAuth2UserService 코드 정리
- **문제**: 불필요한 import와 미사용 필드가 존재하여 린트 경고 발생
- **대상 파일**: `backend/src/main/java/com/daypoo/api/service/CustomOAuth2UserService.java`
- **작업 내용**:
  - [ ] 미사용 import 제거 (`User`, `UUID`)
  - [ ] 미사용 필드 제거 (`userRepository`, `passwordEncoder`)
  - [ ] 미사용 로컬 변수 `nickname` 제거/활용
- **담당**: 백엔드
- **예상 소요**: 15분

---

### BE-09. 에러 핸들링 통일
- **문제**: 일부 서비스에서 `IllegalArgumentException`을, 일부에서 `BusinessException`을 사용하여 에러 응답 형식이 불일치
- **대상 파일**:
  - `ShopController.java`의 `getUserByUsername`
  - `NotificationController.java`의 `getUserByUsername`
  - `HealthReportController.java`의 `getUserByUsername`
  - `ReportController.java`의 `getUserByUsername`
  - `RankingController.java`
- **작업 내용**:
  - [ ] 모든 `getUserByUsername`에서 `BusinessException(ErrorCode.USER_NOT_FOUND)` 로 통일
  - [ ] `ErrorCode`에 누락된 코드 추가 (필요 시)
  - [ ] `GlobalExceptionHandler`에서 모든 예외 타입을 일관된 JSON 형식으로 응답
- **담당**: 백엔드
- **예상 소요**: 1~2시간

---

### FE-07. 전역 상태 관리 도입
- **문제**: `localStorage`에서 직접 토큰을 읽어 로그인 상태를 판별하여, 컴포넌트 간 인증 상태 공유가 불안정
- **대상 파일**:
  - 신규: `frontend/src/context/AuthContext.tsx` 또는 `frontend/src/stores/authStore.ts`
  - 수정: 인증 관련 컴포넌트 전체
- **작업 내용**:
  - [ ] `AuthContext` 또는 `zustand` store 생성
  - [ ] 로그인/로그아웃 시 전역 상태 업데이트
  - [ ] 토큰 만료 시 자동 갱신 로직 통합
  - [ ] `Navbar`, `MyPage`, `MapPage` 등에서 전역 상태 참조로 전환
- **담당**: 프론트엔드
- **예상 소요**: 3~4시간

---

### FE-08. 에러 바운더리 및 로딩 상태 통일
- **문제**: 각 페이지마다 별도의 에러/로딩 처리 방식을 사용하여 UX 불일치
- **대상 파일**:
  - 신규: `frontend/src/components/ErrorBoundary.tsx`
  - 신규: `frontend/src/components/LoadingSkeleton.tsx`
- **작업 내용**:
  - [ ] React Error Boundary 컴포넌트 구현
  - [ ] 공통 스켈레톤 UI 컴포넌트 생성
  - [ ] 각 페이지에 일관된 로딩/에러 상태 적용
- **담당**: 프론트엔드
- **예상 소요**: 2~3시간

---

## 🗓 추천 실행 순서

```
Day 1 (오늘)
├── BE-01. DataInitializer email 필드 추가 (10분)
└── BE-02. Admin API 보안 강화 (30분)

Day 2
├── BE-03. 배변 기록 조회 API 추가 (1~2시간)
├── BE-04. 프로필 수정 API 구현 (1~2시간)
└── BE-05. JWT Refresh Token 갱신 API (1~2시간)

Day 3~4
├── FE-01. 소셜 로그인 닉네임 설정 페이지 (2~3시간)
├── FE-02. ForgotPage API 연동 수정 (1시간)
├── FE-03. apiClient 확장 (1시간)
└── FE-04. 마이페이지 배변 기록 연동 (1~2시간)

Day 5~7
├── BE-06. 업적 시스템 완성 (2~3시간)
├── BE-07. 로그아웃/회원 탈퇴 API (2~3시간)
├── FE-05. 마이페이지 프로필 수정 연동 (2~3시간)
└── FE-06. 알림 시스템 UI 구현 (3~4시간)

Day 8~14
├── BE-08. CustomOAuth2UserService 정리 (15분)
├── BE-09. 에러 핸들링 통일 (1~2시간)
├── FE-07. 전역 상태 관리 도입 (3~4시간)
└── FE-08. 에러 바운더리 및 로딩 통일 (2~3시간)
```
