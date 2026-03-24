# 프론트엔드 리팩토링 및 고도화 계획 (잔여 작업)

`goofy-seeking-meteor.md` 계획에서 아직 완료되지 않았거나 보강이 필요한 프론트엔드 작업을 수행합니다.

## 1. 카메라 타이밍 버그 수정 및 안정화 (보안 및 개선)
- **대상 파일**: `frontend/src/components/map/VisitModal.tsx`
- **변경 사항**: 
    - `stopCamera` 시 `streamRef.current`의 모든 트랙을 명시적으로 중지.
    - `useEffect` 클린업 함수에서 `stopCamera` 호출 보강.
    - 카메라 시작 시 `streamRef.current` 할당 후 `setIsCameraActive(true)`를 호출하여 DOM 마운트 유도.

## 2. 불필요한 의존성 제거
- **작업**: `axios`, `zustand` 제거. 현재 프로젝트는 `fetch` 기반의 `apiClient.ts`를 사용 중이므로 미사용 라이브러리를 삭제합니다.
- **명령어**: `npm uninstall axios zustand` (frontend 디렉토리)

## 3. 성능 최적화: 빌드 및 마커 렌더링
- **Vite 빌드 최적화**: `frontend/vite.config.js`에 `manualChunks` 설정을 추가하여 벤더 라이브러리(react, recharts 등)를 별도 덩어리로 분리, 초기 로딩 속도 개선.
- **마커 렌더링 보강**: `frontend/src/components/map/MapView.tsx`에서 마커 업데이트 로직을 `toilets`의 변화만 감지하도록 더 타이트하게 제어 (현재 `toilets`가 바뀔 때 마커를 삭제 후 재생성하는 부분을 차분(diff) 기반으로 강화).

## 4. API 응답 타입 정의 및 적용 (신규)
- **파일 생성**: `frontend/src/types/api.ts`
- **내용**: 
    - `ApiResponse<T>`, `LoginResponse`, `UserResponse`, `ToiletSearchResponse`, `PooRecordResponse` 등 타입 정의.
- **적용**: `apiClient.ts`의 `request` 메서드와 각 호출부에서 제네릭 타입을 명시적으로 지정하여 타입 안전성 확보.

---
## 작업 순서
1. `types/api.ts` 신규 생성 및 주요 타입 정의
2. `apiClient.ts`에 API 응답 타입 적용 (제네릭)
3. `VisitModal.tsx` 카메라 타이밍 로직 보강
4. `vite.config.js` 빌드 최적화 (manualChunks)
5. `MapView.tsx` 마커 업데이트 로직 보전 및 보강
6. 의존성 제거 (`axios`, `zustand`)
7. `docs/modification-history.md` 최종 기록

[✅ 규칙을 잘 수행했습니다.]
