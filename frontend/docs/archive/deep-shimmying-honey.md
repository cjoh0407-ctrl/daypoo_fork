# 방문 인증 UX 개선 플랜

## Context
두 가지 문제:
1. 방문인증 직후 "후기 남기기" 누르면 "방문 인증 후에만 리뷰를 남길 수 있습니다" 오류 발생
2. 같은 화장실을 3시간 내 재인증 불가, 인증 횟수 추적 필요

---

## Issue 1 근본 원인: MapView 마커 stale 데이터

**`MapView.tsx` line 31** — 마커 클릭 이벤트를 HTML 문자열에 직렬화:
```typescript
<div onclick="window.setSelectedToiletGlobal(${JSON.stringify(toilet).replace(/"/g, '&quot;')})">
```
toilet 객체가 마커 생성 시점에 HTML에 **베이킹**됨 → `markVisited()`로 state 업데이트해도 이미 생성된 마커의 HTML은 `isVisited: false` 유지.

사용자가 마커 클릭 시 → stale 데이터(`isVisited: false`)로 `handleSelectToilet` 호출 → `selectedToilet`이 stale 객체 → 팝업에서 `toilet.isVisited === false` → 후기 남기기 차단.

**Fix**: `handleSelectToilet`에서 받은 toilet을 최신 `toilets` state와 merge:

```typescript
// MapPage.tsx
const handleSelectToilet = useCallback((toilet: ToiletData | null) => {
  if (toilet) {
    const fresh = toilets.find(t => t.id === toilet.id) ?? toilet;
    setSelectedToilet(fresh);
    sessionStorage.setItem('lastSelectedToilet', JSON.stringify(fresh));
  } else {
    setSelectedToilet(null);
    sessionStorage.removeItem('lastSelectedToilet');
  }
}, [toilets]);
```

---

## Issue 2: 반복 인증 허용 + 횟수 기록

### Backend 변경

**1. cooldown 체크 제거**
- `PooRecordService.java` lines 99–103: `checkAndSetCooldown()` 호출 블록 제거
- `LocationVerificationService.java`: `checkAndSetCooldown()` 메서드 삭제 (또는 유지)

**2. 인증 횟수 조회 API 추가**
- `PooRecordRepository.java`: 새 쿼리 추가
  ```java
  @Query("SELECT p.toilet.id as toiletId, COUNT(p) as visitCount FROM PooRecord p WHERE p.user.id = :userId GROUP BY p.toilet.id")
  List<Object[]> findVisitCountsByUserId(@Param("userId") Long userId);
  ```
- `PooRecordService.java`: `getMyVisitCounts(String email)` 메서드 추가 → `Map<Long, Long>` 반환
- `PooRecordController.java`: `GET /api/v1/records/my-visit-counts` 엔드포인트 추가

### Frontend 변경

**3. visitCount 타입 및 데이터 관리**
- `frontend/src/types/toilet.ts`: `ToiletData`에 `visitCount?: number` 필드 추가
- `MapPage.tsx`:
  - 로그인 상태일 때 `GET /api/v1/records/my-visit-counts` 호출
  - `markVisited` 후 해당 toilet의 `visitCount` increment
  - `handleSelectToilet`에 merge 로직 적용 (Issue 1 fix 포함)

**4. ToiletPopup 표시**
- `ToiletPopup.tsx`: `isVisited && visitCount > 0`일 때 "N번 인증" 배지 표시
  - 헤더의 `CheckCircle2` 아이콘 옆에 표시

**5. MapPage 에러 핸들러 정리**
- `MapPage.tsx` line 128: `COOLDOWN_ACTIVE` case 제거 (더 이상 발생 안 함)

---

## 수정 파일 목록

| 파일 | 변경 내용 |
|------|---------|
| `frontend/src/pages/MapPage.tsx` | handleSelectToilet merge, visitCounts fetch, COOLDOWN_ACTIVE 제거 |
| `frontend/src/components/map/ToiletPopup.tsx` | visitCount 배지 표시 |
| `frontend/src/types/toilet.ts` | visitCount 필드 추가 |
| `backend/.../service/PooRecordService.java` | cooldown 제거, getMyVisitCounts 추가 |
| `backend/.../service/LocationVerificationService.java` | checkAndSetCooldown 제거 |
| `backend/.../controller/PooRecordController.java` | GET my-visit-counts 엔드포인트 추가 |
| `backend/.../repository/PooRecordRepository.java` | visitCount 쿼리 추가 |

---

## Verification

1. 방문 인증 완료 후 팝업을 다시 열어 "후기 남기기" 클릭 → 차단 없이 리뷰 모달 열림
2. 같은 화장실에서 연속 인증 시도 → 3시간 쿨다운 없이 인증 가능
3. 인증 완료 후 팝업 헤더에 "N번 인증" 배지 표시 확인
4. 페이지 새로고침 후에도 visitCount 올바르게 표시 (backend fetch)
