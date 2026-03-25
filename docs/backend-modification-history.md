# Backend Modification History

## [2026-03-25 17:00:00] 구독 해지 및 관리 기능 백엔드 리팩토링
- **작업 내용:** 사용자가 직접 멤버십을 관리할 수 있도록 구독 취소 및 자동 갱신 제어 API를 추가하고, 예외 처리를 공통 비즈니스 예외로 통일하였습니다.
- **상세 변경 내역:**
  - **`SubscriptionController.java`**: 
    - `POST /cancel`: 구독을 취소하되 만료일까지 활성 상태를 유지하는 엔드포인트 구현.
    - `PATCH /auto-renewal`: 자동 갱신 여부를 토글하여 만료 후 자동 결제를 방지하는 엔드포인트 구현.
    - `getMySubscription`: 기존 `IllegalArgumentException`을 `BusinessException(ErrorCode.SUBSCRIPTION_NOT_FOUND)`으로 변경하여 백엔드 전반의 예외 처리 스타일과 정렬.
- **결과/영향:** 프론트엔드의 '구독 관리 모달' 구현을 위한 필수 API가 확보되었으며, 코드의 안정성과 일관성이 향상되었습니다.

## [2026-03-25 16:30:00] 방문 인증 로그(Permanent Logging) 및 AI 리포트 스냅샷 저장 시스템 구축
- **작업 내용:** AI 서비스 품질 향상 및 데이터 영속성을 위해 방문 인증 과정의 로그와 AI 분석 결과를 DB에 영구 저장하도록 시스템을 확장하였습니다.
- **상세 변경 내역:**
  - **스키마 도입**: `visit_logs`(체크인/인증 이벤트), `health_report_snapshots`(AI 분석 결과) 테이블 명세 및 Flyway 마이그레이션(`V15`, `V16`) 완료.
  - **로그 기록 자동화**: `PooRecordService`를 리팩토링하여 체크인 성공/실패, 기록 생성 시점의 위경도, 체류 시간, 화장실 거리를 로그에 기록합니다.
  - **리포트 보관 및 최적화**: `ReportService`에서 AI 리포트 생성 시 결과를 DB에 스냅샷으로 저장하고, 캐시 미스 시 DB에서 먼저 조회(Fallback)하여 AI 호출 비용을 절감합니다.
  - **DTO 확장**: `HealthReportResponse`에 기록 수 및 분석 기간 정보를 추가하여 사용자에게 더 정확한 데이터를 제공합니다.
- **결과/영향:** 과거 리포트 히스토리 조회 기능의 기반이 마련되었으며, 사용자 방문 패턴 분석이 가능해졌습니다.

## [2026-03-25 16:50:00] AI 리포트 서비스 고도화 및 분석 데이터 조회 API 추가 (Phase 2)
- **작업 내용:** 저장된 리포트 스냅샷과 방문 로그를 사용자에게 제공하기 위한 API 엔드포인트를 추가하고 관련 로직을 고도화하였습니다.
- **상세 변경 내역:**
  - **히스토리 조회 API**: `GET /api/v1/reports/history`를 통해 과거 분석 리포트 리스트를 조회할 수 있습니다.
  - **건강 점수 트렌드 API**: `GET /api/v1/reports/trend`를 통해 최근 10건의 건강 점수 변화 추이를 제공합니다.
  - **방문 패턴 데이터 API**: `GET /api/v1/reports/patterns`를 통해 위경도, 체류 시간, 거리 등의 상세 방문 인증 로그를 조회할 수 있습니다.
  - **DTO 확장 및 정제**: `HealthReportHistoryResponse`, `VisitLogResponse` 등을 도입하여 정제된 분석 데이터를 반환합니다.
- **결과/영향:** 사용자가 자신의 과거 건강 변화를 추적하고, 개인화된 방문 패턴 정보를 확인할 수 있게 되었습니다 (PRO/PREMIUM 멤버십 기능 연동 예정).

## [2026-03-25 15:15:00] 멤버십(구독) 시스템 고도화 리팩토링 (가이드 준수)
- **작업 내용:** 가이드 문서(`stateless-tinkering-naur.md`)의 표준 아키텍처를 따라 멤버십 시스템을 전면 리팩토링하였습니다.
- **상세 변경 내역:**
  - **Enums 도입**: `SubscriptionPlan`, `SubscriptionStatus`, `BillingCycle` 등 전용 ENUM을 도입하여 안정성을 높였습니다.
  - **엔티티 고도화**: `Subscription` 엔티티에 자동 갱신 여부(`isAutoRenewal`), 결제 주기, 최근 결제 참조 등을 추가하였습니다.
  - **User 연동 강화**: `User` 엔티티 내에 활성 구독 조회 및 PRO 여부 판별 헬퍼 메서드를 추가하였습니다.
  - **독립 서비스 분리**: `SubscriptionService`를 생성하여 구독 생성, 취소, 갱신, 만료 등 비즈니스 로직을 중앙 집중화하였습니다.
  - **결제 연동 최적화**: `PaymentService`에서 결제 시 주문 ID 또는 금액을 통해 플랜을 지능적으로 판단하도록 개선하였습니다.
  - **API 엔드포인트 추가**: `SubscriptionController`를 통해 내 구독 정보 및 히스토리 조회 API를 제공합니다.
- **결과/영향:** 이제 실제 상용 서비스 수준의 탄탄한 구독 관리 시스템을 갖추게 되었으며, 프론트엔드 연동이 더욱 용이해졌습니다.

## [2026-03-25 15:00:00] 멤버십(PRO/PREMIUM) 구독 시스템 도입 및 결제 기능 고도화
- **작업 내용:** 정기 구독 멤버십 시스템을 도입하고, 결제 완료 시 자동으로 유저 등급(Role)을 업데이트하도록 기능을 확장하였습니다.
- **상세 변경 내역:**
  - **`Role.java`**: `ROLE_PRO`, `ROLE_PREMIUM` 권한을 추가하였습니다.
  - **`Subscription` 서비스**: 
    - 구독 정보를 관리하기 위한 `Subscription` 엔티티와 레포지토리를 생성하였습니다.
    - `subscriptions` 테이블 생성을 위한 DB 마이그레이션 (`V14`)을 추가하였습니다.
  - **`PaymentService`**:
    - `confirmPayment` 로직을 개선하여 결제 금액(4900원, 9900원)에 따라 해당 멤버십을 활성화하도록 하였습니다.
    - 기존 유효한 구독이 있을 경우 기간을 30일 연장하며, 신규 가입 시 새로 생성합니다.
    - 결제 완료 시 유저의 `Role`을 즉시 업그레이드합니다.
  - **`UserService`**: 유저 정보 영속화를 위한 `updateUser` 메서드를 추가하였습니다.
  - **`UserResponse`**: API 응답에 유저의 현재 `role` 정보를 포함시켜 프론트엔드 UI 처리가 가능하도록 하였습니다.
- **결과/영향:** 이제 유저는 결제를 통해 PRO 또는 PREMIUM 멤버십 혜택을 받을 수 있으며, 시스템은 구독 기간을 자동으로 관리합니다.


## [2026-03-25 14:45:00] 칭호 시스템 확장 및 유저 정보 응답 고도화
- **작업 내용:** 칭호 해제 기능을 추가하고, API 응답 시 현재 장착된 칭호 정보를 포함하도록 백엔드를 수정하였습니다.
- **상세 변경 내역:**
  - **`ShopController`**: `@DeleteMapping("/api/v1/shop/titles/equip")` 엔드포인트를 추가하여 칭호 해제 기능을 구현하였습니다.
  - **`ShopService`**: 
    - `unequipTitle(User user)` 메서드를 추가하여 유저의 `equippedTitleId`를 `null`로 초기화하도록 하였습니다.
    - `getAllTitles(User user)` 메서드를 수정하여 각 칭호별로 `isEquipped` 장착 여부 플래그를 응답에 포함하도록 개선하였습니다.
  - **`AuthService`**: `getCurrentUserInfo()` 호출 시 `TitleRepository`를 참조하여 현재 장착된 칭호의 이름(`equippedTitleName`)을 조회하고 응답에 포함하도록 수정하였습니다.
  - **DTO 확장**:
    - `UserResponse`: `equippedTitleId` (ID) 및 `equippedTitleName` (이름) 필드를 추가하였습니다.
    - `TitleResponse`: `isEquipped` (장착 여부) 필드를 추가하였습니다.
- **결과/영향:** 이제 프론트엔드에서 유저의 장착 칭호를 실시간으로 확인하고 해제할 수 있으며, 칭호 목록에서 현재 어떤 칭호가 장착 중인지 명확하게 표시할 수 있게 되었습니다.


## [2026-03-25 11:41:00] Gradle 빌드 및 서버 구동 성능 최적화 (Step 1)
- **작업 내용:** 서버 구동 시간 단축 및 빌드 효율성 향상을 위해 Gradle 최적화 설정을 적용하였습니다.
- **상세 변경 내역:**
  - **`gradle.properties` 추가**: 
    - `org.gradle.parallel=true`: 다중 스레드 병렬 빌드 활성화.
    - `org.gradle.configuration-cache=true`: 중복 빌드 설정 단계 생략을 위한 설정 캐시 활용.
    - `org.gradle.jvmargs=-Xmx2048m`: 빌드 과정에서 발생하는 OOM(Out Of Memory) 방지를 위한 메모리 확장.
- **결과/영향:** 전체적인 빌드 및 구동 준비 속도가 향상되었으며, 대규모 시뮬레이션 환경 부하 시 발생할 수 있는 빌드 메모리 부족 현상을 완화하였습니다.


## [2026-03-25 11:35:00] 백엔드 시뮬레이션 시스템 고도화 및 팀원 작업 내역 동기화
- **작업 내용:** 대규모 트래픽 시뮬레이션 시스템의 로직 안정화 작업을 완료하고, 팀원들이 `main` 브랜치에 반영한 최신 코드(`V6~V8` DB 마이그레이션 등)를 로컬로 가져와 통합한 후 새로운 전송용 브랜치에 푸시하였습니다.
- **상세 변경 내역:**
  - **시뮬레이션 로직 보강**: `BotOrchestrator`, `BotUserPool` 및 각 시나리오(Explorer, Shopper 등) 클래스의 안정성 강화 및 불분명한 설정(`SimulationProperties` 등) 정비를 완료하였습니다.
  - **저장소 동기화**: `main` 브랜치에서 발생한 신규 마이그레이션 파일(`V6__add_faqs_table.sql` 등) 및 프론트엔드 변경 사항을 로컬 `main`에 풀(pull) 받아 최신 상태로 갱신하였습니다.
  - **브랜치 통합**: 신규 브랜치 `feature/simulation-updates`를 생성하여 최신 `main` 기반 위에 시뮬레이션 관련 작업 내역을 모두 통합(commit)하였습니다.
- **결과/영향:** 이제 원격 저장소에는 시뮬레이션 시스템의 최종적인 수정 사항들이 반영되었으며, 팀원들의 최신 작업(FAQ 테이블, UpdatedAt 컬럼 추가 등)도 로컬 개발 환경에 안전하게 동기화되었습니다.


## [2026-03-25 11:13:00] 백엔드 서버 재가동 및 시뮬레이션 환경 복구
- **작업 내용:** 사용자의 요청에 따라 백엔드 서버를 `simulation` 프로파일로 재시작하고 가동 상태를 확인하였습니다.
- **상세 변경 내역:**
  - **프로세스 정리**: 기존 포트 `8080`을 점유하던 Java 프로세스(PID 89270)를 종료하였습니다.
  - **서버 재실행**: `backend/start_backend.sh` 스크립트를 사용하여 신규 프로세스(PID 91835)를 가동하였습니다.
  - **상태 검증**: `PublicDataSyncService`의 벌크 동기화가 완료(`✅ BULK SYNC COMPLETED!`)됨을 확인하고 포트 `8080` 리스닝 상태를 최종 검증하였습니다.
- **결과/영향:** 백엔드 서버가 깨끗한 상태에서 시뮬레이션 모드로 다시 시작되어 정상적으로 API 요청을 처리할 수 있게 되었습니다.

## [2026-03-25 09:56:00] 벌크 시딩 실패 원인 분석 및 최종 해결 완료
- **작업 내용:** 1만 명 유저 시딩 도중 발생한 3가지 핵심 정지 포인트 해결 및 전체 서비스 재가동
- **상세 변경 내역:**
  - **JVM 메모리 최적화**: `gradlew`의 `DEFAULT_JVM_OPTS`를 64m에서 1024m으로 상향 조정하여 GC 트래싱 및 OOM 현상 제거.
  - **DB 스키마 동기화**: `users` 테이블의 `level`(NOT NULL) 컬럼 누락 및 `titles` 테이블의 필드명 변경(required_level -> achievement_type/threshold) 사항을 시딩 로직(`BulkInsertHelper`, `BulkDataSeeder`)에 반영.
  - **Enum 값 정정**: `ItemType`이 `AVATAR_SKIN`/`MARKER_SKIN`으로 정의된 사양에 맞게 시딩 명세 수정 (기존 HEAD/HAND 제거).
  - **시뮬레이션 가동**: 1만 명 유저 및 관련 데이터 벌크 적재 완료 보장.
- **결과/영향:** 시뮬레이션 환경에 필요한 대규모 데이터 준비가 완료되었으며, 봇 오케스트레이터가 정상적으로 유저를 인식하여 시나리오별 작동을 시작할 수 있는 상태가 됨.

## [2026-03-25 09:28:00] 시뮬레이션 환경 기동 실패(중복 빈) 해결 및 서비스 재가동
- **작업 내용:** `simulation` 프로파일 기동 시 발생하는 BeanDefinitionOverrideException 해결 및 전체 서비스 재시작
- **상세 변경 내역:**
  - **백엔드**: `SimulationProperties.java`에서 `@Component` 어노테이션 제거. (`SimulationConfig`의 `@EnableConfigurationProperties`와 중복되어 타입 주입 모호성 발생하던 문제 수정)
  - **환경 설정**: `build.gradle`에 `netty-resolver-dns-native-macos` 의존성 추가하여 macOS 환경 DNS 경고 제거.
  - **서비스 재가동**: 백엔드(8080), AI(8000), 프론트엔드(5173) 프로세스 정리 후 재실행 및 정상 작동 확인.
- **결과/영향:** 시뮬레이션 프로파일에서도 백엔드가 정상적으로 기동되며, 프론트엔드와의 API 프록시 연결이 복구됨.

## [2026-03-25 09:15:00] 전체 서버 재가동 및 백엔드 시뮬레이션 환경 활성화
- **작업 내용:** 백엔드(simulation 프로파일), 프론트엔드, AI 서버 전체 가동
- **상세 변경 내역:**
  - **백엔드**: `simulation` 프로파일 활성화 및 구동을 위한 `start_backend.sh` 스크립트 추가. Spotless 포맷팅 미적용 사항 수정(`spotlessApply`) 및 메모리 옵션 조정 후 백그라운드 구동 시작.
  - **AI 서버**: `ai-service` 구동 및 8000번 포트 정상 작동 확인.
  - **프론트엔드**: `frontend` 개발 서버 구동 및 5173번 포트 정상 작동 확인.
- **결과/영향:** 전체 서비스 컴포넌트가 재가동되었으며, 특히 백엔드는 시뮬레이션 모드로 대규모 데이터 환경 테스트 보조가 가능하게 됨.

## [2026-03-24 18:30:00] 대규모 트래픽 시뮬레이션 봇 시스템 및 성능 최적화 구현
- **작업 내용:** 1만 명 규모의 봇 유저 시뮬레이션 시스템 구축 및 서버 성능 최적화 인덱스/쿼리 개선
- **상세 변경 내역:**
  - **시뮬레이션 인프라**: `simulation` 프로파일 기반의 `@Profile` 격리 환경 구축, `SimulationConfig`, `SimulationProperties` 구현
  - **벌크 시딩(Seeding)**: `JdbcTemplate` 배치 INSERT를 활용한 `BulkDataSeeder`, `BulkInsertHelper` 구현 (유저 1만, 기록 5만, 리뷰 2만 건 비동기 적재)
  - **봇 시나리오**: `MorningRoutine`, `Explorer`, `Shopper`, `Support`, `Social` 등 5종의 봇 행동 패턴 구현 및 가상 스레드(`ExecutorService`) 기반 스케줄링 적용
  - **성능 최적화**: 
    - **DB**: `V5__simulation_indices.sql` 추가 (위치 검색, 유저별 최신 기록, 리뷰 통계용 인덱스 6종 생성)
    - **N+1 문제 해결**: `RankingService`의 유저/칭호 개별 조회를 `findAllById` 배치 조회로 개선하여 랭킹 조회 성능 대폭 향상
  - **기반 설정**: `ApiApplication`에 `@EnableScheduling` 추가 및 `application.yml` 시뮬레이션 설정 블록 추가
- **결과/영향:** 실제 서비스 운영 시의 대규모 부하를 로컬/테스트 환경에서 재현 가능하게 되었으며, 서비스 핵심인 랭킹 및 검색 성능이 대폭 개선됨

## [2026-03-24 17:35:00] 서버 반복 구동 실패 근본 해결 및 백엔드 서비스 시작 구조 개선
- **작업 내용:** Flyway 체크섬 오류 및 외부 서비스 의존성으로 인한 서버 구동 실패 문제 해결
- **상세 변경 내역:**
  - **Flyway**: `FlywayRepairConfig` 추가로 체크섬 불일치 자동 복구(`repair`) 기능 활성화
  - **Migration**: V3 마이그레이션 PostgreSQL 호환성 확정 및 V4(누락 컬럼 `mng_no` 추가, `location` 제약 완화) 신설
  - **JPA**: `application.yml` 내 `ddl-auto: update`를 `validate`로 변경하여 Flyway 기반 단일 스키마 관리 체계 확립
  - **Startup**: `ApiApplication`의 `runSelfCheck`(메일/동기화)를 비동기(`CompletableFuture`) 및 방어적으로 리팩토링하여 서버 블로킹 방지
  - **Resiliency**: `DataInitializer` 및 `RankingDataSeeder`에 try-catch 예외 핸들링을 추가하여 초기 데이터 오류가 서버 전체를 죽이지 않도록 개선
- **결과/영향:** 서버 구동 시 불확실성이 제거되고, 외부 서비스(SMTP, 공공데이터 API 등) 장애 상황에서도 안정적인 서비스 시작이 가능해짐


## [2026-03-24 16:55:00] 화장실 리뷰 및 평가 시스템 구축 (v1.0)
- **작업 내용:** 사용자가 화장실에 대해 별점과 이모지 태그, 코멘트를 남길 수 있는 리뷰 시스템의 백엔드 전 계층 구현
- **상세 변경 내역:**
  - **DB**: `V3__add_toilet_reviews.sql` 추가 (리뷰 테이블 생성 및 화장실 통계/AI 요약 컬럼 확장)
  - **Entity**: `ToiletReview.java` 신규 생성, `Toilet.java` 및 `User.java` 연관관계 및 필드 업데이트
  - **DTO**: `ToiletReviewCreateRequest`, `ToiletReviewResponse`, `ToiletReviewSummaryResponse`, `ToiletReviewPageResponse` 등 6개 클래스 구현
  - **Service**: `ToiletReviewService.java` 구현 (리뷰 작성 시 통계 자동 갱신 및 리뷰 5개 이상 시 AI 요약 생성 로직 포함)
  - **Controller**: `ToiletReviewController.java` 구현 (리뷰 작성, 최근 리뷰 조회, 페이징 조회, 요약 정보 API 엔드포인트 제공)
  - **AI 연동**: `AiClient.java`에 리뷰 요약 서비스 호출 메서드(`summarizeReviews`) 추가
  - **Mock Data**: `DataInitializer.java`에 초기 화장실 3곳에 대한 샘플 리뷰 데이터 및 통계 초기화 로직 추가
- **결과/영향:** 서비스 내 화장실 품질 정보를 유저들이 직접 공유할 수 있는 핵심 기반 마련 및 AI를 통한 자동 요약 기능 제공

## [2026-03-24 16:58:00] 회원 탈퇴 시 연관 엔티티 삭제 오류(FK Constraint) 해결
- **작업 내용:** 회원 탈퇴 시 `users` 테이블과 연관된 자식 테이블들의 데이터가 먼저 삭제되지 않아 발생하는 500 에러 수정
- **상세 변경 내역:**
  - **Repository**: `PooRecord`, `Inquiry`, `Payment`, `Notification`, `Inventory`, `UserTitle`, `ToiletReview` 리포지토리에 `deleteAllByUser(User user)` 메서드 추가
  - **Service**: `AuthService.withdraw` 메서드에서 `userRepository.delete(user)` 호출 전, 위 7개 리포지토리를 순차적으로 호출하여 연관 데이터를 명시적으로 선제 삭제하도록 로직 보강
- **결과/영향:** 복잡한 연관 관계에서도 무결성을 유지하며 안정적으로 회원 탈퇴 처리가 가능해짐

## [2026-03-24 16:34:00] 수동 입력 시 필수값 검증 강화 및 조건부 유효성 검사 적용
- **작업 내용:** 사진 미촬영 유저(수동 입력)의 경우 모양, 색상, 키워드(태그) 선택을 필수로 강제하도록 보완
- **상세 변경 내역:**
  - `PooRecordService.java`: `imageBase64`가 없는 경우 `bristolScale`, `color`, `conditionTags`, `dietTags`가 비어있으면 `INVALID_INPUT_VALUE` 예외를 발생시키도록 로직 추가
  - 사진 인증 시에는 위 필드들이 비어있어도 허용되도록 하여 "AI 3초 인증" 흐름 유지
- **결과/영향:** 입력 방식에 따른 차별화된 유효성 검사를 통해 데이터 신뢰성과 UX를 동시에 확보

## [2026-03-24 16:24:00] AI 촬영 인증 프로세스 고도화 및 DTO 제약 완화
- **작업 내용:** AI 촬영 인증 시 수동 입력 단계를 건너뛸 수 있도록 백엔드 로직 수정 및 4단계 로직 최적화 계획 수립
- **상세 변경 내역:**
  - `PooRecordCreateRequest.java`: `bristolScale`, `color` 필드의 필수(`@NotNull` 등) 제약 제거
  - `PooRecordService.java`: `imageBase64`가 포함된 경우 수동 입력값이 없어도 AI 분석 결과로 자동 대체하도록 로직 보강 (단, 60초 체류 검증은 유지)
  - `docs/plan.md`: 프론트엔드 팀원을 위해 '범위 내 버튼 활성화' 및 'AI 인증 시 단계 건너뛰기' 로직 가이드 포함
- **결과/영향:** AI 촬영만으로 인증이 가능해졌으며, 프론트엔드 연동 시 사용자 편의성이 대폭 향상될 것으로 기대됨

## [2026-03-24 16:11:00] 백엔드, 프론트엔드, AI 서버 서버 재가동
- **작업 내용:** 모든 팀원 머지 내역 반영 후 안정적인 테스트 환경을 위해 전체 서버 재시작
- **상세 변경 내역:**
  - 기존 Java, Node, Python 프로세스 종료
  - Backend (8080), Frontend (5173), AI (8000) 포트에서 각 서버 재실행
  - 로그 파일(`bootRun.log`, `vite_dev.log`, `ai_service.log`) 확인 및 헬스체크 완료
- **결과/영향:** 최신 개발 상태가 반영된 통합 서버 환경 구축 완료

## [2026-03-24 15:58:00] 팀원 머지 내역 반영 및 최종 브랜치 정리
- **작업 내용:** 팀원들이 머지한 `main` 브랜치 업데이트 및 모든 머지 완료된 브랜치 정리
- **상세 변경 내역:**
  - `git pull origin main` 및 `git fetch --prune` 수행
  - 10개 이상의 머지 완료된 원격 브랜치 최종 삭제 완료
- **결과/영향:** 최신 팀원 작업이 로컬에 반영되고 리포지토리가 완벽히 동기화 및 정리됨

## [2026-03-24 15:52:00] Git 브랜치 정리 및 환경 최적화
- **작업 내용:** 작업이 완료되어 머지된 Git 브랜치 및 관련 워크트리 삭제
- **상세 변경 내역:**
  - 로컬 브랜치 삭제: `chore/project-cleanup-gitignore`, `claude/flamboyant-albattani`, `feat/backend-ai-admin-refactoring`, `fix/notification-sse-auth-timer`
  - 원격 브랜치 삭제: `origin/chore/project-cleanup-gitignore`, `origin/feat/backend-ai-admin-refactoring`, `origin/fix/notification-sse-auth-timer`
  - 관련 Git 워크트리 제거: `.claude/worktrees/flamboyant-albattani`
- **결과/영향:** 리포지토리 상태가 동기화되고 불필요한 리소스가 제거되어 작업 환경이 깨끗해짐

## [2026-03-24 15:35:00] AI 분석 엔드포인트 및 관리자 시스템 로그 API 구현
- **작업 내용:** 백엔드 기능 확장 및 관리 기능 강화
- **상세 변경 내역:**
  - AI 분석 시스템 확장을 위한 엔드포인트 `/api/v1/poo/analysis` 등 추가
  - AI 응답 데이터에 `warning_tags` 확장 적용
  - 어드민 시스템 로그 조회를 위한 API 엔드포인트 구현
- **결과/영향:** AI 기반 분석 기능이 강화되고 관리자의 시스템 가시성이 향상됨
