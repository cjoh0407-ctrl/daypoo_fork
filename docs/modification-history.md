# 변경 이력 (Modification History)

## 2026-03-24 21:15:00

- **작업 내용:** 프론트엔드-백엔드 주요 기능 통합 및 실데이터 연동 (Final Integration)
- **상세 변경 내역:**
  - **계정 보안 및 관리 (`AuthContext.tsx`, `MyPage.tsx`):**
    - `logout()`: `localStorage` 정리와 함께 백엔드 `POST /auth/logout` API를 호출하도록 강화하여 서버측 토큰 블랙리스트 처리를 지원합니다.
    - `deleteMe()`: 회원 탈퇴 API(`DELETE /auth/me`) 연동 및 마이페이지 설정 탭에 탈퇴 버튼, 비밀번호 확인 모달, 최종 확인 플로우를 구축했습니다.
  - **마이페이지 실시간 데이터 연동 (`MyPage.tsx`):**
    - **히어로 통계:** 인증 횟수, 방문 횟수, 연속 일수를 하드코딩에서 실제 사용자 객체(`user`) 데이터 기반으로 전환했습니다.
    - **상점 및 컬렉션:** `AVATAR_ITEMS`, `TITLES` 목 데이터를 제거하고, `/shop/items`, `/shop/titles` API를 통해 서버의 실시간 상품 및 인벤토리 정보를 로드하도록 구현했습니다.
  - **지원 및 관리자 페이지 연동 (`SupportPage.tsx`, `AdminPage.tsx`):**
    - **FAQ:** `SupportPage`에서 `GET /support/faqs`를 통해 동적 데이터를 로드하며, 실패 시를 대비한 Safe-Fallback 매커니즘을 적용했습니다.
    - **Admin 대시보드:** 관리자 메계 통계(`GET /admin/stats`) API를 연동하여 가입 유저 수, 누적 화장실 수, 미답변 문의 건수 및 주간 트렌드 차트를 실제 수치로 렌더링합니다.
- **결과/영향:** 앱의 핵심 운영 데이터가 목 데이터에서 실제 서버 데이터로 완전히 전환되었으며, 사용자의 개인정보 관리 및 보안성이 상용 수준으로 강화되었습니다.

## 2026-03-24 15:45:00

- **작업 내용:** 백엔드 기능 보완 및 AI/관리자 연동 API 고도화 (Phase 1~3 완료)
- **상세 변경 내역:**
  - **AI 분석 전용 엔드포인트 신설 (Phase 1):** `POST /api/v1/records/analyze` 엔드포인트를 추가하여 기록 저장 없이 이미지 분석 결과만 미리보기 할 수 있도록 구현. (`PooAnalysisRequest` DTO 추가 및 `PooRecordService.analyzeImageOnly` 신설)
  - **AI 분석 데이터 유실 방지 및 확장 (Phase 2):** 
    - `AiAnalysisResponse`, `PooRecordResponse` DTO에 `warning_tags`(혈변, 탈수 경고 등) 필드 추가.
    - `PooRecord` 엔티티 및 DB 스키마에 `warning_tags` 컬럼을 추가하여 AI 분석의 핵심 건강 정보를 영구 저장 및 프론트엔드 전달 체계 구축.
    - `PooRecordMapper`를 통한 역직렬화(String -> List) 로직 연동.
  - **관리자 시스템 로그 API 구현 (Phase 3):** `GET /api/v1/admin/logs` 엔드포인트를 신설하여 관리자 대시보드에서 시스템 이벤트를 모니터링할 수 있는 기반 마련. (현재 Mock 데이터 반환 및 `SystemLogResponse` DTO 추가)
- **결과/영향:** 프론트엔드의 AI 카메라 분석 미리보기 UX를 지원하고, 유실되던 건강 경고 데이터를 사용자에게 정확히 전달하며, 관리자 도구의 가시성을 확보함.

## 2026-03-24 15:20:00

- **작업 내용:** 메인 페이지 건강 리포트 섹션 퍼포먼스 최적화
- **상세 변경 내역:**
  - **렌더링 부하 감소 (`ReportCard_Glass.tsx`):** 고사양 리소스인 `backdrop-filter: blur`의 강도를 조절(24px → 16px)하고, 중첩된 블러 레이어를 제거하여 GPU 사용량을 최적화했습니다.
  - **인사이트 카드 컴팩트화:** 사용자 요청에 따라 카드의 크기를 전체적으로 축소(min-h 190px → 130px, p-8 → p-6)하고, 전용 컨테이너 너비를 `max-w-4xl`로 제한하여 정보 밀도를 높였습니다.
  - **애니메이션 동기화 및 레이아웃 고정:** 배경 블롭(Blob) 및 애니메이션 카드에 하드웨어 가속을 실장하고, 인사이트 카드들이 개별적으로 움직여 발생하는 불일치를 해결하기 위해 애니메이션 딜레이를 통일(Stagger 제거)했습니다. 또한 `items-stretch`를 적용하여 카드의 상하 위치가 완벽하게 일치하도록 고정했습니다.
- **결과/영향:** Glassmorphism 디자인의 프리미엄 디자인은 유지하면서, 다양한 환경에서 훨씬 부드러운 사용자 경험을 제공합니다.

## 2026-03-24 15:15:00

- **작업 내용:** 원격 저장소 최신 변경 사항 반영 및 프로젝트 구조 최적화
- **상세 변경 내역:**
  - **Git Pull:** 원격 `main` 브랜치의 최신 커밋을 로컬로 가져와 동기화 완료 (24개 파일 변경).
  - **프로젝트 구조 정리:** 루트의 문서 및 스크립트 파일들을 `docs/` 하위 디렉토리(`docs/sql`, `docs/scripts`, `docs/tmp` 등)로 이동 및 정리하여 루트 디렉토리 정제.
  - **프론트엔드 타입 추가:** `frontend/src/types/admin.ts` 파일 신규 생성 및 관리자 관련 타입 정의 반영.
  - **불필요 파일 제거:** `DB_SYNC_GUIDE.md`, `gittest.txt`, `plan.md`, `ai_service_output.txt` 등 오래된 가이드 및 임시 결과 파일 삭제.
- **결과/영향:** 팀원과의 코드 베이스 동기화 및 프로젝트 디렉토리 구조의 체계적 정리를 통해 유지보수성과 가독성을 최적화함.

## 2026-03-24 15:00:00

- **작업 내용:** 관리자/랭킹/푸터 UI 및 UX 고도화
- **상세 변경 내역:**
  - **관리자 페이지 개선 (`AdminPage.tsx`):** 알림(Bell) 아이콘 제거, 로그아웃 기능 활성화, 통합 검색바 클릭 및 상태 연동, 로고 클릭 대시보드 이동, 메인 페이지 바로가기 버튼 추가.
  - **랭킹 페이지 최적화 (`RankingPage.tsx`):** '나의 순위' 카드 위치를 상단 통계 칩 하단으로 이동 및 크기/폰트 확대. 상위 3인 금/은/동 보더라인 시각 효과 차별화.
  - **푸터 링크 연동 (`Footer.tsx`):** AI 분석, FAQ, 1:1 문의 등 미정의 링크를 실제 페이지와 섹션으로 연결 및 부드러운 스크롤 핸들러 추가.
- **결과/영향:** 관리자 도구의 사용성을 높이고 순위 및 지원 섹션의 정보 접근성을 크게 개선함.

## 2026-03-24 14:57:00

- **작업 내용:** 루트 디렉토리 추가 파일 정리 (sql, scripts, tmp)
- **상세 변경 내역:**
  - **SQL 파일 정리 (docs/sql/):** `query.sql` 파일 이동.
  - **스크립트 파일 정리 (docs/scripts/):** `test_ai_features.js`, `start_backend.bat` 파일 이동.
  - **임시 디렉토리 정리 (docs/tmp/):** `tmp_bcrypt/`를 해당 위치로 이동하여 루트 정리.
- **결과/영향:** 프로젝트 루트 구성을 핵심 설정 파일 위주로 정제하여 관리 편의성 증대.

## 2026-03-24 14:55:00

- **작업 내용:** 루트 디렉토리 파일 정리 (txt, log, md)
- **상세 변경 내역:**
  - **로그 파일 정리 (docs/logs/):** `*.log`, `*.txt` 파일들을 해당 디렉토리로 이동.
  - **문서 파일 정리 (docs/):** `BACKEND_ISSUES_REPORT.md`, `DB_SYNC_GUIDE.md`, `TOILET_MARKER_DIAGNOSIS.md`, `plan.md`, `plan_project_improvement.md` 이동.
- **결과/영향:** 루트 디렉토리를 프로젝트 핵심 파일 위주로 구성하여 가독성 향상 및 구조 체계화.

## 2026-03-24 14:26:00

- **작업 내용:** Git 버전 관리 제외 설정 추가 (.claude)
- **상세 변경 내역:**
  - **.gitignore:** 에이전트 작업 디렉토리인 `.claude/`를 Git 추적 대상에서 제외하도록 추가.
- **결과/영향:** 에이전트의 로컬 작업 파일이 저장소에 커밋되는 것을 방지하여 저장소 청결 유지.

## 2026-03-24 12:43:00

- **작업 내용:** 프론트엔드, 백엔드, AI 서버 통합 가동
- **상세 변경 내역:**
  - **백엔드 (Backend):** `./gradlew bootRun`을 통해 8080 포트에서 가동 확인.
  - **프론트엔드 (Frontend):** `npm run dev`를 통해 5173 포트에서 Vite 서버 가동 확인.
  - **AI 서비스 (AI Service):** FastAPI 기반 `main.py`를 8000 포트에서 가동 확인 (포트 충돌 해결).
  - **상태 점검:** `lsof` 및 `curl`을 통해 모든 서버의 정상 작동 및 헬스체크 확인 완료.
- **결과/영향:** 전체 서비스(프론트-백-AI) 연동 테스트가 가능한 통합 개발 환경 활성화.

## 2026-03-24 19:45:00

- **작업 내용:** 관리자 API 고도화 및 SSE 전용 인증 체계 구축 (Phase 0~5 완료)
- **상세 변경 내역:**
  - **SSE 인증 보안 강화 (Phase 0):** `JwtProvider.java`에 30초 유효 기간의 단기 토큰 생성 로직(`createSseToken`) 구현 및 `NotificationController.java`에 토큰 발급 엔드포인트(`POST /sse-token`) 추가. 프론트엔드 연결 에러 해결.
  - **데이터베이스 성능 최적화 (Phase 1):** `V2__admin_features.sql` 마이그레이션을 통해 유저 역할, 가입일, 문의 상태, 아이템 타입에 인덱스 추가.
  - **도메인 모델 확장 (Phase 2):** `Item`, `Toilet`, `Inquiry` 엔티티에 관리자용 수정/답변 메서드 추가.
  - **레포지토리 및 DTO 정립 (Phase 3~4):** 6개 레포지토리에 페이징/검색/통계 쿼리 추가 및 관리자 전용 DTO 9종 생성.
  - **통합 관리 API 구축 (Phase 5):** `AdminManagementService` 및 4개의 전용 컨트롤러를 통해 유저, 화장실, CS, 상점 관리용 13개 엔드포인트 구현.
- **결과/영향:** 프론트엔드 실시간 알림 구독 시의 보안 취약점과 500 에러를 동시에 해결하였으며, 관리자 페이지 운영에 필요한 모든 백엔드 인프라와 API를 완비함.

## 2026-03-24 17:30:00

- **작업 내용:** 백엔드 시스템 확장성 및 유지보수성 극대화 (Phase 3: 장기 개선 완료)
- **상세 변경 내역:**
  - **AOP 기반 공통 관심사 분리:**
    - `ServiceLoggingAspect.java`: 서비스 계층의 모든 메서드 호출 시 실행 시간 및 파라미터를 자동 로깅하는 AOP 구현.
    - `RateLimitAspect.java` & `@RateLimit`: Redis 기반의 처리량 제한(Rate Limiting) 기능을 구현하여 로그인, 회원가입 등 주요 API의 남용 및 공격 방지 환경 구축.
  - **SSE 분산 환경 최적화:** `NotificationService.java`를 Redis Pub/Sub 구조로 리팩토링. 서버 인스턴스가 여러 대인 환경에서도 실시간 알림이 끊김 없이 사용자에게 전달되도록 분산 메시징 레이어 구축.
  - **데이터베이스 형상 관리 도입:**
    - Flyway 마이그레이션 도입 (`V1__init.sql` 생성).
    - `application.yml`: `ddl-auto: validate`로 전환하여 운영 환경의 데이터 안전성 확보 및 코드 기반 스키마 동기화 체계 확립.
- **결과/영향:** 시스템의 가시성(Logging)과 보안(Rate Limit)을 강화하고, 클라우드/분산 환경으로의 확장 준비를 모두 마쳤으며, 데이터베이스 변경 이력을 안전하게 관리할 수 있는 전문적인 백엔드 아키텍처를 완성함.

## 2026-03-24 15:40:00

- **작업 내용:** 백엔드 구조 개선 및 안정성 고도화 (Phase 2: 중기 개선 완료)
- **상세 변경 내역:**
  - **外部 API 추상화:** `ExternalApiConfig.java`를 통해 타임아웃(연결 5s, 읽기 30s)이 설정된 전용 `RestTemplate` 빈을 등록. `spring-retry`를 도입하여 `AiClient`, `GeocodingService` 등 외부 연동 시 일시적 장애에 대한 자동 재시도 로직 적용.
  - **토큰 무효화 (Logout):** Redis 기반의 블랙리스트 메커니즘 구현. `AuthService.logout` 시 Access Token을 Redis에 등록하고, `JwtAuthenticationFilter`에서 모든 요청마다 블랙리스트 여부를 검증하여 로그아웃된 토큰의 재사용을 원천 차단.
  - **성능 최적화 (DB & Query):**
    - `schema.sql`: `users(email, nickname)`, `poo_records(user_id, created_at)`, `notifications(user_id, is_read)` 등 주요 조회 경로에 인덱스를 추가하여 검색 속도 개선.
    - **Fetch Join 적용:** `NotificationRepository`, `PooRecordRepository`, `InventoryRepository`에서 연관 엔티티 조회 시 `JOIN FETCH`를 사용하여 N+1 쿼리 문제를 해결하고 전체적인 API 응답 지연 시간 단축.
  - **비즈니스 로직 강화:** `PooRecordService`에서 기존 '개발 모드(경고 후 통과)' 검증 로직을 제거하고, 실제 반경 이탈(`OUT_OF_RANGE`) 및 체류 시간 미달(`STAY_TIME_NOT_MET`) 시 엄격하게 예외를 발생시키도록 수정. `PooRecordController`의 경로 오타(`api/v1/api/v1`)도 정상화함.
- **결과/영향:** 시스템의 회복탄력성(Resilience)과 보안성을 동시에 확보하였으며, 데이터베이스 접근 최적화를 통해 대규모 트래픽 상황에서도 안정적인 서비스 제공이 가능하도록 기반을 다짐.

## 2026-03-24 12:45:00

- **작업 내용:** 백엔드 아키텍처 리팩토링 및 보안 강화 (Phase 1: 단기 개선 완료)
- **상세 변경 내역:**
  - **보안 (CORS):** `SecurityConfig.java` 및 `application.yml` 수정. CORS 와일드카드(`*`)를 제거하고 설정 파일(`app.cors.allowed-origins`)을 통해 명시적인 도메인만 허용하도록 개선하여 보안성 강화.
  - **계층 분리 (Service 도입):** `UserService.java`를 신규 생성하여 Controller에서 `UserRepository`에 직접 접근하던 레이어 위반 문제를 해결. 공통 사용자 조회 로직을 Service 계층으로 캡슐화.
    - 적용 대상: `NotificationController`, `ShopController`, `SupportController`, `ReportController`, `HealthReportController`.
  - **예외 처리 표준화:** `NotificationService.java` 등에서 발생하던 `IllegalArgumentException`을 `BusinessException` 체계로 전환하여 전역 에러 응답 규격을 통일함.
  - **전역 예외 핸들러 보강:** `GlobalExceptionHandler.java`에 `DataIntegrityViolationException`(중복 키), `HttpMessageNotReadableException`(형식에 맞지 않는 요청) 처리 로직을 추가하고 `ErrorCode.DUPLICATE_KEY` 정의.
- **결과/영향:** Controller-Service-Repository 간의 명확한 역할 분담을 통해 아키텍처를 정립하고, 보안 취약점 해결 및 일관된 에러 처리로 시스템 안정성을 대폭 향상함.

## 2026-03-24 12:00:00

- **작업 내용**: 프론트엔드 리팩토링 잔여 작업 완료 및 시스템 고도화
- **상세 변경 내역**:
  - `VisitModal.tsx`: 카메라 중지 및 정리 로직을 `streamRef`를 통해 더 견고하게 보강.
  - `apiClient.ts`: 전역 `ApiResponse` 및 도메인 타입(`AiAnalysisResponse` 등)을 적용하여 제네릭 기반의 타입 안전성 확보.
  - `types/api.ts`: API 통신에 사용되는 공통 응답 및 도메인별 타입(User, Toilet, PooRecord 등) 정의.
  - `vite.config.js`: `manualChunks` 설정을 도입하여 벤더 라이브러리와 UI 컴포넌트를 분리 빌드하도록 최적화.
  - 의존성 제거: 미사용 라이브러리인 `axios` 및 `zustand`를 `package.json`에서 삭제.
- **결과/영향**: 런타임 안정성(카메라 이슈) 개선, 개발 생산성(타입 자동 완성) 향상 및 빌드 결과물 최적화.
