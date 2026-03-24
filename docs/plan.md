# DayPoo 대규모 트래픽 시뮬레이션 봇 시스템 구현 계획

## 1. 개요
현재의 개발 초기 단계에서 실제 서비스 운영 시 발생할 대규모 트래픽을 시뮬레이션하고 성능 병목을 확인하기 위해 가상 유저(Bot) 시스템을 구축합니다. 이 과정에서 성능 최적화를 위한 인덱스 추가와 N+1 문제 해결도 함께 진행합니다.

## 2. 세부 구현 단계

### Phase 1: 기반 인프라 및 환경 설정
- **Flyway 마이그레이션 (`V5__simulation_indices.sql`)**: 시뮬레이션 및 데이터 집계를 위한 성능 최적화 인덱스 생성.
- **`application.yml` 수정**: `simulation` 프로파일 설정 추가 및 `reWriteBatchedInserts=true` 확인.
- **`ApiApplication.java` 수정**: `@EnableScheduling` 어노테이션 추가.
- **설정 클래스 구현**: `SimulationConfig.java`, `SimulationProperties.java` 작성.

### Phase 2: 데이터 시딩(Seeding) 시스템 구축
- **`SeedDataGenerator.java`**: 한국어 기반의 랜덤 유저/기록 데이터 생성 유틸리티.
- **`BulkInsertHelper.java`**: `JdbcTemplate`을 활용한 고속 배치 INSERT 로직 구현.
- **`BulkDataSeeder.java`**: 서버 기동 시 비동기로 벌크 데이터를 적재하는 오케스트레이터.

### Phase 3: 시뮬레이션 봇 및 시나리오 구현
- **`BotUserPool.java`**: 봇 활동에 필요한 ID 풀(유저, 화장실, 아이템 등) 캐싱.
- **시나리오 인터페이스 및 클래스**:
    - `BotScenario.java` (인터페이스)
    - `MorningRoutineScenario.java`
    - `ExplorerScenario.java`
    - `ShopperScenario.java`
    - `SupportScenario.java`
    - `SocialScenario.java`
- **`BotOrchestrator.java`**: 스케줄러를 통한 시나리오별 봇 활동 디스패치.

### Phase 4: 기존 기능 최적화 및 모니터링
- **`RankingService.java`**: N+1 쿼리 최적화 및 로컬 캐시 적용.
- **`SimulationMetrics.java`**: 성공/실패 횟수 등 활동 지표 추적.
- **테스트**: `simulation` 프로파일 활성화 시 정상 동작 여부 및 멱등성 검증.

## 3. 완료 조건
- `simulation` 프로파일로 구동 시 10,000명의 봇 유저와 관련 데이터가 정상적으로 시딩됨.
- 정의된 스케줄에 따라 봇들이 API 서비스를 호출하며 로그를 생성함.
- `EXPLAIN ANALYZE` 등을 통해 추가된 인덱스가 정상적으로 작동함을 확인.
- 프로덕션(Main/Dev) 프로파일에서는 봇 시스템이 전혀 가동되지 않음.
- `docs/backend-modification-history.md`에 모든 변경 사항이 기록됨.

---
[✅ 규칙을 잘 수행했습니다.]
