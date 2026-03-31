# DayPoo QA 버그 픽스 및 기능 개선 계획서

## 📋 개요

`DayPoo 프로젝트 QA 리포트 (2026-03-31)` 내용에 기반하여 도출된 결함 수정 및 기능 개선을 진행하기 전, 최신 코드를 유지하기 위해 **업스트림(upstream) 저장소로부터 최신 변경사항을 반영**하고 이후 본격적인 작업을 수행합니다.

---

## 🔄 [PHASE 0] 업스트림 동기화 및 작업 준비 (현재 요청 사항)

1. **작업 내용 임시 저장**: 현재 `fix/avatar-assignment-bug` 브랜치에서 수정 중인 내역(`AuthService.java` 등)을 `git stash` 명령어로 안전하게 보관합니다.
2. **최신 코드 반영**: `git fetch upstream` 및 `git pull upstream main`을 실행하여 원본 저장소의 최신 반영 사항을 현재 브랜치에 가져옵니다.
3. **변경사항 복구**: `git stash pop`을 통해 보관했던 수정 내역을 다시 불러오고, 충돌 발생 시 해결합니다.

---

## 🔧 [PHASE 1] 백엔드 및 인프라 주요 개선 계획 (즉시 수정 가능)

### 1. SSE 알림 통신 장애 통합 대응 (이슈 #3, #12, #13)

가장 심각도가 높은 버그로, 알림(SSE) 엔드포인트가 HTML 응답을 반환하여 파싱 오류와 함께 알림이 노출되는 현상을 유발하고 있습니다.

- **Security 점검**: `SecurityConfig.java`를 열어 SSE(Server-Sent Events) 경로(`/api/*/notifications/subscribe` 등)가 필터에서 블락되어 인증 페이지(HTML)로 리다이렉트되는지 확인 및 허용 처리 (필요시 토큰 전달 방식 수정)
- **Controller 점검**: `NotificationController`의 반환 값이 `produces = MediaType.TEXT_EVENT_STREAM_VALUE` 로 명확히 지정되어 있는지 추가
- **프록시 인프라**: Terraform CloudFront 스크립트 등 프록시에서 SSE 버퍼링을 막는 헤더 설정 누락이 있는지 조사

### 2. 비즈니스 로직 결함 픽스 (이슈 #2, #5)

- **#5 후기 무한 등록 방지**: `ToiletReviewService.java` 내에서 새로운 리뷰를 `save()` 하기 전에 동일 `userId`와 `toiletId`의 조합이 이미 있는지 쿼리하여 방지(Validation)하는 제약 조건 추가
- **#2 방문 인증 시간 계산 개선**: 방문 시작점(`enteredAt`)을 기록하는 필드를 추가하거나, 요청 시점 기반으로 백엔드 로직을 변경하여 클릭 시간이 아닌 진입 시점으로 체류 시간을 업데이트 하도록 보완

### 3. 기능 추가 및 관리자 버그 픽스 (이슈 #6, #9, #10)

- **#6 내 문의 삭제**: `SupportController`에 사용자 본인 권한 검증 기능이 포함된 `deleteInquiry` 삭제 API 엔드포인트 신설
- **#10 이미지 URL 바인딩 확보**: 관리자 아이템 등록 API(`ShopService/AdminService`)에서 `imageUrl` 객체 바인딩이 누락되거나 DB `length` 제한에 걸리지 않는지 확인하고 픽스
- **#9 어드민 대시보드 검색 복구**: `AdminController`의 검색 조회문(`Specification` 또는 `@Query`) 바인딩 결함 확인 후 패치

### 4. 2차 QA 긴급 결함 픽스 (접근 보안 및 API 누락)

- **#P0 프리미엄 분석 리포트 강제 노출 보안 픽스**: 7일 정밀 분석 데이터(`premiumSolution`)가 무료 회원에게 그대로 노출되는 치명적 보안 결함. `ReportService`에서 7일 리포트 조회 시 사용자 Role 검증 로직을 추가하여 일반 유저라면 응답(`HealthReportResponse`)의 `premiumSolution` 필드를 null 또는 마스킹 처리하여 반환하도록 차단
- **#P1 랭킹 "우리 동네 왕" API 점검**: 해당 탭이 비어있는 이유가 지역 기반 백엔드 API 부재인지 여부를 파악. 필요시 `RankingController`/`RankingService`에 거주 지역 기반 랭킹 계산 로직 및 API 연동 추가 구현

---

## ⚙️ [PHASE 2] 시스템 전역 설정 및 관리자 기능 강화 (현재 요청 사항)

### 1. 시스템 설정 도메인 구현
- `SystemSettings` 엔티티 생성: 공지 메시지, 공지 활성화 여부, 점검 모드, 회원가입 허용 여부, AI 리포트 활성화 여부 필드 추가
- `SystemSettingsRepository` 및 초기 데이터(Initial Seed) 설정 추가
- `SystemSettingsResponse`, `SystemSettingsUpdateRequest` DTO 구현

### 2. 관리자 설정 API 구현 (`AdminController`)
- `GET /api/v1/admin/settings`: 현재 설정값 조회
- `PUT /api/v1/admin/settings`: 설정값 업데이트 로직 구현

### 3. 기능 로직 연동 및 비즈니스 제어
- **점검 모드(maintenanceMode)**: `MaintenanceModeFilter` 또는 Interceptor를 구현하여 `true`일 경우 비관리자 요청에 503 HTTP 에러 반환
- **회원가입 제한(signupEnabled)**: `AuthService.java` 내 `signUp` 및 `socialSignUp` 로직에서 해당 옵션 체크하여 가입 차단 구현

### 4. 관리자 통신 DTO 고도화 (`AdminStatsResponse`)
- `AdminStatsResponse`에 `totalRevenue`(누적 수익), `todayApiCalls`(당일 AI 호출 건수) 필드 추가
- `AdminService`에서 해당 통계 데이터를 집계하여 반환하도록 계산 로직 업데이트

---

## 🎨 [PHASE 3] 프론트엔드 개선 및 수정 계획 (수정 승인 필요 ⚠️)

_현재 로컬 룰(FRONTEND DIRECTORY RESTRICTION)에 의해 프론트엔드 폴더 직접 수정이 제한되어 있습니다. 아래 작업은 **사용자님이 수정을 명시적으로 허가해 주실 경우** 진행합니다._

- **#1 모바일 지도 드래그**: CSS `touch-action` 이슈 확인 및 이벤트 핸들링 수정
- **#4 검색 결과 UI**: 검색 시 지도 마커만 뜨는 현상을 해결하기 위한 Modal/Sidebar 컴포넌트 추가
- **#7, #8, #11**: 라우팅(딥링크) 연결 복구, 상태 관리 오류(토큰 인증 만료 흐름 등) 로직 점검 및 알림 Toast(`HTML` 렌더링 XSS 방지 처리) 개선
- **2차 QA 신규 이슈 (P2~P5)**:
  - **마이페이지 설정 탭 (P2)**: 렌더링 누락 문제 원인 파악 및 프로필 폼 복구
  - **Footer 소셜 링크 (P3)**: `href="#"`로 되어있는 3개 아이콘에 실제 URL 바인딩 처리
  - **`/admin` 비인가 접근 리다이렉트 (P4)**: 게이트웨이 화면 로딩(3초) 없이 즉각적인 메인 리다이렉션으로 성능 향상
  - **접근성(a11y) (P5)**: 알림 버튼 빨간 점 배지 등에 대한 명확한 `aria-label` 부여

---

**우선 당장 직접 수정 권한이 있는 [PHASE 1]의 백엔드 알림(SSE) 및 리뷰 무한 등록 문제부터 차례로 코드 수정을 진행해볼까요?**
(프론트엔드 관련 이슈도 지금 함께 수정하길 원하신다면 알려주세요!)

[✅ 규칙을 잘 수행했습니다.]
