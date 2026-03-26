# 공공데이터 동기화 비동기 + 폴링 전환 계획

## Context

`POST /admin/sync-toilets?startPage=1&endPage=500` 엔드포인트가 동기(blocking) 방식으로
구현되어 있어 HTTP 응답을 2~3분간 붙잡고 있음. Tomcat 기본 타임아웃(30초)이 먼저 발동해
프론트에서 에러가 발생.

**해결 방향**: 버튼 클릭 시 즉시 202 응답 후 백그라운드에서 동기화 실행 + 프론트가 3초마다
상태를 폴링해 완료/실패 여부를 확인.

`AsyncConfig`(`backend/src/main/java/com/daypoo/api/global/config/AsyncConfig.java`)에
`@EnableAsync`와 `taskExecutor` 빈이 이미 존재해 `@Async` 즉시 사용 가능.

---

## 변경 대상 파일

| 파일 | 작업 |
|------|------|
| `backend/.../service/PublicDataSyncService.java` | `@Async` 메서드 추가 + 상태 추적 필드 |
| `backend/.../controller/AdminController.java` | 엔드포인트 비동기 전환 + 상태 조회 엔드포인트 추가 |
| `backend/.../dto/SyncStatusResponse.java` | 신규 DTO |
| `frontend/src/pages/AdminPage.tsx` | 폴링 로직 추가 |

---

## Phase 1: 백엔드

### 1-1. `SyncStatusResponse` DTO 생성
파일: `backend/src/main/java/com/daypoo/api/dto/SyncStatusResponse.java`

```java
@Builder
public record SyncStatusResponse(
    String status,        // "IDLE" | "RUNNING" | "COMPLETED" | "FAILED"
    Integer totalCount,   // 완료 시 신규 등록 건수 (진행 중엔 null)
    String startedAt,     // 시작 시각
    String completedAt,   // 완료 시각 (진행 중엔 null)
    String errorMessage   // 실패 시 에러 메시지
) {}
```

### 1-2. `PublicDataSyncService` 상태 추적 + `@Async` 메서드 추가

기존 `syncAllToilets()` 유지. 아래를 추가:

```java
// 상태 추적 필드 (싱글턴 빈이므로 안전)
private volatile String syncStatus = "IDLE";
private volatile Integer lastCount = null;
private volatile String startedAt = null;
private volatile String completedAt = null;
private volatile String errorMessage = null;

// 상태 조회 메서드
public SyncStatusResponse getSyncStatus() {
    return SyncStatusResponse.builder()
        .status(syncStatus)
        .totalCount(lastCount)
        .startedAt(startedAt)
        .completedAt(completedAt)
        .errorMessage(errorMessage)
        .build();
}

// 비동기 실행 메서드 (기존 syncAllToilets 재사용)
@Async("taskExecutor")
public void syncAllToiletsAsync(int startPage, int endPage) {
    syncStatus = "RUNNING";
    startedAt = LocalDateTime.now().toString();
    completedAt = null;
    errorMessage = null;
    lastCount = null;
    try {
        int count = syncAllToilets(startPage, endPage);
        lastCount = count;
        syncStatus = "COMPLETED";
        completedAt = LocalDateTime.now().toString();
    } catch (Exception e) {
        syncStatus = "FAILED";
        errorMessage = e.getMessage();
        completedAt = LocalDateTime.now().toString();
    }
}
```

### 1-3. `AdminController` 엔드포인트 수정

```java
// 변경: 즉시 202 응답 (중복 실행 방지 포함)
@PostMapping("/sync-toilets")
public ResponseEntity<String> syncToilets(int startPage, int endPage) {
    if ("RUNNING".equals(syncService.getSyncStatus().status())) {
        return ResponseEntity.status(409).body("이미 동기화가 진행 중입니다.");
    }
    syncService.syncAllToiletsAsync(startPage, endPage);
    return ResponseEntity.accepted().body("동기화가 시작되었습니다.");
}

// 추가: 상태 조회
@GetMapping("/sync-toilets/status")
public ResponseEntity<SyncStatusResponse> getSyncStatus() {
    return ResponseEntity.ok(syncService.getSyncStatus());
}
```

---

## Phase 2: 프론트엔드

`ToiletsView` 컴포넌트 (`frontend/src/pages/AdminPage.tsx` 내부) 수정.

### 2-1. 상태 변수 추가

```typescript
const [syncResult, setSyncResult] = useState<string | null>(null);
const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
```

### 2-2. `handleSyncToilets` 변경

```typescript
const handleSyncToilets = async () => {
    if (syncing) return;
    const confirmed = confirm(...);
    if (!confirmed) return;

    setSyncing(true);
    setSyncResult(null);
    try {
        await api.post('/admin/sync-toilets?startPage=1&endPage=500');
        startPolling(); // 202 받으면 폴링 시작
    } catch (error: any) {
        setSyncing(false);
        alert('동기화 시작 실패: ' + (error.message || '오류가 발생했습니다.'));
    }
};
```

### 2-3. 폴링 함수 추가

```typescript
const startPolling = () => {
    pollingRef.current = setInterval(async () => {
        try {
            const status = await api.get('/admin/sync-toilets/status');
            if (status.status === 'COMPLETED') {
                clearInterval(pollingRef.current!);
                setSyncing(false);
                setSyncResult(`동기화 완료! 신규 등록: ${status.totalCount}건`);
                refetch();
            } else if (status.status === 'FAILED') {
                clearInterval(pollingRef.current!);
                setSyncing(false);
                alert('동기화 실패: ' + status.errorMessage);
            }
        } catch {
            clearInterval(pollingRef.current!);
            setSyncing(false);
        }
    }, 3000);
};
```

### 2-4. 언마운트 시 폴링 정리

```typescript
useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
}, []);
```

### 2-5. 완료 메시지 UI

버튼 아래 `syncResult` 표시:
```tsx
{syncResult && (
    <p className="text-xs font-bold text-[#1B4332] mt-2">{syncResult}</p>
)}
```

---

## 검증 방법

1. `./gradlew compileJava` — 빌드 오류 없음 확인
2. 관리자 페이지 → 화장실 관리 → **공공데이터 동기화** 클릭
3. 즉시 "동기화 중..." 스피너로 전환, 에러 없음 확인
4. 브라우저 DevTools → 3초마다 `GET /admin/sync-toilets/status` 요청 확인
5. 완료 후 "동기화 완료! 신규 등록: N건" 메시지 표시 확인
6. 동기화 중 재클릭 시 409 응답 확인
