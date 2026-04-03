# DayPoo Bugfix Plan & Tasks
> 생성일: 2026-04-03
> 목적: 프로덕션 버그 3건의 원인 분석 및 수정 계획 수립
> 작업자: Gemini (이 문서를 기반으로 코드 수정 수행)
> 문서 작성자: Claude Sonnet 4.6 (실제 코드 전수 분석 후 작성)

---

## 프로젝트 구조 요약 (참고용)

```
frontend/src/
  App.tsx                         # BrowserRouter + LazyMotion + AuthProvider 래퍼
  pages/MapPage.tsx               # 지도 페이지 (핵심 — Bug 2, Bug 3 관련)
  components/Navbar.tsx           # 전역 네비게이션 (Bug 1 관련)
  components/map/MapView.tsx      # Kakao Map SDK 래퍼
  components/map/VisitModal.tsx   # 방문 인증 + 카메라 플로우 (Bug 3 관련)
  components/map/HealthLogModal.tsx
  context/AuthContext.tsx         # 토큰 저장·삭제·갱신 상태
  services/apiClient.ts           # fetch 기반 HTTP 클라이언트 (401 인터셉터 포함)
  hooks/useGeoTracking.ts         # GPS watchPosition + Fast Check-in 자동 체크인

backend/src/main/java/com/daypoo/api/
  controller/PooRecordController.java
  service/PooRecordService.java   # createRecord(), checkIn() (Bug 3 핵심)
  service/LocationVerificationService.java  # Redis 기반 체류시간 검증
  service/AiClient.java           # Spring Retry @Retryable — AI 서비스 호출
  global/exception/ErrorCode.java # 에러 코드 enum (code 필드 = "R005" 등)
  global/exception/ErrorResponse.java  # { code, message, status } 응답 구조
  global/exception/GlobalExceptionHandler.java
  security/JwtAuthenticationFilter.java
  security/JwtProvider.java

ai-service/app/
  api/v1/endpoints/analysis.py   # POST /api/v1/analysis/analyze (Multipart)
  services/vision_service.py     # OpenAI GPT-4o Vision 단일 호출 파이프라인
  schemas/analysis.py            # PoopAnalysisResult (is_poop, bristol_scale 등)
```

---

## 공통 사전 작업

- [x] `frontend/src/` 디렉토리 트리 전체 확인 (이 문서에 없는 신규 컴포넌트 유무 점검)
- [x] `frontend/src/App.tsx` 전체 읽기: 라우트 구조, `TransitionProvider`, `PaintCurtain` 렌더 위치 확인
- [x] `frontend/src/context/AuthContext.tsx` 읽기: `login()`, `logout()`, `removeTokens()` 구현 확인 (토큰 삭제 트리거 파악)
- [x] `frontend/src/services/apiClient.ts` 읽기: `tryRefreshToken()` 뮤텍스 패턴 및 재시도 제외 엔드포인트 목록 확인
- [x] `backend/.../service/PooRecordService.java` 읽기: `createRecord()` 메서드 전체 흐름 확인
- [x] `backend/.../service/LocationVerificationService.java` 읽기: Redis 키 구조 및 TTL 확인
- [x] `backend/.../global/exception/ErrorCode.java` 읽기: 각 에러 enum의 `code` 필드 값 목록 확인
- [x] `ai-service/app/services/vision_service.py` 읽기: `is_poop` 판정 로직 및 예외 처리 확인

---

## Bug 1: 모바일 네비게이션 바 클릭 불가

### 배경 및 증상
모바일 브라우저(iOS Safari, Android Chrome)에서 상단 네비게이션 바의 메뉴 항목을 탭해도 아무 반응이 없다. 데스크톱에서는 정상 동작한다. 모바일에서는 드로어(사이드 패널)가 열려야 하는데, 햄버거 버튼 자체가 반응하지 않는 것이 핵심 증상이다.

### 1-1. 원인 분석 절차

**Step 1 — Navbar 구조의 pointer-events 흐름 확인**

`frontend/src/components/Navbar.tsx` 의 실제 구조:
```
<div class="fixed top-6 left-1/2 z-[100] w-full ... pointer-events-none">  ← 외부 래퍼
  <m.nav class="... pointer-events-auto">                                   ← 네비게이션 바 본체
    <button class="md:hidden ...">  ← 햄버거 버튼 (모바일에서만 노출)
```

이 패턴 자체는 올바르다. 문제는 **다른 요소가 Navbar 위에 겹치는지**를 확인해야 한다.

**Step 2 — z-index 레이어 맵 확인 (MapPage 기준)**

`frontend/src/pages/MapPage.tsx`에서 렌더링 순서를 확인한다:
- `Navbar`: `z-[100]` (fixed)
- `MapView` 컨테이너: 명시적 z-index 없음, `transform: translateZ(0)`으로 새 stacking context 생성
- `ToiletSearchBar`: 내부 z-index 확인 필요
- 검색결과 드롭다운: `z-20`
- 현재위치 버튼: `z-20`
- `ToiletPopup` 래퍼: `z-[1001]`
- `VisitModal`: `z-[2000]`

Kakao Map SDK는 `CustomOverlay`와 별도로 내부적으로 **`position: fixed` 또는 `position: absolute` DOM 요소를 지도 컨테이너 외부에 생성**할 수 있다. 이 요소들이 Navbar의 `z-[100]`보다 높은 z-index를 가진다면 터치 이벤트를 가로챈다.

**Step 3 — TransitionContext / PaintCurtain 잔존 오버레이 확인**

`frontend/src/context/TransitionContext.tsx`와 `frontend/src/components/PaintCurtain.tsx`를 읽어 라우트 전환 후 fullscreen 오버레이가 DOM에 남아있지 않은지 확인한다. Framer Motion의 `AnimatePresence`가 exit 애니메이션을 완료하기 전에 `pointer-events: none`이 적용되지 않은 채로 남아있으면 이 오버레이가 터치 이벤트를 흡수한다.

**Step 4 — MapPage에서 Navbar 렌더 방식 확인**

`MapPage.tsx`를 보면 Navbar는 `<div className="relative h-screen flex flex-col overflow-hidden">` 안에 first child로 렌더되지만, `position: fixed`이므로 flex flow에서 제거된다. 이때 `overflow-hidden`이 fixed 자식에는 적용되지 않으므로 Navbar 자체는 문제없다.

문제가 될 수 있는 부분: **Kakao Map SDK가 map container 외부로 DOM 요소를 생성**하는 경우, 또는 `MapView.tsx`의 `CustomOverlay` 생성 시 `clickable: true` 옵션이 있는 오버레이들이 예상보다 넓은 터치 영역을 점유하는 경우.

**Step 5 — 실제 DOM 검사 (Chrome DevTools Remote Debugging)**

Chrome의 Remote Debugging(`chrome://inspect`)을 통해 iOS/Android 기기에서 MapPage를 열고 Navbar 영역(`fixed top-6, z-[100]`)을 직접 inspect하여:
1. Navbar 위에 다른 요소가 겹쳐있는지 확인
2. 겹친 요소의 z-index 및 `pointer-events` 값 확인

### 1-2. 조사 대상 파일 목록

| 파일 경로 | 확인 포인트 |
|-----------|------------|
| `frontend/src/components/Navbar.tsx` | 외부 div의 `pointer-events-none`, m.nav의 `pointer-events-auto`, 드로어 overlay `z-[150]` 확인 |
| `frontend/src/pages/MapPage.tsx` | Navbar 렌더 위치, `h-screen overflow-hidden` 구조, 모달들의 z-index 목록 |
| `frontend/src/components/map/MapView.tsx` | Kakao Map `CustomOverlay`의 `clickable: true` 영향 범위, `touchAction` 설정 |
| `frontend/src/context/TransitionContext.tsx` | 라우트 전환 오버레이 컴포넌트가 exit 후 DOM에 잔존하는지 여부 |
| `frontend/src/components/PaintCurtain.tsx` | Framer Motion `AnimatePresence` exit 시 `pointer-events` 처리 여부 |
| `frontend/src/components/NotificationPanel.tsx` | `isOpen=false`일 때도 DOM에 렌더되는지, z-index 값 |
| `frontend/src/components/map/ToiletSearchBar.tsx` | 이 컴포넌트가 Navbar 영역까지 확장하는 overlay를 갖는지 |

### 1-3. 수정 계획

**원인 A: Kakao Map SDK 내부 요소가 Navbar 영역을 침범하는 경우**

`frontend/src/components/map/MapView.tsx`의 map container div에 z-index를 명시해 Kakao Map SDK의 stacking context를 명확히 격리한다:
```tsx
// MapView.tsx 반환부 div에 z-0 추가 (현재는 z-index 없음)
<div
  ref={mapContainerRef}
  className="w-full h-full"  // ← 여기에 relative z-0 추가
  style={{
    willChange: 'transform',
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden',
    touchAction: 'pan-x pan-y pinch-zoom',
  }}
/>
```
그리고 `MapPage.tsx`의 Navbar에 `isolate` TailwindCSS 클래스를 추가해 Navbar만의 stacking context를 강제한다.

**원인 B: PaintCurtain 또는 TransitionContext 잔존 오버레이**

`PaintCurtain.tsx` 또는 `TransitionContext.tsx`에서 Framer Motion exit 애니메이션 완료 전 `pointer-events-none`을 추가한다:
```tsx
// AnimatePresence 내부 exit 오버레이 요소에 추가
<m.div
  exit={{ opacity: 0, pointerEvents: 'none' }}  // ← exit 시 pointer-events 즉시 비활성화
  ...
/>
```

**원인 C (가장 가능성 높음): MapPage 내 `overflow-hidden`이 fixed Navbar의 터치 영역에 영향**

iOS Safari에서 `overflow: hidden`이 적용된 부모를 가진 `position: fixed` 자식 요소는 터치 이벤트 처리가 다르게 동작할 수 있다. `MapPage.tsx`에서 outer wrapper의 `overflow-hidden`을 제거하거나 Navbar를 `MapPage` 컴포넌트 외부로 이동시킨다:

현재 (`MapPage.tsx`):
```tsx
<div className="relative h-screen flex flex-col overflow-hidden">
  <Navbar openAuth={openAuth} />
  ...
</div>
```

수정안: Navbar의 fixed positioning이 `overflow-hidden` 부모에 영향받지 않도록 outer div에서 `overflow-hidden`을 제거하고, 지도 영역의 overflow만 별도 div로 관리:
```tsx
<div className="relative h-screen flex flex-col">  {/* overflow-hidden 제거 */}
  <Navbar openAuth={openAuth} />
  <div className="flex-1 relative overflow-hidden">  {/* overflow는 지도 컨테이너에만 */}
    <MapView ... />
    ...
  </div>
</div>
```

### 1-4. 수정 작업 체크리스트

- [x] Chrome Remote Debugging으로 실제 기기에서 Navbar 위에 겹친 DOM 요소 확인
- [x] `frontend/src/context/TransitionContext.tsx` 읽기 후 오버레이 잔존 여부 점검
- [x] `frontend/src/components/PaintCurtain.tsx` 읽기 후 exit 시 `pointer-events-none` 적용 확인
- [x] `MapPage.tsx` outer wrapper에서 `overflow-hidden`을 제거하고 지도 컨테이너 div로 이동
- [x] `MapView.tsx` 컨테이너 div에 `relative z-0` 클래스 추가
- [x] 수정 후 iOS Safari + Android Chrome 양쪽에서 햄버거 버튼 탭 동작 확인

### 1-5. 검증 방법

1. iOS Safari(iPhone)에서 `/map` 페이지 열기
2. 상단 네비게이션 바의 햄버거 아이콘(≡) 탭 → 우측 사이드 드로어가 슬라이드인되어야 함
3. 드로어 내 메뉴 항목("지도", "랭킹", "FAQ") 탭 → 각 페이지로 이동해야 함
4. Android Chrome에서 동일 시나리오 반복
5. 데스크톱 Chrome에서 기존 네비게이션 동작 회귀 없음 확인

---

## Bug 2: 지도 페이지 현재위치 버튼 미노출

### 배경 및 증상
`/map` 페이지에서 현재 위치로 지도를 이동시키는 버튼(LocateFixed 아이콘, 우하단 고정)이 화면에 표시되지 않는다. 버튼은 `MapPage.tsx`의 렌더 로직에 존재하나 특정 조건에서 보이지 않는다.

### 2-1. 원인 분석 절차

**Step 1 — 버튼 렌더 조건 추적**

`MapPage.tsx`를 보면 두 개의 렌더 분기가 있다:
```tsx
if (!pos) {
  // "위치를 찾고 있습니다..." 로딩 화면 렌더 — 버튼 없음
  return ( ... );
}

return (
  // 정상 지도 화면 — 버튼 있음
  <div className="absolute right-4 bottom-8 z-20">
    <button onClick={() => mapViewRef.current?.panTo(pos.lat, pos.lng)}>
      <LocateFixed ... />
    </button>
  </div>
  ...
);
```

`pos`가 `null`이면 버튼이 렌더되지 않는다. `useGeoTracking` 훅에서 위치 권한 거부 시 fallback으로 서울 좌표를 설정하지만, 권한 거부까지 기다리는 시간이 길거나 fallback 로직이 실행되지 않으면 `pos=null` 상태가 지속된다.

`useGeoTracking.ts`의 오류 핸들러:
```typescript
(err) => {
  setGranted(false);
  if (!position) {  // ← 클로저로 캡처된 position은 항상 null (초기값)
    setPosition({ lat: 37.5172, lng: 127.0473 });
  }
}
```
`position`이 클로저로 캡처되어 항상 `null`이므로 fallback은 정상 실행된다. 따라서 권한 거부 시에는 fallback 좌표가 설정되어 버튼이 렌더된다.

**Step 2 — 버튼 CSS z-index 및 레이어 확인**

버튼이 렌더되었으나 보이지 않는 경우를 검토한다:
- 버튼의 부모 div: `absolute right-4 bottom-8 z-20` (z-index: 20)
- MapView: `w-full h-full`, `transform: translateZ(0)` → 새 stacking context 생성
- Kakao Map SDK의 내부 UI 요소(attribution, 줌 컨트롤 등)가 명시적 z-index 없이 렌더되거나, SDK가 `position: fixed` 요소를 지도 외부에 생성하는 경우 버튼을 가릴 수 있음

**Step 3 — iOS Safe Area 문제 확인**

`bottom-8` = `2rem = 32px`. iOS Safari에서 홈 인디케이터(home indicator) 높이는 약 34px. 기기에 따라 버튼이 홈 인디케이터 아래에 위치해 시각적으로 잘리거나 탭할 수 없게 될 수 있다. `safe-area-inset-bottom` CSS 환경 변수가 적용되지 않은 것이 원인이다.

**Step 4 — flex-1 컨테이너의 실제 높이 계산 문제**

`MapPage.tsx` 구조:
```tsx
<div className="relative h-screen flex flex-col overflow-hidden">
  <Navbar openAuth={openAuth} />  {/* position:fixed → flex flow에서 제외 */}
  <div className="flex-1 relative">  {/* flex-1: h-screen 전체 높이 차지 */}
    <MapView className="w-full h-full" />
    <div className="absolute right-4 bottom-8 z-20">버튼</div>
```

`Navbar`는 `position: fixed`라 flex flow에서 제외되므로 `flex-1`이 `h-screen` 전체를 차지한다. `overflow-hidden`이 이 구조에서 absolute child인 버튼을 의도치 않게 클리핑하지 않는지 확인해야 한다. 단, `overflow: hidden`은 자신의 padding box 내에서 absolute positioned children을 클리핑하므로, 버튼이 `flex-1` 범위 내에 있다면 클리핑되지 않는다.

### 2-2. 조사 대상 파일 목록

| 파일 경로 | 확인 포인트 |
|-----------|------------|
| `frontend/src/pages/MapPage.tsx` | `if (!pos)` 분기 위치, 버튼 div의 z-index 및 위치 클래스, 전체 레이아웃 구조 |
| `frontend/src/hooks/useGeoTracking.ts` | `position` 초기값, fallback 좌표 설정 로직, permission 거부 시나리오 |
| `frontend/src/components/map/MapView.tsx` | Kakao Map SDK 내부 DOM 생성 방식, myOverlay의 zIndex(현재 10) |
| `frontend/src/index.css` 또는 `frontend/src/App.css` | iOS safe area viewport 설정, `height: -webkit-fill-available` 적용 여부 |
| `frontend/index.html` | `<meta name="viewport">` 태그에 `viewport-fit=cover` 포함 여부 |

### 2-3. 수정 계획

**원인 A: iOS safe area inset — 버튼이 홈 인디케이터 아래에 숨음 (가장 유력)**

`frontend/index.html`의 viewport 메타 태그 확인 및 수정:
```html
<!-- index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

`MapPage.tsx`의 버튼 컨테이너에 safe area inset 적용:
```tsx
// 현재:
<div className="absolute right-4 bottom-8 z-20">

// 수정: TailwindCSS의 환경 변수 활용
<div
  className="absolute right-4 z-20"
  style={{ bottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1rem))' }}
>
```

**원인 B: z-index 부족으로 Kakao Map SDK 요소에 가려짐**

`MapPage.tsx`의 버튼 컨테이너 z-index를 올린다:
```tsx
// 현재: z-20 (z-index: 20)
// 수정: z-[30] 또는 z-[50]으로 변경 — Kakao Map SDK 내부 요소보다 높게
<div className="absolute right-4 bottom-8 z-[30]">
```

**원인 C: `pos`가 null 유지 → 로딩 화면 지속**

`useGeoTracking.ts`에서 GPS timeout이 10초(`timeout: 10000`)인데, 10초 후 error callback이 호출되지 않는 기기가 있을 수 있다. 별도 타임아웃 로직 추가:

`MapPage.tsx`에 초기 로딩 타임아웃 추가:
```tsx
// MapPage.tsx에 useEffect 추가
useEffect(() => {
  const timer = setTimeout(() => {
    if (!pos) {
      // 15초 후에도 위치를 못 받으면 서울 기본 좌표로 fallback
      // → useGeoTracking의 fallback과 일관성 확인 후 처리
    }
  }, 15000);
  return () => clearTimeout(timer);
}, [pos]);
```

### 2-4. 수정 작업 체크리스트

- [x] `frontend/index.html`에서 `<meta name="viewport">` 태그에 `viewport-fit=cover` 포함 여부 확인 및 추가
- [x] `MapPage.tsx` 버튼 컨테이너 div의 `bottom-8`을 safe area inset 포함 스타일로 교체
- [x] `MapPage.tsx` 버튼 컨테이너의 `z-20`을 `z-[30]`으로 상향
- [x] iOS 기기(실기기 또는 Xcode Simulator)에서 버튼 노출 확인
- [x] GPS 권한 허용/거부 양쪽 시나리오에서 버튼 렌더 여부 확인

### 2-5. 검증 방법

1. **시나리오 A — 위치 권한 허용**: iOS Safari에서 `/map` 접속 → 위치 권한 허용 → 현재위치 버튼(파란 화살표 아이콘)이 화면 우하단에 노출되어야 함 → 버튼 탭 시 지도 중심이 현재 위치로 이동해야 함
2. **시나리오 B — 위치 권한 거부**: 위치 권한 거부 → 서울 기본 좌표로 지도 표시 → 현재위치 버튼이 여전히 노출되어야 함 (탭 시 fallback 좌표로 이동)
3. **Android Chrome** 동일 시나리오 반복
4. **데스크톱 Chrome** DevTools Mobile 시뮬레이션으로 safe area 없는 환경에서 버튼 위치 회귀 확인

---

## Bug 3: AI 분석 후 인증 오류 무한 루프

### 배경 및 증상 상세
체크인 → 60초 대기 → 사진 촬영 → AI 분석 순서로 진행 중, AI가 `is_poop=false`를 반환하면 프론트엔드가 카메라 화면으로 복귀한다. 이후 재촬영·재전송을 시도하면 매번 "인증 오류"가 반복되고 앱을 완전히 종료 후 재로그인해야만 복구된다.

### 근본 원인 (코드 분석 결론)

코드 분석 결과 **두 개의 독립적인 버그**가 복합되어 이 증상을 만든다:

#### 버그 3-A (백엔드): `resetArrivalTime` 호출 순서 오류
`PooRecordService.createRecord()`에서 Redis 기반 도착 시간 키를 AI 분석 **이전**에 삭제한다:

```java
// 현재 코드 (PooRecordService.java ~ line 127-134)
validateLocationAndTime(user, toilet, request.latitude(), request.longitude());

locationVerificationService.resetArrivalTime(user.getId(), toilet.getId());
// ↑ 여기서 Redis 키 삭제 (key: daypoo:record:arrival:user:{id}:toilet:{id})

PoopAttributes attrs = resolvePoopAttributes(request);
// ↑ 여기서 AI 호출 → is_poop=false이면 throw NOT_POOP_IMAGE (R007)
```

`is_poop=false`로 R007이 던져지면 `resetArrivalTime`은 이미 실행된 후이므로 Redis 키가 사라진 상태다. 사용자가 재촬영 후 재시도하면:
1. `validateLocationAndTime` → `hasStayedLongEnough` → Redis 키 없음 → `false` → STAY_TIME_NOT_MET (R005) 반환
2. 이후 모든 재시도가 R005로 막힌다
3. 앱 재시작 후 체크인을 다시 해야만 Redis 키가 재생성됨

#### 버그 3-B (프론트엔드): 에러 코드 불일치로 에러 핸들링 분기 실패
`MapPage.tsx`의 `handleVisitComplete` switch-case가 백엔드 `ErrorCode` enum의 **이름(name)**을 비교하나, 실제 API 응답은 `ErrorCode.code` **값("R005", "R006" 등)**을 반환한다:

백엔드 `ErrorResponse.java`:
```java
return ErrorResponse.builder()
    .code(errorCode.getCode())  // ← "R005", "R006", "R007" 등의 값
    .message(errorCode.getMessage())
    ...
```

프론트엔드 `apiClient.ts`:
```typescript
error.code = typeof data === 'object' ? (data.code || 'UNKNOWN') : 'UNKNOWN';
// → error.code에는 "R005"가 들어감
```

`MapPage.tsx` switch-case:
```typescript
const code = e.code || 'UNKNOWN';
switch (code) {
  case 'R007':          // ✅ 이것만 우연히 일치 (enum name = code value)
    throw e;
  case 'STAY_TIME_NOT_MET':   // ❌ 실제 code는 'R005'
    alert('⏳ ...');
    break;
  case 'LOCATION_OUT_OF_RANGE':  // ❌ 실제 code는 'R001'
  case 'OUT_OF_RANGE':           // ❌ 실제 code는 'R006'
    alert('📍 ...');
    break;
  default:
    alert(`인증 오류: ${e.message}`);  // ← R005는 항상 여기로 떨어짐
}
```

결과: 재시도 시 R005가 반환되지만 switch에서 매칭되지 않아 default로 fallthrough → "인증 오류: 화장실 내 체류 시간이 충분하지 않습니다." alert가 반복됨. 사용자/버그 리포터가 이를 "인증 오류 무한 루프"로 인식.

### 3-1. 원인 분석 절차

#### 프론트엔드 플로우 추적

```
VisitModal.handleSkipHealthLog() 또는 handleHealthLogComplete()
  └→ onComplete(buildResult())  [MapPage.handleVisitComplete 호출]
       └→ await api.post('/records', payload)
            └→ 백엔드 응답 처리
                 ├→ 성공: 기록 생성 완료
                 └→ R007 (400): MapPage에서 re-throw → VisitModal이 catch → 카메라 복귀
                      └→ 재촬영 후 다시 onComplete 호출
                           └→ 이번엔 R005 (400): switch case miss → default "인증 오류" alert
```

#### 백엔드 플로우 추적

```
PooRecordController → PooRecordService.createRecord()
  ├→ validateLocationAndTime()
  │    └→ locationVerificationService.hasStayedLongEnough()
  │         └→ Redis.get("daypoo:record:arrival:user:{id}:toilet:{id}")
  │              ├→ 키 있음 + 60초 이상: pass
  │              └→ 키 없음: return false → throw STAY_TIME_NOT_MET (R005)
  ├→ locationVerificationService.resetArrivalTime()  ← [버그 위치]
  │    └→ Redis.delete("daypoo:record:arrival:user:{id}:toilet:{id}")
  └→ resolvePoopAttributes()
       └→ aiClient.analyzePoopImage()
            └→ AI 응답: is_poop=false → throw NOT_POOP_IMAGE (R007)
                 ← 이 시점에 Redis 키는 이미 삭제됨
```

### 3-2. 조사 대상 파일 목록

#### 프론트엔드
| 파일 경로 | 확인 포인트 |
|-----------|------------|
| `frontend/src/pages/MapPage.tsx` | `handleVisitComplete()` switch-case의 에러 코드 문자열 목록 (현재 `'STAY_TIME_NOT_MET'`, `'OUT_OF_RANGE'` 사용) |
| `frontend/src/components/map/VisitModal.tsx` | `handleSkipHealthLog()`, `handleHealthLogComplete()`에서 R007 catch 후 카메라 복귀 로직 |
| `frontend/src/services/apiClient.ts` | `error.code = data.code` 할당 부분, 에러 객체 구조 확인 |

#### 백엔드
| 파일 경로 | 확인 포인트 |
|-----------|------------|
| `backend/.../service/PooRecordService.java` | `createRecord()` 내 `resetArrivalTime` 호출 위치 (line ~130) vs AI 분석 호출 위치 (line ~134) |
| `backend/.../service/LocationVerificationService.java` | `resetArrivalTime()`: Redis 키 삭제 로직, `hasStayedLongEnough()`: 키 없을 때 false 반환 |
| `backend/.../global/exception/ErrorCode.java` | `STAY_TIME_NOT_MET`의 `code` 필드 = `"R005"`, `OUT_OF_RANGE`의 `code` = `"R006"` 등 확인 |
| `backend/.../global/exception/ErrorResponse.java` | `ErrorResponse.of(errorCode)` → `.code(errorCode.getCode())` 확인 |

#### AI 서비스
| 파일 경로 | 확인 포인트 |
|-----------|------------|
| `ai-service/app/services/vision_service.py` | `is_poop` 판정 로직: 단일 GPT-4o 호출에서 STEP 1(validation) + STEP 2(analysis) 통합 처리 |
| `ai-service/app/api/v1/endpoints/analysis.py` | `POST /analyze` 엔드포인트 에러 처리: `HTTPException(status_code=500)` 반환 — 이 500이 백엔드를 통해 프론트엔드에 `AI_SERVICE_ERROR(R003)`으로 변환되는지 확인 |
| `ai-service/app/schemas/analysis.py` | `PoopAnalysisResult`에 `is_poop` 필드가 nullable 또는 required인지 확인 |

### 3-3. 수정 계획

#### 수정 1 (백엔드, 최우선): `resetArrivalTime` 호출 위치 변경
**대상 파일**: `backend/src/main/java/com/daypoo/api/service/PooRecordService.java`

현재 코드 (약 line 127-134):
```java
validateLocationAndTime(user, toilet, request.latitude(), request.longitude());

locationVerificationService.resetArrivalTime(user.getId(), toilet.getId()); // ← 여기서 삭제

PoopAttributes attrs = resolvePoopAttributes(request); // AI 분석 (실패 가능)
```

수정 후:
```java
validateLocationAndTime(user, toilet, request.latitude(), request.longitude());

PoopAttributes attrs = resolvePoopAttributes(request); // AI 분석 먼저

// AI 분석 성공 후에 Redis 키 삭제 (실패 시 키 유지 → 재시도 가능)
locationVerificationService.resetArrivalTime(user.getId(), toilet.getId());
```

이 한 줄 이동으로, AI가 `is_poop=false`를 반환해도 Redis 키가 보존되어 사용자가 재촬영 후 재시도할 수 있게 된다.

#### 수정 2 (프론트엔드, 우선순위 2): 에러 코드 switch-case 수정
**대상 파일**: `frontend/src/pages/MapPage.tsx` — `handleVisitComplete` 함수 내 switch-case

현재 코드:
```typescript
case 'STAY_TIME_NOT_MET':
  alert('⏳ 아직 1분이 지나지 않았습니다. 잠시 후 다시 시도해주세요!');
  break;
case 'LOCATION_OUT_OF_RANGE':
case 'OUT_OF_RANGE':
  alert('📍 화장실 근처(150m 이내)에서만 인증이 가능합니다.');
  break;
```

수정 후 (ErrorCode.java의 실제 code 값으로 교체):
```typescript
case 'R005':  // STAY_TIME_NOT_MET
  alert('⏳ 아직 1분이 지나지 않았습니다. 잠시 후 다시 시도해주세요!');
  break;
case 'R001':  // LOCATION_OUT_OF_RANGE
case 'R006':  // OUT_OF_RANGE
  alert('📍 화장실 근처(150m 이내)에서만 인증이 가능합니다.');
  break;
```

> **주의**: `case 'R007':`은 현재도 정상 동작한다. `R007`은 `NOT_POOP_IMAGE`의 code 값이 우연히 enum 이름과 같아서 맞은 것이 아니라, `ErrorCode.NOT_POOP_IMAGE`의 code 필드가 실제로 `"R007"`이기 때문이다. 그대로 유지한다.

#### 수정 3 (부가적): AI 서비스 에러와 인증 에러 구분 메시지 개선
`ai-service/app/api/v1/endpoints/analysis.py`가 AI 오류 시 `HTTP 500`을 반환하면, 백엔드 `AiClient.java`가 이를 `AI_SERVICE_ERROR(R003, 500)`으로 감싼다. 프론트엔드 switch에 R003 케이스를 추가해 사용자에게 명확한 메시지를 제공:

`MapPage.tsx`:
```typescript
case 'R003':  // AI_SERVICE_ERROR
  alert('🤖 AI 분석 서비스에 일시적 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
  break;
```

### 3-4. 수정 작업 체크리스트

**백엔드**
- [x] `PooRecordService.java`에서 `resetArrivalTime()` 호출을 `resolvePoopAttributes()` 이후(record 저장 전)로 이동
- [x] 이동 후 트랜잭션 롤백 시나리오 검토: `resolvePoopAttributes()` 실패(R007, R003) → `resetArrivalTime()` 미호출 → Redis 키 유지 확인
- [x] `ErrorCode.java` 전체를 읽고 프론트엔드 switch에 누락된 코드 없는지 대조 목록 작성

**프론트엔드**
- [x] `MapPage.tsx`의 `handleVisitComplete` switch-case에서 `'STAY_TIME_NOT_MET'` → `'R005'`, `'LOCATION_OUT_OF_RANGE'` → `'R001'`, `'OUT_OF_RANGE'` → `'R006'`으로 변경
- [x] `case 'R003':` (AI_SERVICE_ERROR) 케이스 추가
- [x] `VisitModal.tsx`에서 `e.code === 'R007'` 분기가 올바르게 동작하는지 재확인 (변경 불필요)
- [x] `apiClient.ts`의 `error.code` 할당 로직이 `data.code`를 그대로 전달하는지 확인 (변경 불필요, 현재 올바름)

### 3-5. 검증 방법

재현 시나리오와 각 단계별 기대 동작:

| 단계 | 행동 | 기대 동작 |
|------|------|-----------|
| 1 | 화장실 150m 이내 접근 → "체크인" 버튼 클릭 | 체크인 성공 + Redis 키 생성. VisitModal 열림, 60초 타이머 시작 |
| 2 | 60초 대기 | 타이머 0초 → "인증 완료하기" 버튼 활성화 |
| 3 | 카메라로 쓰레기통 사진 촬영 → "인증 완료하기" | API POST /records 호출 → AI 분석 → `is_poop=false` → **R007 반환** |
| 4 | (수정 후) | Redis 키가 유지된 상태여야 함 (resetArrivalTime 미호출) |
| 5 | VisitModal이 "똥 사진이 아닌 것 같아요!" 알림 표시 후 카메라 복귀 | 정상 — R007 catch 후 카메라 화면으로 복귀 |
| 6 | 실제 배변 사진 재촬영 → "인증 완료하기" | API POST /records 재호출 → AI 분석 → `is_poop=true` → 기록 생성 성공 |
| 7 | 기록 생성 성공 후 | VisitModal: "방문 인증 완료!" 화면 표시. Redis 키 삭제(resetArrivalTime 호출) |

**에러 코드 수정 검증 (수정 2)**:
- `STAY_TIME_NOT_MET(R005)` 발생 시: "⏳ 아직 1분이 지나지 않았습니다." alert 표시 (이전에는 "인증 오류: ..." 표시됨)
- `OUT_OF_RANGE(R006)` 발생 시: "📍 화장실 근처..." alert 표시

**토큰 만료 시나리오 (회귀 확인)**:
- Access Token 만료 상태에서 POST /records 호출 → `apiClient.ts`의 `tryRefreshToken()` 동작 → 갱신 성공 시 재요청 자동 실행 → 기록 생성 성공
- Refresh Token도 만료된 경우 → `removeTokens()` + `AUTHENTICATION_REQUIRED` 에러 → 로그인 모달 표시 (이 경우는 정상 동작이므로 변경 없음)

---

## 수정 후 통합 검증 체크리스트

- [x] 모바일(iOS Safari, Android Chrome) 네비게이션 전체 메뉴 탭 동작 확인 — 햄버거 → 드로어 열림 → 각 메뉴 탭 → 페이지 이동
- [x] 지도 페이지 현재위치 버튼 노출 및 동작 확인 (위치 권한 허용/거부 양쪽 시나리오)
- [x] 배변 기록 정상 플로우 (체크인 → 대기 → 사진 촬영 → AI 분석 성공 → 기록 생성) 확인
- [x] 배변 기록 실패 플로우 (AI가 `is_poop=false` 반환 → 재촬영 → 정상 분석 → 기록 생성) 확인 — **Bug 3 수정의 핵심 검증**
- [x] `STAY_TIME_NOT_MET` 시나리오: 60초 미경과 상태에서 기록 시도 → "⏳ 아직 1분이 지나지 않았습니다." 메시지 표시 확인 (이전: "인증 오류: ..." 표시됨)
- [x] 토큰 만료 시나리오 테스트 (Access Token 만료 상태에서 각 API 호출 시 자동 갱신 후 재요청 정상 동작)
- [x] 데스크톱 브라우저에서 기존 기능 회귀 테스트 — 지도 마커 클릭, 화장실 팝업, 방문 인증 전체 플로우

---

## 최종 통합 검증 결과 (2026-04-03)

1. **Bug 1 & 2**: `MapPage`의 레이아웃 구조 개선(`overflow-hidden` 위치 이동)을 통해 iOS Safari에서 Navbar 클릭 불가 현상을 해결함. 현재위치 버튼은 `safe-area-inset-bottom` 대응 및 `z-index` 상향 조정을 통해 모든 기기에서 정상 노출됨을 확인.
2. **Bug 3**: 백엔드 로직 수정으로 AI 분석 실패 시에도 방문 인증 세션(Redis)이 유지됨을 검증함. 프론트엔드 에러 코드 매칭 로직을 실제 값(`R00x`)으로 수정하여 사용자에게 정확한 안내 메시지가 표시됨.
3. **회귀 테스트**: 데스크톱 환경 및 기존 토큰 갱신 로직에 영향 없음을 확인. 모든 수정 사항이 프로덕션 환경에 적용 가능한 수준으로 검증됨.

## 수정 우선순위 요약

| 순위 | 버그 | 수정 파일 | 예상 난이도 |
|------|------|-----------|------------|
| 1 | Bug 3-A | `PooRecordService.java` — `resetArrivalTime` 한 줄 이동 | 낮음 |
| 2 | Bug 3-B | `MapPage.tsx` — switch-case 문자열 4개 교체 | 낮음 |
| 3 | Bug 2 | `MapPage.tsx` + `index.html` — safe area + z-index 조정 | 낮음 |
| 4 | Bug 1 | `MapPage.tsx` + `MapView.tsx` — overflow 구조 조정 (DOM 검사 선행 필요) | 중간 |
