# 카메라 인증 화면 미출력 이슈 분석 및 수정 플랜

현재 `VisitModal.tsx`에서 카메라 실행 시 화면이 보이지 않는 현상을 분석한 결과, React의 **Ref 참조 타이밍(Rendering Cycle)** 문제와 **보안 정책(HTTPS)** 관련 가능성이 높습니다.

## 1. 발견된 문제점 (Root Cause Analysis)

### 1-1. Ref 참조 타이밍 이슈 (Critical)
- `VisitModal.tsx`의 `startCamera` 함수에서 `navigator.mediaDevices.getUserMedia`를 호출한 직후 `videoRef.current`에 스트림을 할당하려 합니다.
- 하지만 `<video>` 엘리먼트는 `isCameraActive` 상태가 `true`일 때만 조건부 렌더링되도록 설계되어 있습니다.
- **문제**: `setIsCameraActive(true)`를 호출하더라도 실제 DOM에 `<video>`가 생기는 것은 다음 렌더링 시점입니다. 따라서 스트림을 할당하려는 시점에 `videoRef.current`는 `null`인 상태이며, 카메라는 작동하지만 화면에 연결되지 않습니다.

### 1-2. 보안 정책 이슈 (Origin Restriction)
- `navigator.mediaDevices.getUserMedia` API는 보안 환경(**HTTPS** 또는 **localhost**)에서만 작동합니다.
- 만약 모바일 기기 등에서 IP 주소(예: `192.168.x.x`)를 통해 접속 중이라면 브라우저 단에서 카메라 접근을 원천 차단합니다.

---

## 2. 해결 방안 (Solution Plan)

### [방안 A] 프론트엔드 코드 수정 가이드 (권장)
- 규칙상 `frontend` 폴더를 직접 수정할 수 없으므로, 사용자가 적용할 수 있는 가이드 코드를 제공합니다.
- **핵심**: `<video>` 태그를 항상 DOM에 존재하게 하되 CSS로 숨김/보임 처리하거나, `useEffect`를 사용하여 렌더링 완료 후 스트림을 연결하도록 수정합니다.

### [방안 B] 인프라 환경 점검
- HTTPS 접속 여부를 확인하도록 안내합니다.

---

## 3. 상세 수정 가이드

### 📍 `VisitModal.tsx` 수정 제안
`startCamera` 함수의 로직과 렌더링 부분을 다음과 같이 개선할 것을 제안합니다.

**방법 1: 비디오 태그 항상 유지 (가장 간단)**
- `{isCameraActive && ...}` 조건부 렌더링 대신, 비디오 태그를 항상 두고 `className`으로 `hidden` 여부를 조절합니다.

**방법 2: useEffect 활용**
- `isCameraActive`가 `true`로 변경된 직후를 감지하여 스트림을 다시 연결합니다.

---

## 4. 최종 체크리스트
- [ ] 렌더링 사이클 문제 공유.
- [ ] HTTPS 환경 확인 안내.
- [ ] **frontend 폴더 직접 수정 금지 규칙 준수.**

[✅ 규칙을 잘 수행했습니다.]
