# 기능 수정 계획: 공공데이터 동기화 비동기 전환 및 상태 폴링 도입

## 1. 개요
공공데이터 동기화 작업이 대량의 데이터를 처리할 때 HTTP 타임아웃을 유발하는 문제를 해결하기 위해, 작업을 비동기로 전환하고 클라이언트가 진행 상태를 확인할 수 있는 폴링 구조를 도입합니다.

## 2. 작업 목표
- 백엔드 동기화 로직을 `@Async`를 이용해 비동기로 실행합니다.
- 동기화 진행 상태(IDLE, RUNNING, COMPLETED, FAILED)를 추적하고 반환하는 API를 제공합니다.
- 프론트엔드 수정 없이 백엔드 명세만 우선적으로 완성합니다.

## 3. 대상 파일
1. `backend/src/main/java/com/daypoo/api/dto/SyncStatusResponse.java` (신규)
2. `backend/src/main/java/com/daypoo/api/service/PublicDataSyncService.java`
3. `backend/src/main/java/com/daypoo/api/controller/AdminController.java`
4. `docs/backend-modification-history.md` (수정 이력 기록)

## 4. 상세 변경 내역

### 4.1. SyncStatusResponse.java (신규)
- `status`, `totalCount`, `startedAt`, `completedAt`, `errorMessage` 필드를 포함하는 record 생성.

### 4.2. PublicDataSyncService.java
- `syncStatus`, `lastCount`, `startedAt`, `completedAt`, `errorMessage` 필드를 `volatile`로 추가하여 상태를 관리합니다.
- `@Async("taskExecutor")`가 적용된 `syncAllToiletsAsync` 메서드를 추가합니다.
- 현재 상태를 반환하는 `getSyncStatus()` 메서드를 추가합니다.

### 4.3. AdminController.java
- `@PostMapping("/sync-toilets")`: `syncService.syncAllToiletsAsync`를 호출하고 `202 Accepted`를 반환하도록 수정합니다. (이미 실행 중일 경우 `409 Conflict` 반환)
- `@GetMapping("/sync-toilets/status")`: 현재 동기화 상태를 반환하는 엔드포인트를 추가합니다.

## 5. 작업 프로세스
1. [x] 신규 브랜치 `feature/async-toilet-sync` 생성
2. [x] `SyncStatusResponse.java` 생성
3. [x] `PublicDataSyncService.java` 수정 (비동기 로직 및 상태 관리)
4. [x] `AdminController.java` 수정 (엔드포인트 연동)
5. [x] 수정 이력(`docs/backend-modification-history.md`) 업데이트
6. [x] 컴파일 오류 여부 확인 (`./gradlew compileJava`)
7. [x] 작업 완료 보고

## 6. 기대 효과
- 긴 실행 시간을 가진 동기화 작업이 HTTP 연결을 점유하지 않아 타임아웃 에러를 방지할 수 있습니다.
- 관리자가 실시간으로 동기화 진행 상황과 결과를 확인할 수 있습니다.
