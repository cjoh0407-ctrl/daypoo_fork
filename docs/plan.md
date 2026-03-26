# 화장실 공공데이터 동기화 Upsert 전환 계획

## Context

현재 `PublicDataSyncService`는 `mng_no` 기준으로 신규 데이터만 INSERT하고, 기존 데이터의 변경사항(이름, 주소, 개방시간 등)은 반영하지 않음. 매일 새벽 3시 스케줄러가 돌아도 공공데이터의 변경사항이 DB에 누적되지 않는 문제가 있음.

PostgreSQL의 `ON CONFLICT (mng_no) DO UPDATE` 문법으로 upsert 전환하여 신규 삽입과 변경 업데이트를 한 번에 처리.

**중요 원칙**: 공공데이터로 덮어쓰면 안 되는 유저 생성 데이터(`avg_rating`, `review_count`, `ai_summary`)는 UPDATE 대상에서 제외.

---

## 변경 대상 파일

- `backend/src/main/java/com/daypoo/api/service/PublicDataSyncService.java`

이 파일 하나만 수정하면 됨. DB 스키마 변경 없음 (`mng_no`의 UNIQUE 제약이 이미 V4 마이그레이션에서 추가되어 있음).

---

## 구체적인 변경 내용

### 1. `bulkInsertToilets()` SQL 변경

**현재 (insert-only):**
```sql
INSERT INTO toilets (name, mng_no, location, address, open_hours, is_24h, is_unisex, created_at, updated_at)
VALUES (?, ?, ST_GeomFromText(?, 4326), ?, ?, ?, ?, ?, ?)
```

**변경 후 (upsert):**
```sql
INSERT INTO toilets (name, mng_no, location, address, open_hours, is_24h, is_unisex, created_at, updated_at)
VALUES (?, ?, ST_GeomFromText(?, 4326), ?, ?, ?, ?, NOW(), NOW())
ON CONFLICT (mng_no) DO UPDATE SET
  name        = EXCLUDED.name,
  location    = EXCLUDED.location,
  address     = EXCLUDED.address,
  open_hours  = EXCLUDED.open_hours,
  is_24h      = EXCLUDED.is_24h,
  is_unisex   = EXCLUDED.is_unisex,
  updated_at  = NOW()
```

**UPDATE 제외 필드 (이유):**
- `id` — PK, 절대 변경 불가
- `created_at` — 최초 등록일 보존
- `avg_rating`, `review_count` — 유저가 작성한 후기 집계값
- `ai_summary` — AI가 생성한 요약 (재생성 비용 있음)

### 2. `syncPage()` 내 중복 필터링 로직 제거

**현재:** 페이지의 `mng_no` 목록을 DB에서 조회 후, 기존 항목은 건너뜀
```java
List<String> existingMngNos = toiletRepository.findAllMngNoIn(mngNosInPage);
Set<String> existingSet = new HashSet<>(existingMngNos);
List<Toilet> toiletsToSave = convertToToiletEntities(itemList, existingSet);
```

**변경 후:** 필터링 없이 모든 항목을 upsert에 넘김
```java
List<Toilet> toilets = convertToToiletEntities(itemList);
// existingSet 체크 불필요 — ON CONFLICT가 처리
```

### 3. `convertToToiletEntities()` 시그니처 변경

`existingSet` 파라미터 제거. 기존 `if (existingSet.contains(mngNo)) continue;` 라인 삭제.

---

## 동작 결과

| 케이스 | 기존 | 변경 후 |
|--------|------|---------|
| 신규 화장실 | INSERT | INSERT |
| 기존 화장실 (변경 없음) | 스킵 | UPDATE (값 동일하므로 실질적 변화 없음) |
| 기존 화장실 (이름/주소 변경) | 스킵 (반영 안 됨) | UPDATE (반영됨) |
| 후기/평점 | 유지 | 유지 (UPDATE 대상 아님) |
| 즐겨찾기/방문기록 | 유지 | 유지 (toilet.id 불변) |

---

## 검증 방법

1. 백엔드 빌드 확인: `./gradlew build`
2. 관리자 페이지 → 화장실 관리 → **공공데이터 동기화** 실행
3. 특정 화장실 이름/주소를 수동으로 DB에서 임시 변경 후 동기화 → 원래 값으로 복원되는지 확인
4. 해당 화장실의 후기/즐겨찾기가 동기화 후에도 유지되는지 확인
5. 스케줄러 로그 확인: 기존과 동일한 완료 메시지 출력되는지
