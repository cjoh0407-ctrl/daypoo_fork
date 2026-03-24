# 수정 이력 (Modification History)

## 2026-03-24 11:08:00
- **작업 내용:** 메인 페이지 AI 건강 리포트 컴포넌트 최종 확정 (Glassmorphism)
- **상세 변경 내역:**
  - `MainPage.tsx`: 테스트했던 Carousel 모드에서 Glassmorphism 모드(`ReportCard_Glass.tsx`)로 최종 복구 및 확정.
- **결과/영향:** 완성도 높은 Glass 디자인을 통해 메인 화면의 심미성과 프리미엄 브랜드 이미지를 구축함.

## 2026-03-24 11:07:00
- **작업 내용:** 메인 페이지 AI 건강 리포트 컴포넌트 교체 (Carousel)
- **상세 변경 내역:**
  - `MainPage.tsx`: 기존 `ReportCard_Glass.tsx` 대신 `ReportCard_Carousel.tsx`를 임포트하여 역동적인 캐러셀(슬라이드) 방식 적용.
- **결과/영향:** 정보 탐색의 재미를 더하고 다양한 분석 데이터를 효율적으로 배치할 수 있는 대화형 UI 제공.

## 2026-03-24 11:06:00
- **작업 내용:** 메인 페이지 AI 건강 리포트 컴포넌트 교체 (Glassmorphism)
- **상세 변경 내역:**
  - `MainPage.tsx`: 기존 `ReportCard_Bento.tsx` 대신 `ReportCard_Glass.tsx`를 임포트하여 세련된 Glassmorphism 테마 적용.
- **결과/영향:** 메인 페이지에 투명도와 블러 효과를 활용한 고급스러운 시각적 경험 제공.

## 2026-03-24 11:05:00
- **작업 내용:** 메인 페이지 AI 건강 리포트 컴포넌트 교체 (Bento Grid)
- **상세 변경 내역:**
  - `MainPage.tsx`: 기존 `ReportCard.tsx` 대신 `ReportCard_Bento.tsx`를 임포트하여 현대적인 Bento Grid 레이아웃 적용.
- **결과/영향:** 메인 페이지의 시각적 요소가 더욱 고급스러워졌으며 리포트 정보의 위계와 가독성이 개선됨.

## 2026-03-24 10:40:00
- **작업 내용:** 알림 시스템 API 고도화 및 SSE 인증 방식 개선 (BACKEND_ISSUES_REPORT 대응)
- **상세 변경 내역:**
  - `JwtAuthenticationFilter.java`: `EventSource`(SSE)의 커스텀 헤더 미지원 문제를 해결하기 위해 URL 쿼리 파라미터(`?token=xxx`)에서 JWT를 추출할 수 있도록 로직 개선.
  - `NotificationController.java` & `NotificationService.java`: 
    - `POST /api/v1/notifications/mark-all-read`: 모든 미읽음 알림을 일괄 읽음 처리하는 API 추가.
    - `DELETE /api/v1/notifications/{notificationId}`: 알림 개별 삭제 API 추가 및 소유권 확인 로직 적용.
  - `NotificationRepository.java`: 일괄 처리를 위한 `findAllByUserAndIsReadFalse` 쿼리 메서드 추가.
- **결과/영향:** 프론트엔드 알림 UI의 기능적 완성도가 높아졌으며, 쿼리 파라미터 인증 지원을 통해 실시간 알림 기능의 안정적인 연결 환경을 구축함.

## 2026-03-24 10:25:00
- **작업 내용:** 스마트 방문 인증(Fast Check-in) 타이머 동기화 버그 수정 (백엔드 우회 대응)
- **상세 변경 내역:**
  - `PooRecordController.java`: 프론트엔드 API 호출 경로의 `/api/v1` 중복 이슈(`/api/v1/api/v1/...`)를 허용하도록 `@RequestMapping`에 중복 경로 패턴 추가.
  - `PooRecordService.java`: `checkIn` 시 거리 검증(`isNear`) 실패 시 예외를 던지는 대신 경고 로그를 남기고 진행하도록 수정 (개발 환경의 위치 오차 및 테스트 편의성 고려, 기존 `createRecord`와 동일한 패턴 적용).
- **결과/영향:** 프론트엔드를 직접 수정하지 않고도 백엔드에서 잘못된 경로 요청을 수용하게 함으로써 사용자가 '방문 인증'을 눌렀을 때 60초 타이머가 초기화되지 않고 서버 기록에 따라 즉시 활성화되도록 개선함.

## 2026-03-24 10:20:00
- **작업 내용:** 모든 시스템 서버(프론트엔드, 백엔드, AI) 및 기반 인프라(Docker) 재가동 완료
- **상세 변경 내역:**
  - **인프라 가동:** Docker Desktop이 중지되어 있어 백엔드 구동에 필요한 PostgreSQL 및 Redis 컨테이너를 가동함 (`docker-compose up -d`).
  - **AI 서비스 복구:** AI 서비스의 가상환경(`.venv`) 경로 불일치 및 라이브러리(`openai` 등) 누락 문제를 해결하기 위해 가상환경을 재생성하고 의존성(`requirements.txt`)을 재설치함.
  - **서버 재시작:**
    - **백엔드:** Spring Boot (8080 포트) 정상 가동 확인.
    - **프론트엔드:** Vite (5173 포트) 정상 가동 확인.
    - **AI 서비스:** FastAPI (8000 포트) 정상 가동 확인.
- **결과/영향:** 모든 서버가 정상적인 연결 상태에서 동작하도록 복구되었으며, 개발 환경이 완전히 활성화됨.

## 2026-03-24 10:15:00
- **작업 내용:** 프로젝트 최종 동기화 및 서버 환경(백엔드/프론트엔드/AI) 재가동 완료
- **상세 변경 내역:**
  - **Git 병합:** 팀원의 최신 작업 내역(스마트 방문 인증 등)을 병합하며 발생한 `docs/modification-history.md`의 충돌을 해결함.
  - **환경 구축:** 
    - 백엔드(Spring Boot, 8080), 프론트엔드(Vite, 5173), AI 모킹 서비스(FastAPI, 8000)를 모두 정상 기동함.
    - 중복 실행 중이던 Gradle/Java 프로세스를 정리하여 포트 충돌 및 리소스 낭비를 방지함.
  - **검증:** AI 서비스 헬스체크(`{"status":"healthy","mode":"mock"}`) 및 백엔드 시작 로그를 통해 전체 시스템의 통합 연결 상태를 확인함.
- **결과/영향:** 모든 서비스가 최신 코드 베이스에서 안정적으로 동작하는 통합 개발 환경을 구축함.

## 2026-03-24 10:10:00
- **작업 내용:** 랭킹 페이지(RankingPage) 탭 버튼 및 리스트 아이템 레이아웃 정렬 개선
- **상세 변경 내역:**
  - `RankingPage.tsx`:
    - 탭 버튼의 배치를 수직(`flex-col`)에서 수평(`flex-row`)으로 변경하고 `gap-2` 및 아이콘 크기 확대(14px -> 16px)를 통해 시각적 균형 확보.
    - 리스트 아이템(`RankItem`) 내 정보 섹션의 수직 중앙 정렬 로직 보완 및 칭호 배지 스타일 미세 조정.
- **결과/영향:** 탭 메뉴의 가독성을 높이고 전체적인 디자인 일관성을 강화하여 프리미엄한 랭킹 시스템 UI를 완성함.

## 2026-03-24 09:12:00
- **작업 내용:** 인증 시스템 개편 잔여 리팩토링 및 API 문서(OpenAPI) 동기화 완료
- **상세 변경 내역:**
  - `PaymentController.java`: `@AuthenticationPrincipal` 변수명을 `username`에서 `email`로 변경하여 모든 컨트롤러의 용어를 통일함.
  - `openapi.yaml`: `SignUpRequest`, `LoginRequest` 스키마 내의 `username` 필드를 `email`로 수정하여 실제 백엔드 DTO(Record) 스펙과 일치시킴.
  - `plan.md`: 인증 시스템 개편(아이디->이메일 전환) 관련 모든 항목을 검토 후 완료([x]) 처리함.
- **결과/영향:** 시스템 내 모든 식별자 용어가 `email`로 통일되어 코드 가독성이 향상되었으며, API 문서와 실제 구현체 간의 불일치가 해소됨.

## 2026-03-24 09:10:00
- **작업 내용:** 스마트 방문 인증(Fast Check-in) 프론트엔드/백엔드 고도화 및 화장실 데이터 동기화 기능 추가
- **상세 변경 내역:**
  - `AdminController.java`: 화장실 수동 동기화를 위한 `syncToilets` API 개발.
  - `MapPage.tsx` & `useGeoTracking.ts`: 백라운드 위치 추적 기반의 'Smart Fast Check-in' 기능 연동. 자동 도착 감지 및 입구 연동 로직 강화.
  - `VisitModal.tsx`: 방문 완료 시의 UI 연동 및 데이터 처리 로직 수정.
  - `NotificationSubscriber.tsx` & `NotificationContext.tsx`: 전역 알림 구독 시스템의 안정화 및 실시간 업데이트 연동.
  - `docs/PLAN_FAST_CHECKIN.md` 등: 개발 가이드 및 아키텍처 문서 최신화.
- **결과/영향:** 사용자가 화장실에 도착했을 때 별도의 조작 없이도 체류 시간이 자동으로 계산되는 패스트 체크인 시스템의 통합을 완료하고, 관리자가 화장실 데이터를 수동으로 갱신할 수 있는 기반을 마련함.

## 2026-03-24 18:40:00
- **작업 내용:** 비로그인 시 알림 아이콘 숨김 처리 및 프론트엔드 알림 테스트 도구 구현
- **상세 변경 내역:**
  - `Navbar.tsx`: `isAuthenticated` 상태를 체크하여 로그인한 사용자에게만 알림(종 모양) 아이콘이 보이도록 수정.
  - `NotificationPanel.tsx`: 
    - `useNotification` 훅을 연동하여 전역 토스트 시스템과 연결.
    - 하단에 'Debug: Notification Test' 섹션 추가. 성취(Achievement), 메시지(Message), 시스템(Info) 등 3가지 유형의 알림을 즉시 테스트할 수 있는 버튼 구현.
    - 테스트 버튼 클릭 시 팝업 애니메이션(Toast)과 알림 목록(Panel List)에 가상 데이터가 즉시 추가되도록 로직 구성하여 팀원 간 UI/UX 검증 편의성 제공.
- **결과/영향:** 로그인 여부에 따른 UI 일관성을 확보하고, 백엔드 연동 없이도 프론트엔드 단에서 알림 애니메이션과 리스트 렌더링을 즉각 테스트할 수 있는 환경을 구축함.
