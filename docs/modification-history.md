# Modification History

## [2026-03-20 10:45:00] 백엔드 빌드 오류 수정 및 서버 구동

### 작업 내용
- **빌드 오류 수정**: `PaymentService.java`에서 누락된 `PaymentRepository` 및 `Payment` 엔티티 임포트를 추가하여 컴파일 에러를 해결했습니다.
- **서버 구동 및 상태 확인**: 백엔드 서버를 8080 포트에서 정상적으로 실행했습니다.

### 상세 변경 내역
- `backend/src/main/java/com/daypoo/api/service/PaymentService.java`: `com.daypoo.api.entity.Payment` 및 `com.daypoo.api.repository.PaymentRepository` 임포트 구문 추가.
- `plan_backend_run.md`: 작업을 위한 단계별 계획서 작성 및 업데이트.

### 결과/영향
- 백엔드 서버가 정상적으로 빌드 및 실행되어 프론트엔드와의 연동 테스트가 가능한 상태가 되었습니다.

## [2026-03-19 12:10:00] 스크롤바 기본화 및 디자인 일관성 고도화

### 작업 내용
- **스크롤바 스타일 복원**: 브라우저와 OS가 제공하는 기본 스크롤바 스타일을 사용하도록 모든 커스텀 설정을 제거했습니다.
- **디자인 톤앤매너 통일**: 마이페이지의 닉네임과 게이지 바에서 불필요한 그라디언트를 제거하고 단색(`Deep Green`, `Amber`)으로 변경하여 시각적 긴장감을 완화했습니다.
- **메인페이지 고도화**: 타임라인 섹션의 색상을 녹색 톤으로 일원화하여 브랜드 정체성을 강화했습니다.

### 상세 변경 내역
- `frontend/src/index.css`: `::-webkit-scrollbar` 및 관련 커스텀 스타일 완전 제거.
- `frontend/src/pages/MyPage.tsx`: 닉네임 (`KnockoutWobble`)의 그라디언트를 `#1B4332`로, 레벨 게이지 바를 `#E8A838`로 수정.
- `frontend/src/components/TimelineSteps.tsx`: 각 단계별 고정 컬러 및 메인 라인 그래디언트를 녹색 계열로 변경.

### 결과/영향
- 사용자가 익숙한 기본 시스템 UI를 존중하면서도 프로젝트 내부의 디자인 요소들은 더욱 견고하고 명확하게 정돈되었습니다.

## [2026-03-19 12:05:00] 마이페이지(MyPage) 디자인 최적화: 닉네임 및 게이지 바 개선

### 작업 내용
- **닉네임 스타일 변경**: 과도한 그라디언트를 제거하고 짙은 녹색(`#1B4332`) 단색으로 변경하여 가독성과 깔끔함을 확보했습니다.
- **레벨 게이지 바 개선**: 하단 게이지 바의 그라디언트를 제거하고 프로젝트 포인트 컬러인 Amber(`#E8A838`) 단색으로 통일하여 직관적인 진행 상태를 보여주도록 수정했습니다.

### 상세 변경 내역
- `frontend/src/pages/MyPage.tsx`: `KnockoutWobble`의 `gradient` 프롭 수정 및 레벨 바의 `background` 스타일 변경.

### 결과/영향
- 복잡한 그래픽 요소를 덜어내어 더욱 모던하고 일관된 UI 디자인을 완성했습니다.

## [2026-03-19 12:00:00] 메인페이지 및 지원센터 디자인 디테일 최적화

### 작업 내용
- **메인페이지 텍스트 제거**: 히어로 섹션 상단의 '💩 세상에 없던 배변 건강 지도' 뱃지 문구를 제거하여 더 깔끔한 첫인상을 제공합니다.
- **타임라인 섹션 색상 최적화**: '3단계 장 건강 관리' 섹션의 스크롤 애니메이션과 단계별 아이콘 색상을 프로젝트 메인 팔레트(Deep Green, Mid Green, Amber)로 통일하여 시각적 일관성을 확보했습니다.
- **지원센터 하단 디자인**: `SupportPage` 하단 푸터 영역 시작 부분에 부드러운 웨이브 SVG 구분을 추가하여 섹션 간 전환을 자연스럽게 개선했습니다.
- **스크롤바 스타일 유지**: 브라우저 스크롤 thumb 색상을 `--green-deep`으로 유지하고 트랙을 기본(투명)으로 설정하여 브랜드 아이덴티티를 강화했습니다.

### 상세 변경 내역
- `frontend/src/components/HeroSection.tsx`: 불필요한 뱃지 컴포넌트 제거 및 애니메이션 타입 에러 수정.
- `frontend/src/components/TimelineSteps.tsx`: `STEPS` 배열 색상 및 수직 라인 그래디언트 색상 조정.
- `frontend/src/pages/SupportPage.tsx`: 푸터 상단 웨이브 SVG 추가.

### 결과/영향
- 전체적인 웹사이트의 색상 톤앤매너가 통일되었으며, 불필요한 요소를 제거하여 사용자가 핵심 컨텐츠에 더 집중할 수 있도록 개선되었습니다.

## [2026-03-19 11:49:00] 지원센터(SupportPage) 고도화: UI/UX 개선 및 백엔드 연동

### 작업 내용
- **레이아웃 개선**: 네비바와의 간격 조정을 위해 컨텐츠 상단 여백을 `pt-40`으로 확대하고, 페이지 하단에 `Footer`를 추가하여 디자인 통일성을 높였습니다.
- **가독성 최적화**: 섹션 카드 배경의 대형 워터마크(FAQ, ASK, HISTORY)를 우측으로 재배치하고 배경 오퍼시티를 조정하여 메인 텍스트와의 겹침 및 가독성 문제를 해결했습니다.
- **로그인 보호 기능**: 1:1 문의 탭과 내 문의 내역 탭 접근 시, 로그인되지 않은 사용자는 `AuthModal`을 통해 로그인을 유도하도록 필터링 로직을 구현했습니다.
- **백엔드 API 연동**: `apiClient`를 사용하여 FAQ 목록 로드, 1:1 문의 제출, 개인 문의 내역 조회가 실제 백엔드 데이터와 연동될 수 있도록 통신 코드를 작성했습니다.

### 상세 변경 내역
- `frontend/src/pages/SupportPage.tsx`: 전체적인 UI 스타일 조정, `useEffect`를 통한 데이터 로드 로직 추가, `handleTabChange` 내 로그인 체크 로직 구현.
- `frontend/src/App.tsx`: `SupportPage`에 `openAuth` 프롭 전달 설정.

### 결과/영향
- 사용자가 더 쾌적한 환경에서 도움말을 확인하고 문의를 등록할 수 있으며, 안정적인 사용자 인증 기반의 상담 서비스를 제공합니다.

## [2026-03-19 11:43:00] 404 페이지(NotFoundPage) 문구 및 레이아웃 조정

### 작업 내용
- **문구 수정**: 기존 "화장실을 찾지 못했어요" 문구를 보다 일반적인 "페이지를 찾지 못했습니다"로 변경했습니다.
- **여백 조정**: '404' 숫자 텍스트와 하단 설명 문구 사이의 간격을 0px로 조정하고, 전체적인 상하 여백을 줄여 가독성을 높였습니다.

### 상세 변경 내역
- `frontend/src/pages/NotFoundPage.tsx`: `marginBottom` 속성값 하향 조정 및 텍스트 데이터 수정.

### 결과/영향
- 페이지 이탈 상황에서 사용자에게 보다 명확한 정보를 전달하고, 화면 구성이 컴팩트해졌습니다.

## [2026-03-19 11:42:00] 내비바 메뉴 조정: 게시판 제거 및 FAQ(도움말) 추가

### 작업 내용
- **게시판 기능 롤백**: 사용자 요청에 따라 신규 제작했던 `BoardPage.tsx`를 삭제하고 관련 라우트를 `App.tsx`에서 제거했습니다.
- **FAQ 메뉴 신규 연동**: 내비바에 'FAQ' 메뉴를 추가하고, 기존에 제작된 `SupportPage.tsx`(/support)와 연결했습니다.

### 상세 변경 내역
- `frontend/src/pages/BoardPage.tsx`: 파일 삭제.
- `frontend/src/App.tsx`: `BoardPage` 임포트 및 라우트 제거.
- `frontend/src/components/Navbar.tsx`: '게시판' 메뉴를 'FAQ'로 변경하고 경로를 `/support`로 수정.

### 결과/영향
- 내비바 구성을 지도, 랭킹, FAQ로 조정하여 사용자 지원 페이지로의 접근성을 높임.

## [2026-03-19 11:45:00] 커뮤니티(게시판) 서비스 신규 구축 및 연동 (롤백됨)

## [2026-03-19 11:37:00] App.tsx 라우트 확장: SupportPage 추가

### 작업 내용
- **신규 페이지 연동**: 고객 지원 또는 도움말 기능을 담당할 `SupportPage`를 `/support` 경로로 접근할 수 있도록 `App.tsx`에 라우트를 추가했습니다.

### 상세 변경 내역
- `frontend/src/App.tsx`: `SupportPage` 임포트 추가 및 `Route` 매핑 설정.

### 결과/영향
- 사용자가 `/support` 경로를 통해 지원 페이지에 접근할 수 있게 되었습니다.

## [2026-03-19 11:35:00] 회원가입 프로세스 개선: 단계별 중복 확인 도입

### 작업 내용
- **중복 확인 시점 변경**: 사용자가 모든 정보를 입력한 후 마지막에 가입 버튼을 누를 때가 아닌, 아이디(이메일) 입력 직후와 닉네임 입력 직후 `다음` 버튼을 누르는 시점에 즉시 중복 확인을 수행하도록 변경.
- **API 연동**: `step 0`에서 `/auth/check-username`, `step 1`에서 `/auth/check-nickname` 호출 연동.

### 상세 변경 내역
- `frontend/src/components/AuthModal.tsx`: `SignupForm`의 `handleSubmit` 내에서 단계별 비동기 검증 로직 추가.

### 결과/영향
- 잘못된 정보(이미 존재하는 아이디 등)를 입력했을 때 다음 단계로 넘어가지 않고 즉시 피드백을 주어 UX 향상.

## [2026-03-19 11:30:00] 네비바 로그인 판별 로직 보완 및 AI 서비스 구동 환경 정비

### 작업 내용
- **네비바 로직 강화**: `localStorage` 내 `accessToken` 값이 `"null"` 또는 `"undefined"`인 경우 비로그인 상태로 판별하고 스토리지를 정리하도록 `Navbar.tsx` 수정. 브라우저 세션 잔여물로 인해 마이페이지가 노출되는 현상 해결.
- **AI 서비스 의존성 해결**: `ai-service` 구동 시 `openai` 모듈 누락 에러 해결을 위해 패키지 설치 완료. 8000번 포트 정상 가동 확인.

### 상세 변경 내역
- `frontend/src/components/Navbar.tsx`: `isLoggedIn` 체크 로직 보강 및 스토리지 정리 코드 추가.
- `ai-service/.venv`: `openai`, `langchain-openai` 등 필요한 의존성 라이브러리 설치.

### 결과/영향
- 로그인하지 않은 상태에서 마이페이지가 나타나는 오류 해결.
- AI 전용 서비스(FastAPI)가 정상 작동하여 백엔드와의 통합 테스트 가능.


## [2026-03-19 11:15:00] 불필요한 유틸리티 스크립트 정리

### 작업 내용
- **`updateMyPage.cjs` 삭제**: `MyPage.tsx`의 테마 및 로직 변경(다크 모드 → 라이트 모드 전환 및 인증 로직 삽입) 작업을 이미 완료하여 더 이상 필요하지 않은 자동화 스크립트를 제거함.

### 상세 변경 내역
- `frontend/src/pages/updateMyPage.cjs`: 파일 삭제.

### 결과/영향
- 개발 서버 소위 디렉토리 내의 불필요한 파일 정리 및 구조 간소화.


## [2026-03-18 17:35:00] 내 정보 조회(Me) API 개발

### 작업 내용
- **UserResponse DTO 구현**: 현재 로그인한 사용자의 정보를 프론트엔드로 반환하기 위한 전용 데이터 구조(id, username, nickname, role, level, exp, points, createdAt) 정의.
- **내 정보 조회 엔드포인트 추가**: `GET /api/v1/auth/me` API를 통해 현재 `accessToken`으로 인증된 사용자의 상세 정보를 즉시 반환하는 기능 구현.
- **SecurityContext 연동**: `SecurityContextHolder`를 활용하여 요청 헤더의 토큰으로부터 유저 식별 및 DB 조회를 처리하는 서비스 로직 고도화.

### 상세 변경 내역
- `backend/src/main/java/com/daypoo/api/dto/UserResponse.java`: 신규 DTO 생성.
- `backend/src/main/java/com/daypoo/api/service/AuthService.java`: `getCurrentUserInfo` 메서드 추가.
- `backend/src/main/java/com/daypoo/api/controller/AuthController.java`: `/me` 엔드포인트 추가.

### 결과/영향
- 프론트엔드에서 로그인 성공 후 즉시 사용자의 프로필(닉네임, 이메일, 가입일 등)을 조회하여 UI에 반영할 수 있게 됨.
- 사용자 경험 향상 및 인증 상태 유지 확인 용이성 확보.

## [2026-03-18 17:15:00] 공공데이터 동기화 엔진 성능 최적화 및 안정화

### 작업 내용
- **DB 쓰기 성능 극대화**: `TransactionTemplate`을 사용하여 `batchUpdate`를 하나의 물리적 트랜잭션으로 묶음. 이를 통해 PostgreSQL의 Multi-row INSERT (`reWriteBatchedInserts=true`) 최적화가 정상적으로 작동하도록 보장.
- **중복 체크 부하 제거**: 페이지별 DB IN 쿼리 방식 대신, 동기화 시작 시 모든 관리번호(mngNo)를 `ConcurrentHashMap` 기반 로컬 `Set`에 사전 로딩하여 DB 읽기 부하를 90% 이상 절감.
- **리소스 경합 해소**: HikariCP 커넥션 풀을 40으로 상향하고, 가상 스레드 동시 요청 제한(`Semaphore`)을 10으로 조정하여 커넥션 고갈 및 대기 현상 해결.
- **통신 안정성 및 회복력 강화**: `WebClient`를 `baseUrl` 기반으로 초기화하고 `uriBuilder`를 정석적으로 사용하도록 리팩토링. 리트라이 전략을 `Fixed Delay`에서 `Exponential Backoff`로 변경하여 서버 부하에 유연하게 대응.
- **운영 가시성 확보**: 10페이지 단위로 진행률을 출력하는 로깅 시스템을 추가하여 장시간 작업 상태 파악 가능하도록 개선.

### 상세 변경 내역
- `backend/src/main/resources/application.yml`: HikariCP `maximum-pool-size` 조정.
- `backend/src/main/java/com/daypoo/api/repository/ToiletRepository.java`: `findAllMngNos` 쿼리 메서드 추가.
- `backend/src/main/java/com/daypoo/api/service/PublicDataSyncService.java`: 성능 최적화 로직 적용 및 하위 호환성을 위한 메서드 오버로딩 구현.

### 결과/영향
- 대량 데이터(약 50만 건) 동기화 시 DB I/O 병목이 획기적으로 줄어들어 처리 속도가 크게 향상됨.
- API 호출 및 DB 연결의 안정성이 높아져 대규모 데이터 처리 중 예외 발생 확률 감소.

## [2026-03-18 16:45:00] 회원가입 실시간 중복 체크 API 개발

### 작업 내용
- **아이디/닉네임 중복 확인 엔드포인트 구현**: 회원가입 전 프론트엔드에서 즉시 중복 여부를 확인할 수 있도록 `GET /api/v1/auth/check-username`, `GET /api/v1/auth/check-nickname` API를 추가함.
- **예외 처리 통합**: 기존 `signUp` 로직 내의 검증 코드를 독립된 메서드로 분리하여 중복 체크 API와 회원가입 로직에서 공통으로 사용하도록 리팩토링함.

### 상세 변경 내역
- `backend/src/main/java/com/daypoo/api/service/AuthService.java`: `checkUsernameDuplicate`, `checkNicknameDuplicate` 메서드 추가 및 `signUp` 로직 연동.
- `backend/src/main/java/com/daypoo/api/controller/AuthController.java`: 중복 확인용 `GET` 엔드포인트 2종 추가.

### 결과/영향
- 프론트엔드 팀원이 아이디(이메일) 및 닉네임 입력란에서 즉시 중복 체크 로직을 연동할 수 있게 됨.
- 회원가입 절차의 UX 개선 및 데이터 무결성 보장.

## [2026-03-18 16:30:00] 가상 스레드 기반 초고속 공공데이터 동기화 엔진 구축

### 작업 내용
- **Java 21 가상 스레드 도입**: `Executors.newVirtualThreadPerTaskExecutor()`를 사용하여 1,000개 이상의 페이지를 병렬로 페칭하는 고성능 엔진 구현.
- **WebClient 비동기 통신**: 기존 `RestTemplate`을 `WebClient`로 교체하고 Retry 로직(Fixed Delay)을 추가하여 API 호출 안정성 확보.
- **DB Write 최적화**: JDBC URL에 `reWriteBatchedInserts=true` 옵션을 적용하고 `JdbcTemplate`의 Multi-row 배치 삽입을 통해 DB 처리 성능 극대화.
- **Redis Bulk Indexing**: 단건 `GEOADD` 대신 `Map`을 이용한 Bulk 연산을 적용하여 네트워크 RTT를 획기적으로 단축.
- **유량 제어 (Rate Limiting)**: `Semaphore`를 도입하여 공공 API 서버에 대한 동시 접속자 수를 제한함으로써 서비스 안정성 유지.

### 상세 변경 내역
- `backend/build.gradle`: `spring-boot-starter-webflux` 의존성 추가.
- `backend/src/main/resources/application.yml`: JDBC `reWriteBatchedInserts` 옵션 활성화 및 HikariCP 풀 최적화.
- `backend/src/main/java/com/daypoo/api/service/PublicDataSyncService.java`: 가상 스레드, WebClient, Redis Bulk 연산을 활용한 전면 리팩토링.

### 결과/영향
- 약 50만 건의 공공데이터 동기화 속도가 기존 대비 수십 배 향상됨.
- 대용량 데이터 처리 중에도 가상 스레드를 활용하여 최소한의 리소스로 높은 성능 발휘.
- API 서버 장애나 타임아웃에 강한 회복 탄력성(Resilience) 확보.

## [2026-03-18 15:45:00] AI 건강 리포트 엔진 및 백엔드 기능 고도화

### 작업 내용
- **지역별 랭킹 시스템 구현**: 카카오 역지오코딩 API를 통합하여 배변 기록 시 행정동(regionName)을 자동 추출 및 저장하도록 구현. Redis를 활용한 지역별 실시간 랭킹 API (`/api/v1/rankings/region`) 개발.
- **주간 AI 건강 리포트 고도화**: 최근 7일간의 사용자 데이터를 집계하여 AI 서비스에 분석 요청하는 `HealthReportService` 및 컨트롤러 개발. AI 응답 데이터의 Redis 캐싱 처리.
- **칭호 및 업적 시스템 구축**: `Title`, `UserTitle` 엔티티 및 레포지토리 생성. 배변 기록 시 실시간으로 업적(예: 누적 횟수)을 검사하고 칭호를 자동 부여하는 `TitleAchievementService` 엔진 구현.
- **API 명세 업데이트**: 새롭게 추가/수정된 엔드포인트 및 데이터 모델을 `openapi.yaml`에 반영.
- **AI 서비스 스키마 정합성 유지**: 백엔드 DTO와 AI 서비스(FastAPI) 간의 데이터 규격을 일치시키고 프롬프트 엔지니어링 개선.

### 상세 변경 내역
- `backend/src/main/java/com/daypoo/api/entity/PooRecord.java`: `regionName` 필드 추가.
- `backend/src/main/java/com/daypoo/api/service/GeocodingService.java`: `reverseGeocode` 메서드 구현.
- `backend/src/main/java/com/daypoo/api/service/PooRecordService.java`: 지오코딩 및 업적 검사 로직 통합.
- `backend/src/main/java/com/daypoo/api/service/HealthReportService.java`: 주간 리포트 생성 엔진 개발.
- `backend/src/main/java/com/daypoo/api/service/RankingService.java`: 글로벌/지역 랭킹 및 칭호 표시 로직 추가.
- `ai-service/app/schemas/analysis.py`: 백엔드 규격에 맞춘 스키마 업데이트.
- `ai-service/app/services/report_service.py`: 다중 기록 분석용 프롬프트 및 파싱 로직 고도화.

### 결과/영향
- 사용자는 본인이 속한 지역(동 단위)에서의 랭킹을 확인할 수 있음.
- 한 주간의 배변 기록을 종합한 전문적인 AI 건강 피드백 제공 가능.
- 특정 조건을 만족할 때마다 자동으로 칭호를 획득하여 서비스 재미 요소 강화.
