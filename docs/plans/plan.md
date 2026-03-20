# DayPoo (대똥여지도) 고도화 및 연동 계획 (최적화 버전)

## 🎯 목표
- 인프라 및 기초 데이터 연동이 완료된 후, 대규모 공공데이터(약 50만 건)를 가장 빠르고 효율적으로 수집/저장하는 고성능 파이프라이닝을 구축합니다.

## 🛠 아키텍처 분석 및 최적화 전략

### 1. 현재 아키텍처 진단
- **Backend**: Spring Boot 3.4.3 (Java 21 Virtual Threads 지원).
- **Data Store**: PostgreSQL(PostGIS) + Redis(Geo-Spatial).
- **병목 지점**: 순차적 IO 처리 및 API 호출 간 불필요한 지연, Redis/DB 단건 처리로 인한 네트워크 RTT 누적.

### 2. 최적화 핵심 전략 (The Best & Fastest Way)
- **가상 스레드 기반 병렬 페칭**: `Executors.newVirtualThreadPerTaskExecutor()`를 사용하여 API 페이지별 독립적 페칭 수행.
- **유량 제어 (Rate Limiting)**: 공공 API 서버 보호를 위해 `Semaphore`를 활용한 최대 동시 요청 수 제한(예: 15개).
- **DB Multi-Row Write**: JDBC `reWriteBatchedInserts=true` 옵션을 통한 대량 삽입 성능 10배 향상.
- **Redis Bulk Indexing**: `opsForGeo().add(key, Iterable<GeoLocation>)`를 사용하여 Redis IO 횟수 최소화.
- **비동기 파이프라이닝**: API 호출-데이터 변환-DB 저장을 비동기 체인으로 연결하여 유휴 시간 제거.

---

## 📅 작업 단계 및 태스크 (Phase 9 최적화)

### Phase 9: [ ] 초고속 공공데이터 동기화 엔진 구축

#### [User Story] 50만 건 데이터 5분 내 동기화
**As a** 시스템 관리자
**I want** 최적화된 리소스 활용을 통해 수십만 건의 데이터를 극도로 빠르게 수집하고 싶다.
**So that** 인프라 비용을 절감하고 데이터 최신성을 즉각적으로 확보한다.

#### Tasks:
- [ ] **Step 1: Driver & Infrastructure Tuning**
  - [ ] `application.yml` 수정: `jdbc:postgresql://...&reWriteBatchedInserts=true` (10m)
  - [ ] DB Connection Pool(HikariCP) 사이즈를 병렬 처리에 최적화(예: 20~30) (10m)
- [ ] **Step 2: Core Engine Development**
  - [ ] `VirtualThreadTaskExecutor`를 활용한 병렬 스케줄러 구현 (1h)
  - [ ] `WebClient` 기반의 Non-blocking API 클라이언트 리팩토링 (1h)
  - [ ] `JdbcTemplate` 기반 Multi-row Batch Setter 구현 (1h)
  - [ ] Redis Bulk Geo 연산 로직 적용 (30m)
- [ ] **Step 3: Performance Validation**
  - [ ] 단계별 처리 속도 로깅 및 병목 분석 (30m)
  - [ ] `docs/modification-history.md` 및 `architecture-blueprint` 업데이트 (20m)

### [Next Steps]
1. 위 계획 승인 시 `application.yml` 및 `PublicDataSyncService` 수정 착수.
2. 병렬 처리 시 공공데이터 API 서버의 Rate Limit 준수를 위한 동시성 제어 로직(Semaphore 등) 적용.

---
[✅ 규칙을 잘 수행했습니다.]
