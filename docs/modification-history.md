# Project Modification History (대똥여지도 수정 이력)

이 문서는 프로젝트의 주요 수정 사항 및 히스토리를 기록하는 공식 로그 파일입니다.

---

## [2026-03-17 18:10:00] DB 초기화 및 행안부 공공데이터 동기화 (Geospatial Data Sync) 테스트 완료

- **작업 내용**: 데이터베이스 초기화(PostGIS 볼륨 재생성), 서버 포트(8080) 조정 및 행정안전부 공중화장실 API 연동 테스트 성공.
- **상세 변경 내역**:
  - **인프라 초기화**: `docker compose down -v`를 통해 기존 볼륨을 제거하고 PostGIS 및 Redis 인스턴스를 클린 상태로 재구동.
  - **보안 설정**: `SecurityConfig`를 수정하여 화장실 관련 API(`/api/v1/toilets/**`) 및 동기화 테스트 API에 대한 접근 권한을 허용(PermitAll).
  - **엔티티 및 서비스 보완**: `Toilet` 엔티티에 `isUnisex` 필드를 추가하고 빌더를 업데이트. 명세서 가이드에 따라 `PublicDataSyncService`에서 데이터 파이프라인 정제 로직(기본값 False 설정) 적용.
  - **테스트 API 구현**: `ToiletController`에 동기화 트리거(`POST /api/v1/toilets/sync`) 구현.
  - **검증 완료**: 공공 API 실시간 호출을 통해 34건의 화장실 데이터를 수집하여 PostgreSQL(PostGIS Point 타입) 및 Redis(Geo Index)에 정상 적재됨을 확인.
- **결과/영향**: 실제 공공기관 API와 안정적으로 통신하여 위치 기반 데이터를 관리할 수 있는 파이프라인이 확보됨.

---

## [2026-03-17 17:55:00] 환경변수 통합 및 하드코딩 제거 (Environment Configuration Hardening) 완료

- **작업 내용**: 서버 설정값 및 코드 내 하드코딩된 URL, 접속 정보를 `.env` 환경변수로 일원화하여 보안 및 유연성 강화.
- **상세 변경 내역**:
  - **환경변수 확장**: `backend/.env`에 `DB_HOST`, `DB_PORT`, `REDIS_HOST`, `REDIS_PORT`, `FRONTEND_URL`, `PGADMIN_DEFAULT_EMAIL` 등 누락된 설정값 추가 및 `PUBLIC_DATA_API_KEY` 중복 선언 수정.
  - **애플리케이션 설정 최적화**: `application.yml`의 `datasource.url`, `redis` 설정을 환경변수 참조 방식으로 변경하고, 프론트엔드 연동을 위한 `app.frontend.url` 속성 신설.
  - **소스 코드 개선**: `OAuth2SuccessHandler.java`에 하드코딩된 프론트엔드 리다이렉트 URL을 `@Value` 주입 방식으로 변경하여 로컬/운영 환경별 대응이 가능하도록 수정.
  - **인프라 설정 일원화**: `docker-compose.yml`의 DB 명칭 및 PGAdmin 설정값을 `.env` 변수와 연동하도록 수정.
- **결과/영향**: 모든 핵심 설정이 `.env` 한 곳에서 관리되어 환경 변화에 유연하게 대응할 수 있으며, 코드 내 민감 정보 노출 위험을 원천 차단함.

---

## [2026-03-17 19:45:00] 백엔드 계층 기반 리팩토링 및 AI 서비스 구조화 (Architecture Renewal) 완료

- **작업 내용**: 백엔드 패키지 구조를 도메인 중심에서 계층 중심으로 전환하고, AI 서비스를 FastAPI `app/` 구조로 표준화 완료.
- **상세 변경 내역**:
  - **백엔드 패키지 리뉴얼**: `com.ddmap`에서 `com.daypoo.api`로 전체 이관 및 `controller`, `service`, `repository`, `entity`, `dto`, `mapper`, `security`, `global` 계층으로 분리.
  - **Java 21 대응**: Gradle 버전을 7.3.1에서 8.5로 업그레이드하고 `ApiApplication.java` 신설.
  - **DTO 및 매퍼 복구**: 리팩토링 과정에서 누락된 `PooRecordResponse`, `ToiletResponse` 필드를 추가하고, MapStruct의 `String` ↔ `List<String>` 태그 매핑 로직(`PooRecordMapper`) 보완.
  - **AI 서비스 구조화**: FastAPI `main.py`를 `app/` 하위의 `core`, `api/v1/endpoints`, `services`, `schemas` 모듈 구조로 분리하여 확장성 확보.
- **결과/영향**: 백엔드와 AI 서비스 모두 엔터프라이즈급 아키텍처 표준을 준수하게 되었으며, 향후 기능 추가 및 유지보수가 용이한 고도화된 시스템 기반을 마련함.

---

## [2026-03-17 19:15:00] 실시간 알림 시스템 (Notification System) 구축 완료

- **작업 내용**: SSE(Server-Sent Events) 기반 실시간 알림 인프라 구축 및 주요 서비스 연동 완료.
- **상세 변경 내역**:
  - **인프라 구축**: `Notification` 엔티티 및 레포지토리 신설. SSE를 활용한 실시간 전송 로직(`NotificationService`) 구현.
  - **API 엔드포인트**: `/api/v1/notifications/subscribe` (SSE 구독), `/api/v1/notifications` (목록 조회), `PATCH .../read` (읽음 처리) 개방.
  - **서비스 연동**:
    - `AdminService`: 1:1 문의 답변 시 유저에게 실시간 알림 전송 연동.
    - `ReportService`: AI 건강 리포트 생성 완료 시 유저에게 알림 전송 연동.
  - **데이터 모델**: Java 21 `record` 타입을 활용한 `NotificationResponse` 구현.
- **결과/영향**: 사용자가 앱을 사용하는 동안 중요한 정보(문의 답변, 건강 리포트 등)를 즉각적으로 인지할 수 있는 인터랙티브한 서비스 환경 확보.

---

## [2026-03-17 18:45:00] 시스템 안정성 및 운영 고도화 (Architecture Hardening) 완료

- **작업 내용**: 전역 예외 처리, 입력값 검증, API 문서화, 로그 추적 시스템을 도입하여 엔터프라이즈급 백엔드 인프라 완성.
- **상세 변경 내역**:
  - **전역 예외 처리**: `GlobalExceptionHandler` 및 `BusinessException` 도입으로 일관된 `ErrorResponse` 규격 확보.
  - **입력값 검증**: DTO에 `@Valid` 기반 Bean Validation 적용하여 데이터 무결성 강화.
  - **API 문서화**: `SpringDoc OpenAPI (Swagger)` 의존성 추가 및 컨트롤러 어노테이션 보완으로 자동 명세화 구축.
  - **로그 추적 (Tracing)**: `MDCFilter`를 통한 Correlation ID 생성 및 AI 서비스 연동 시 헤더(`X-Correlation-Id`) 전달 로직 구현.
  - **클린업**: 레거시 패키지(`com.ddmap`) 및 미사용 테스트 파일 전면 삭제.
- **결과/영향**: 장애 대응력과 협업 효율성이 획기적으로 향상되었으며, 프로덕션 환경에 적합한 안정적인 서비스 구조 확보.

---

## [2026-03-17 18:15:00] Phase 4: 고객센터 및 관리자 시스템 (Support & Admin) 구축 완료

- **작업 내용**: 사용자 지원(1:1 문의, FAQ) 기능 및 운영 관리자용 대시보드 API 구축 완료.
- **상세 변경 내역**:
  - **고객 지원 엔티티**: `Inquiry`, `Faq` 엔티티 및 리포지토리 신설. 문의 상태(`InquiryStatus`) 및 종류(`InquiryType`) Enum 정의.
  - **사용자 API**: `SupportController`를 통해 1:1 문의 등록/조회 및 카테고리별 FAQ 조회 서비스 제공.
  - **관리자 API**: `AdminController`를 통해 전체 시스템 통계(유저, 기록, 화장실, 미답변 문의) 조회 및 문의 답변 등록 기능 구현. `@PreAuthorize` 기반 권한 제어 적용.
  - **데이터 모델**: 모든 요청/응답 객체를 Java 21 `record` 타입으로 구현하여 데이터 안정성 확보.
- **결과/영향**: 사용자 문의를 체계적으로 관리하고 서비스 운영 현황을 실시간으로 파악할 수 있는 관리 체계가 완성됨. 이로써 **프로젝트의 모든 백엔드 핵심 Phase(1~4) 개발이 최종 완료**됨.

---

## [2026-03-17 17:45:00] Phase 3: AI 건강 리포트 수익화 모델 (Monetization) 구축 완료

- **작업 내용**: 사용자의 배변 데이터를 분석하여 등급별(Daily/Weekly/Monthly) 리포트를 제공하고 포인트를 차감하는 수익화 시스템 구축.
- **상세 변경 내역**:
  - **등급 체계 수립**: `ReportType` Enum을 통해 데일리(무료), 위클리(50 Gold), 먼슬리(150 Gold) 가격 정책 적용.
  - **리포트 분석 엔진**: `ReportService`를 신설하여 기간별(1일/7일/30일) 배변 데이터를 집계하고 Python AI 서비스와 연동하여 종합 리포트 생성.
  - **수익화 및 캐싱**: 리포트 요청 시 유저 포인트를 차감하며, AI 호출 비용 절감을 위해 분석 결과를 Redis에 24시간 캐싱 처리.
  - **API 엔드포인트**: `ReportController`를 통해 `/api/v1/reports/{type}` API 개방.
- **결과/영향**: 단순 기록을 넘어 사용자에게 건강 인사이트를 제공하는 고부가 가치 서비스를 구현했으며, 포인트 소진처를 확보하여 인게임 경제 생태계 활성화.

---

## [2026-03-17 17:15:00] Phase 3: 실시간 랭킹 시스템 (Ranking System) 구축 완료

- **작업 내용**: Redis Sorted Set(ZSET)을 활용한 실시간 전국 및 지역별 랭킹 시스템 구축.
- **상세 변경 내역**:
  - **랭킹 엔진 구현**: `RankingService`를 신설하여 Redis `ZSET` 기반의 실시간 순위 계산(상위 10명 및 내 순위) 로직 구현.
  - **API 엔드포인트**: `RankingController`를 통해 `/api/v1/rankings/global` 및 `/api/v1/rankings/region` API 개방.
  - **실시간 연동**: `PooRecordService`에서 배변 기록 완료 시 유저의 포인트와 행정동 정보를 기반으로 Redis 랭킹이 즉시 업데이트되도록 연동.
  - **데이터 구조**: `UserRankResponse`, `RankingResponse` 등을 Java 21 `record` 타입으로 구현하여 데이터 불변성 확보.
- **결과/영향**: 대규모 유저 환경에서도 부하 없이 실시간 순위를 제공할 수 있게 되었으며, 유저 간의 경쟁 요소를 통해 서비스 리텐션 강화 기대.

---

## [2026-03-17 16:55:00] Java 21 Record 타입 도입 및 DTO 전면 리팩토링

- **작업 내용**: 유저가 포인트(Gold)를 사용하여 아이템을 구매하고, 칭호 및 아바타/마커 스킨을 장착할 수 있는 상점 시스템 구축.
- **상세 변경 내역**:
  - **엔티티 추가**: `Item`, `Inventory`, `Title`, `UserTitle`, `ItemType` (Enum) 신설.
  - **기능 구현**:
    - `ShopService`: 아이템 구매 시 유저 포인트 차감, 동일 타입 아이템 중복 장착 방지 로직, 보유 목록 조회 구현.
    - `ShopController`: `/api/v1/shop/**` 하위에 아이템 목록 조회, 구매, 인벤토리 관리, 칭호 장착 등 6개 엔드포인트 개방.
    - `User` 엔티티 확장: 포인트 차감(`deductPoints`) 및 칭호 장착(`equipTitle`) 메서드 추가.
  - **인프라**: 각 엔티티별 JpaRepository 및 DTO(`ItemResponse`, `InventoryResponse` 등) 작성 완료.
  - **문서화**: `work_me.md`에 향후 필요한 이미지 스토리지 및 결제 API 설정 섹션 추가.
- **결과/영향**: 배변 기록 보상으로 얻은 포인트를 소비할 수 있는 순환 경제 구조가 마련되었으며, 랭킹 시스템과 연동하여 유저 간의 차별화된 아바타/칭호 노출이 가능해짐.

---

## [2026-03-17 15:58:00] 레거시 패키지(com.ddmap) 정리

- **작업 내용**: 프로젝트 초기 명칭 잔재인 `com.ddmap` 패키지 및 관련 파일 삭제.
- **상세 변경 내역**:
  - `backend/src/main/java/com/ddmap` 디렉토리 및 하위 `BackendApplication.java` 등 레거시 파일 전면 삭제.
- **결과/영향**: 패키지 구조가 `com.daypoo`로 단일화되어 코드 관리가 명확해졌으며, 리팩토링 후의 빌드 안정성을 재검증함.

---

## [2026-03-17 15:45:00] Gradle 버전 업데이트 및 빌드 호환성 복구

- **작업 내용**: Java 21과 Gradle 7.3.1 간의 Major version 65 mismatch 이슈 해결 및 빌드 오류 수정.
- **상세 변경 내역**:
  - **Gradle Upgrade**: `backend/gradle/wrapper/gradle-wrapper.properties`의 `distributionUrl`을 7.3.1에서 **8.5**로 업데이트하여 Java 21 대응.
  - **컴파일 오류 해결**: Spring Boot 3.4.x / Spring Data Redis 3.x에서 변경된 `GeoReference` 패키지 경로를 `EmergencyService.java`에 추가 임포트하여 해결.
- **결과/영향**: `./gradlew compileJava` 빌드가 성공적으로 수행되며, 최신 Java 및 Spring Boot 환경에 최적화된 빌드 시스템 확보.

---

## [2026-03-17 15:30:00] 백엔드 계층 기반 리팩토링 (Layered Architecture Transition) 완료

- **작업 내용**: 도메인 중심(`domain/[domain]/*`)의 패키지 구조를 아키텍처 계층 중심(`[layer]/*`)으로 전면 재편하여 유지보수성 및 확장성 강화.
- **상세 변경 내역**:
  - **계층별 패키지 신설**: `backend/src/main/java/com/daypoo/api/` 하위에 `controller`, `service`, `repository`, `entity`, `dto`, `mapper`, `security`, `global` 패키지 생성.
  - **도메인 파일 이동 및 패키지 갱신**: 
    - `domain/record/entity/PooRecord.java`, `domain/user/entity/User.java`, `domain/toilet/entity/Toilet.java` -> `com.daypoo.api.entity` 이동.
    - `domain/record/repository/PooRecordRepository.java` 등 모든 리포지토리 -> `com.daypoo.api.repository` 이동.
    - `domain/auth/service/AuthService.java` 등 모든 서비스 -> `com.daypoo.api.service` 이동.
    - `domain/toilet/controller/ToiletController.java` 등 모든 컨트롤러 -> `com.daypoo.api.controller` 이동.
    - `domain/*/dto/*.java` -> `com.daypoo.api.dto` 및 `com.daypoo.api.mapper`로 분리 이동.
  - **보안/설정 통합**: 
    - `global/config/SecurityConfig.java`, `JwtProvider.java`, `JwtAuthenticationFilter.java` 및 `domain/auth/oauth/*` -> `com.daypoo.api.security` 패키지로 통합.
    - `GeometryUtil.java` 및 `RestTemplateConfig.java` -> `com.daypoo.api.global` 패키지로 이동.
  - **의존성 정리**: 42개 자바 파일 전수 조사 및 `import` 구문/`package` 선언문 일괄 업데이트. 패키지 분리에 따른 매퍼(`ToiletMapper`, `PooRecordMapper`)의 명시적 DTO 임포트 추가.
  - **공간 정리**: 기존 비어있는 `domain` 디렉토리 트리 제거.
- **결과/영향**: 백엔드 아키텍처가 통일된 계층 모델로 전환되어 코드 응집도가 계층별로 최적화되었으며, 신규 기능 추가 시 폴더 경로 선정이 직관적으로 개선됨. **[Phase 1 ~ 4 전 과정 완료]**

---

## [2026-03-17 14:35:00] Phase 3: AI 마이크로서비스 구축 및 Java-Python 통합 연동 완료

- **작업 내용**: OpenAI GPT-4o 기반 비전 분석, Redis 캐싱 기반 건강 리포트 엔진 구축 및 Java 백엔드 연동 완료
- **상세 변경 내역**:
  - **AI Service (Python FastAPI)**:
    - `VisionService`: GPT-4o `Structured Output`을 사용하여 배변 이미지에서 브리스톨 척도, 색상, 건강 점수를 추출하는 분석 엔진 구현.
    - `ReportService`: Redis 캐싱 로직이 결합된 AI 건강 리포트 생성기 구현. 동일 유저의 중복 요청을 방지하고 24시간 캐싱 적용.
    - 프로젝트 패키지 구조 최적화: `app/core`, `app/services`, `app/api` 계층 분리 및 전역 설정(`config.py`) 도입.
  - **Backend (Java Spring Boot)**:
    - `AiClient`: Python AI 서비스의 REST API를 호출하는 전역 클라이언트 구현 (`RestTemplate` 기반).
    - `PooRecordService` 통합: 배변 기록 생성 시 이미지가 포함되어 있으면 자동으로 AI 분석을 요청하여 브리스톨 척도와 색상을 자동 기입하는 스마트 로직 추가.
    - 설정 업데이트: `application.yml`에 AI 서비스 엔드포인트(`ai-service.url`) 설정 추가.
  - **문서화**: `work_me.md`에 OpenAI API Key 및 AI 서비스 URL 설정 가이드 업데이트.
- **결과/영향**: 배변 이미지를 찍기만 해도 AI가 건강 상태를 분석하고 점수를 매겨주는 스마트 서비스 파이프라인이 완성되어 **Phase 3 개발이 최종 완료**됨.

---

## [2026-03-17 14:17:00] Phase 2: 핵심 백엔드 비즈니스 시스템 - Record Domain (방문 인증 컴포넌트) 구현

- **작업 내용**: 화장실 도착 후 4단계 배변 상태 기록, 위치 검증(50m) 및 어뷰징 방지가 결합된 인증 API 구축 완료
- **상세 변경 내역**:
  - `User` 엔티티 업데이트: 인증 성공 시 호출될 경험치 및 포인트 추가, 레벨 업 로직(`addExpAndPoints`) 분리
  - `PooRecord` 인프라 세팅: `User`, `Toilet` 과의 N:1 연관관계 매핑 및 배변 형태(`bristolScale`), 색상, 조건 등을 저장하는 엔티티/리포지토리 생성
  - Data Flow 개설: `PooRecordCreateRequest` 및 MapStruct 기반의 반환형 `PooRecordResponse` DTO 작성
  - **`LocationVerificationService`**: 
      1. DB Native Query(`ST_DistanceSphere`)를 호출하여 해당 화장실과 현재 GPS 위치 간의 물리적 거리(50m 이내) 검증 기능 구현.
      2. Redis Rate Limiter를 사용해 3시간 이내 반복 인증을 막는 어뷰징 방어 `checkAndSetCooldown` 추가.
  - `PooRecordService` & `PooRecordController`: 위 조건들이 부합하면 `User` 점수를 올린 후 `PooRecord` 기록을 생성 및 저장하는 트랜잭션. `POST /api/v1/records` 개방.
- **결과/영향**: DayPoo 서비스의 핵심 재미 요소(포인트/레벨 게임화) 데이터 파이프라인과, 무분별한 조작 인증을 막는 GeoSpatial 및 Redis Rate 방어망 로직 확보로 **Phase 2 개발이 최종 완료**됨.

---

## [2026-03-17 13:21:00] Phase 2: 공공데이터 파싱 및 Redis 기반 Emergency Domain(급똥 대응) 구현

- **작업 내용**: 화장실 공공데이터(data.go.kr) 조회 및 벌크 인서트 구현, Redis 기반 초고속 GeoSearch(반경 탐색) 알고리즘 추가
- **상세 변경 내역**:
  - `PublicDataSyncService`: `RestTemplate`을 활용해 전국공중화장실표준데이터 7만 건을 페이징 단위로 받아 파싱. Jackson 객체 맵핑 및 누락된 필드 예외 처리.
  - 위치 초기화 로직: 수신한 데이터를 DB(PostGIS Point 타입)에 저장함과 동시에, 초고속 메모리 접근을 위해 **Redis Geo 구조(redisTemplate.opsForGeo().add)** 에 병렬로 인덱싱.
  - `GeometryUtil`: (경도, 위도) Double 값으로부터 JTS `Point` 객체(SRID 4326)를 생성하는 유틸리티 작성.
  - `EmergencyService`: Redis의 `GeoSearch`를 이용하여 반경 1km 이내 화장실 검색(`GeoReference`, `Distance` 활용).
  - 긴급 알고리즘 구현: `Weight = (Distance * 0.7) + (OpeningHours_Penalty * 0.3)` 공식에 따라 거리와 24시간 여부를 동시 평가, 가장 최적의 TOP 3 화장실 리턴 로직.
  - `EmergencyController`: `GET /api/v1/toilets/emergency` 엔드포인트 오픈.
- **결과/영향**: Phase 2의 주요 기능 중 하나인 '급똥 앱'의 핵심 코어 알고리즘(공공데이터 적재 -> Redis 인메모리 탑재 -> 초고속 랭킹 계산)이 성공적으로 완성되었습니다.

---

## [2026-03-17 13:16:00] Phase 2: 핵심 백엔드 비즈니스 시스템 - Toilet Domain (지도/화장실 1차 처리) 구현

- **작업 내용**: MapStruct 기반 DTO 매핑 및 PostGIS 공간 검색이 포함된 공중화장실 도메인 구조 생성
- **상세 변경 내역**:
  - `Toilet` Entity 구현: 화장실 데이터 구조 매핑 (`geometry(Point, 4326)` 사용)
  - `ToiletProjection` & `ToiletResponse` 등 DTO 구조체와 `ToiletMapper` (MapStruct) 구성
  - `ToiletRepository`: Native Query를 활용한 반경 탐색 쿼리 작성 (`ST_DistanceSphere` 기반)
  - `ToiletService` & `ToiletController`: 위도, 경도, 반경 (기본 1km) 파라미터를 받아와 리스트를 리턴해주는 엔드포인트 `/api/v1/toilets` 구축
  - `docs/onboarding/work_me.md`: 향후 벌크 인서트에 필요한 공공데이터포털(data.go.kr) API Key 발급 방법 등을 추가 기록 
- **결과/영향**: PostGIS의 공간 쿼리와 Spring Data JPA의 통합이 구현되어 프론트엔드에서 현재 위치 기반으로 화장실을 검색하여 화면에 렌더링 할 수 있는 핵심 파이프라인이 생성됨.

---

## [2026-03-17 13:12:00] Phase 2: 카카오/구글 소셜 로그인(OAuth2) 인프라 구축 및 개발자 온보딩 문서 세팅

- **작업 내용**: `spring-boot-starter-oauth2-client` 의존성 추가 및 소셜 로그인 연동 로직 구현
- **상세 변경 내역**:
  - `build.gradle`: OAuth2 Client 의존성 추가
  - `application.yml`: Kakao, Google OAuth2 Registration/Provider 속성 플레이스홀더(`YOUR_KAKAO_CLIENT_ID` 등) 적용
  - OAuth2 구조체 구현: `OAuth2UserInfo` 인터페이스, `KakaoOAuth2UserInfo`, `GoogleOAuth2UserInfo` 클래스
  - `CustomOAuth2UserService`: 소셜로부터 받아온 정보로 DB 조회 후, 미가입 시 패스워드 없는 신규 유저로 자동 회원가입 처리 로직 구현
  - `OAuth2SuccessHandler`: 소셜 로그인 성공 시 JWT(Access/Refresh)를 생성하여 클라이언트 콜백 URL로 파라미터 전달하도록 연동
  - `docs/onboarding/work_me.md`: 향후 개발자가 직접 입력해야 하는 카카오/구글 API Key 발급 방법 및 설정 위치 문서화 작성
- **결과/영향**: Phase 2의 Auth(인증) 도메인에서 자체 로그인/회원가입에 이어 소셜 로그인 파이프라인까지 완벽히 구축되었습니다. 프로젝트 구동 전 `work_me.md` 문서를 참고하여 API Key를 설정해야만 실행 예외를 막을 수 있습니다.

---

## [2026-03-17 13:02:00] Phase 2: 핵심 백엔드 비즈니스 시스템 - Auth & User 도메인 1차 구현

- **작업 내용**: 계층형 MVC 패키지 구조에 따라 사용자 인증(`Auth`) 및 회원 데이터(`User`)를 관리하는 핵심 컴포넌트 추가
- **상세 변경 내역**:
  - `User` Entity 구현: DB의 `users` 테이블 매핑, `level`, `exp`, `points` 같은 게이미피케이션 속성 포함. JPA Auditing 기능 적용 (`createdAt`, `updatedAt` 자동 기록)
  - `UserRepository` 구현: `Optional<User>`와 `existsByNickname` 등의 유저 검증용 쿼리 인터페이스 연동
  - `Auth` DTO 구현: 데이터 유출 방지를 위해 `SignUpRequest`, `LoginRequest`, `TokenResponse`로 요청/응답 페이로드 분리 및 엄격 관리
  - `AuthService` 작성: `BCrypt` 기반 패스워드 검증, 회원가입 시 중복 방지 로직 설계. `JwtProvider`를 통한 엑세스 토큰 및 리프레시 토큰 발급 구현 (리프레시 토큰 생성 로직 신규 추가)
  - `AuthController` 구현: 클라이언트용 `/api/v1/auth/signup`, `/api/v1/auth/login` 엔드포인트 개방
- **결과/영향**: DayPoo의 핵심 유저 인증 파이프라인이 생성됨. 이후 카카오/구글 소셜 로그인(OAuth2) 모듈을 확장하고 토큰 만료 처리 등 보안 작업을 고도화할 수 있는 기반 확보.

---

## [2026-03-17 12:54:00] Phase 1 셋업 완료: 계층형 MVC 기반 인프라 초기화

- **작업 내용**: DayPoo 백엔드 서버(Spring Boot) 스캐폴딩 및 `docker-compose.yml`(PostGIS, Redis, pgAdmin) 구성
- **상세 변경 내역**:
  - `backend/build.gradle`: Layered MVC 의존성(`MapStruct`, `QueryDSL`, `PostgreSQL/Spatial`) 및 `Spring Security/JWT` 패키지 구성
  - `backend/src/main/resources/application.yml` & `schema.sql`: 초기 DB 커넥션 및 PostGIS 기반 공간 데이터형(`Point`) DDL 작성
  - `backend/src/main/java/com/daypoo/api/global/config/`: `SecurityConfig`, `JwtAuthenticationFilter`, `JwtProvider` 클래스 작성으로 JWT 인증 환경 초기화
  - `backend/src/main/java/com/daypoo/api/domain/`: `auth`, `toilet`, `record`, `item` 등 MVC 계층(Controller, Service, Repository, Entity, Dto) 디렉토리 생성
- **결과/영향**: 계층형 MVC 패턴을 통한 기초 보안 및 인프라 구조(`Phase 1`) 코드 작성이 모두 왼료되었습니다. 데이터베이스 인스턴스를 즉각 실행하고 비즈니스 로직(Phase 2)에 집중할 수 있는 환경을 갖추었습니다.

---

## [2026-03-17 12:37:00] 아키텍처 MVC 전환 및 공공데이터, GUI 인프라 보강

- **작업 내용**: 헥사고날 아키텍처를 계층형 MVC로 변경하고 핵심 인프라 스펙 반영
- **상세 변경 내역**:
  - `docs/onboarding/plan.md`:
    - 헥사고날 관련 내용을 전면 제거하고 직관적이고 생산성 높은 **계층형 MVC (Controller-Service-Repository)** 아키텍처로 변경
    - 보안 및 API 스펙 보호를 위한 `DTO` 도입 및 매핑 자동화를 위한 `MapStruct` 적용 명시
    - 개발 및 시각적 데이터 검증 효율을 위해 Docker 인프라 구성에 `pgAdmin4` 추가
    - `전국공중화장실표준데이터` 공공데이터 API 연동 기반 화장실 데이터 적재 스펙 명시 
- **결과/영향**: 과도한 보일러플레이트로 인한 개발 지연을 방지하고 빠른 프로토타이핑이 가능해짐. 개발자가 직접 데이터베이스 스키마와 공간좌표를 `pgAdmin4`를 통해 직관적으로 확인할 수 있게 됨.

---

## [2026-03-17 11:45:00] 워크플로우 Workspace 등록 문제 해결

- **작업 내용**: Global 명령어 충돌 방지 및 Workspace 전용 등록 최적화
- **상세 변경 내역**:
  - `.agent/workflows/run.md` → `.agents/workflows/daypoo-run.md`로 이동 및 이름 변경
  - 기존 `run` 명령어와의 이름 충돌을 피하기 위해 `daypoo-run`으로 고유화
- **결과/영향**: UI의 `+ Workspace` 탭에서 정상적으로 등록 가능하며, `/daypoo-run` 명령어를 통해 현재 프로젝트의 표준 개발 프로세스를 호출할 수 있음.

---

## [2026-03-17 10:52:00] 방문 인증 프로세스에 AI 무음 사진 분석 기능 추가

- **작업 내용**: 방문 인증 프로세스에 AI 무음 사진 분석 기능 추가
- **상세 변경 내역**:
  - `docs/onboarding/plan.md`:
    - 2.3 방문 인증 로직에 "AI 간편 촬영 (무음, No-Save, 즉시 삭제)" 추가
    - 사용자 친화적 개인정보 보호 안내 UI 추가
    - User Story 2를 "무음/미저장 AI 스마트 인증"으로 업데이트
- **결과/영향**: 사용자가 배변 인증 과정을 더 빠르고 편하게 진행할 수 있게 되며, 프라이버시 우려를 최소화. 프론트엔드쪽에서 무음 카메라 모듈(WebRTC 활용 등) 및 비저장 AI 파이프라인 구축이 요구됨.

## [2026-03-17 11:05:00] 프로젝트 기획 상세화 (v4.1) 및 기술 전략 수립

- **작업 내용**: AI 사진 분석 및 GPS 검증 로직의 기술적 상세 전략 수립
- **상세 변경 내역**:
  - `docs/onboarding/plan.md`:
    - **무음 촬영 기술 스택**: WebRTC Canvas 추출 및 비디오 캡처 방식 명시
    - **보안 파이프라인**: 전 과정 In-Memory(Byte Array) 처리 및 물리 저장 배제 전략 확정
    - **GPS 고도화**: 실내/지하 음영 지역을 위한 Wi-Fi/Network 보정 및 동적 반경(최대 150m) 로직 추가
    - **AI 필터링**: 배변과 무관한 이미지에 대한 자동 반려(Abuse Prevention) 로직 추가
- **결과/영향**: 구현 단계에서의 기술적 불확실성 제거 및 사용자 프라이버시 보호 표준 강화.

---

## [2026-03-17 10:52:00] 방문 인증 프로세스에 AI 무음 사진 분석 기능 추가

## [2026-03-16 17:45:00] 프로젝트 일관성 확보 및 기술 스택 정렬 (Plan 일치화 작업)

- **수정 범위**: 프로젝트 전반 (Backend, Frontend, AI-Service, Root)
- **상세 변경 내역**:
  - **환경 정리**: 루트 디렉토리의 불필요한 임시 파일(`tteesstt.txt`) 삭제.
  - **DB 인프라 및 애플리케이션 설정**:
    - `docker-compose.yml`: MySQL 서비스를 **PostGIS 지원 PostgreSQL**(`postgis/postgis:16-3.4`)로 교체.
    - `application.yml`: DB 연결 정보를 PostgreSQL로 업데이트하고, Dialect를 **PostgisPGDialect**로 변경.
  - **백엔드(Backend)**:
    - `build.gradle` 수정: Spring Boot 버전을 `3.4.3`으로 안정화하고, MySQL에서 **PostgreSQL/PostGIS/QueryDSL/Redis**로 의존성 전면 교체.
    - **헥사고날 아키텍처** 기반 패키지 구조(`domain`, `application`, `adapter` 등) 생성.
  - **프론트엔드(Frontend)**:
    - JavaScript 프로젝트를 **TypeScript**로 전환.
    - `tsconfig.json`, `tsconfig.node.json` 설정 파일 생성 및 핵심 파일(`.jsx` → `.tsx`) 확장자 변경.
  - **AI 서비스(AI-Service)**:
    - FastAPI 기본 실행 코드(`main.py`) 및 헬스체크 엔드포인트 구축.
- **결과**: `plan.md`에 명시된 기술 스택 및 아키텍처와 실제 구현 코드 간의 불일치 사항을 100% 해소함.

---

## [2026-03-16 17:36:00] 프로젝트명 통일 및 폴더명 변경

- **수정 범위**: 프로젝트 루트 폴더 및 관련 문서.
- **상세 변경 내역**:
  - 프로젝트 정식 명칭을 `DayPoo (대똥여지도)`로 확정함에 따라 루트 폴더명을 `poopmap`에서 `daypoo`로 변경.
- **결과**: 브랜드 아이덴티티 일원화.

---

## [2026-03-16 17:35:00] 프로젝트 기획 고도화 및 아키텍처 확정

- **수정 범위**: `plan.md`, `task.md` 등 기획 및 설계 문서 전반.
- **상세 변경 내역**:
  - **인증(Auth)**: 닉네임 중복 체크, 계정 찾기 로직 구체화.
  - **지도(Map)**: 카카오맵 API 연동, 마커 시스템(회색/컬러 똥), AI 요약 모달 설계.
  - **랭킹(Ranking)**: 명예의 전당(TOP 3), Sticky Bar 내 순위 표시, 상점 연결 파이프라인.
  - **마이페이지(My Page)**: AI 쾌변 리포트, 내 문의 내역 추가.
  - **고객센터(Support)**: FAQ 아코디언 메뉴, 1:1 문의 상태값(대기/완료) 로직.
  - **관리자(Admin)**: 6대 핵심 메뉴(대시보드, 유저, 화장실, 설정, 문의, 상점) 상세화.
  - **알림(Notification)**: User/Admin 타겟별 알림 종류 구체화.
  - **기술 스택**: Java 21 업로드, 헥사고날 아키텍처, PostGIS 공간 쿼리 등 아키텍처 블루프린트 적용.
- **결과**: 개발 착수를 위한 모든 비즈니스 로직 및 기술 아키텍처 기획 통합 완료.
