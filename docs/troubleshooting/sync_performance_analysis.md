# 🔍 공공데이터 동기화 성능 병목 분석 보고서

> 대상: [PublicDataSyncService.java](file:///Users/changjun/Desktop/project/daypoo/backend/src/main/java/com/daypoo/api/service/PublicDataSyncService.java)

---

## 📊 현재 아키텍처 요약

| 항목 | 현재 설정 |
|------|---------|
| 병렬 전략 | 가상 스레드 + CompletableFuture |
| 동시 요청 제한 | Semaphore(15) |
| 페이지 크기 | 500건/페이지 |
| 대상 페이지 | 1 ~ 1,000 (약 50만 건) |
| DB 삽입 | JdbcTemplate batchUpdate |
| 중복 체크 | [findAllMngNoIn()](file:///Users/changjun/Desktop/project/daypoo/backend/src/main/java/com/daypoo/api/repository/ToiletRepository.java#36-38) (JPA IN 절) |
| Redis 저장 | Bulk `GEOADD` |

---

## 🚨 발견된 병목 및 문제점 (심각도순)

### 1. ❌ [치명적] 중복 체크 쿼리가 페이지마다 DB를 때림
```java
// 129번째 줄 — 매 페이지(500건 단위)마다 IN 쿼리 실행
List<String> existingMngNos = toiletRepository.findAllMngNoIn(mngNosInPage);
```
- **문제**: 15개 가상 스레드가 동시에 DB에 `SELECT ... WHERE mng_no IN (500개)` 쿼리를 보냄
- **영향**: HikariCP 풀(20개)의 대부분이 중복 체크 쿼리에 점유됨 → **DB Connection 고갈**
- **증거**: 풀 크기(20) 대비 동시 요청(15)이 근접하여, 중복체크 + INSERT가 겹치면 대기(waiting) 발생

### 2. ❌ [치명적] DB 커넥션 풀 vs 동시 요청 수 미스매치
```yaml
# application.yml
hikari:
  maximum-pool-size: 20
```
- **문제**: Semaphore가 15이므로, 최대 15개 스레드가 **동시에** DB 접근
- 각 스레드가 실행하는 작업: ① [findAllMngNoIn()](file:///Users/changjun/Desktop/project/daypoo/backend/src/main/java/com/daypoo/api/repository/ToiletRepository.java#36-38) → ② `batchUpdate()` → ③ Redis `GEOADD`
- ①, ② 각각 커넥션을 사용하므로, 최악의 경우 **30개 커넥션**이 필요하지만 풀은 20개
- **결과**: `connectionTimeout(30초)` 내에 커넥션을 못 얻으면 **예외 발생** 및 대기 지연

### 3. ⚠️ [중요] 트랜잭션 없이 batchUpdate 실행
```java
// 173번째 줄
jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() { ... });
```
- **문제**: `@Transactional` 없이 batchUpdate 호출 → 각 INSERT 문마다 **auto-commit**
- **영향**: `reWriteBatchedInserts=true`의 진짜 효과(Multi-statement를 한 번에 전송)를 **발휘하지 못함**
- PostgreSQL JDBC 드라이버는 **하나의 트랜잭션 안에서** 배치가 실행되어야 multi-row INSERT로 변환함

### 4. ⚠️ [중요] WebClient URI 구성 비효율
```java
// 93~104번째 줄
webClient.get().uri(uriBuilder -> {
    UriComponents uriComponents = UriComponentsBuilder.fromHttpUrl(apiUrl)
        .queryParam("serviceKey", apiKey)
        // ...
        .build();
    return uriComponents.toUri();  // ← uriBuilder를 무시하고 직접 빌드
})
```
- **문제**: WebClient의 `uri()` 콜백에서 제공된 `uriBuilder`를 무시하고 별도로 `UriComponentsBuilder` 생성
- **부작용**: WebClient의 baseUrl 설정이 있다면 무시됨. 또한 매 호출마다 불필요한 객체 생성

### 5. ⚠️ [중요] 공공 API의 serviceKey 인코딩 이슈 가능성
- 공공데이터포털의 `serviceKey`는 이미 URL-encoded 형태로 제공되는 경우가 많음
- `UriComponentsBuilder.build()`는 기본적으로 인코딩을 수행하므로, **이중 인코딩**이 발생할 수 있음
- 이로 인해 API가 `401 Unauthorized` 또는 `SERVICE_KEY_IS_NOT_REGISTERED_ERROR`를 응답할 수 있음

### 6. 💡 [개선] 진행 상황 모니터링 부재
- 1,000페이지 중 어디까지 처리되었는지, 실패 통계가 없음
- 장시간 작업 시 현재 상태 파악이 불가능

### 7. 💡 [개선] Retry 간격이 고정(2초)
```java
.retryWhen(Retry.fixedDelay(3, Duration.ofSeconds(2)))
```
- 공공 API 서버가 과부하일 때 고정 딜레이는 비효율적
- **Exponential Backoff**를 사용하면 서버 부하 시 더 효과적

---

## 🎯 개선 우선순위 제안

| 순위 | 항목 | 예상 개선 효과 |
|:---:|------|-------------|
| 1 | batchUpdate를 트랜잭션으로 감싸기 | **DB 쓰기 5~10배 향상** |
| 2 | 커넥션 풀 사이즈 조정 (30~40) 또는 Semaphore 축소 (10) | **커넥션 대기 제거** |
| 3 | 중복 체크를 DB 대신 로컬 Set으로 사전 로딩 | **DB 읽기 부하 90% 감소** |
| 4 | WebClient URI 빌드 수정 + 인코딩 이슈 해결 | API 호출 안정성 확보 |
| 5 | 진행률 로깅 추가 | 운영 가시성 향상 |
| 6 | Retry를 Exponential Backoff로 변경 | 장애 시 회복 탄력성 향상 |

---

> [!IMPORTANT]
> **가장 큰 병목은 "트랜잭션 없는 batchUpdate"와 "매 페이지마다 DB 중복 체크"입니다.**
> 이 두 가지만 해결해도 체감 속도가 5~10배 향상될 수 있습니다.
