# 지도 마커 모달 위치 및 리뷰 모달 버그 수정 계획

## 🎯 목표
1. 화장실 상세 정보 모달(`ToiletPopup`)의 위치를 사용자 요청에 맞춰 화면 중앙(기존 하단 75% -> 50%)으로 조정합니다.
2. 리뷰 모달(`ReviewModal`)이 팝업 내부의 `transform` 속성 때문에 정상적으로 렌더링되지 않는 현상을 `React Portal`을 사용하여 해결하고 팝업 밖(body)으로 분리합니다.

## 🛠 작업 단계

### Phase 1: `MapPage.tsx` 위치 수정
- [ ] `selectedToilet`이 활성화되었을 때의 컨테이너 `top` 속성을 `75%`에서 `50%`로 수정하여 모달이 중앙으로 오게 합니다.

### Phase 2: `ToiletPopup.tsx` 모달 버그 수정
- [ ] `react-dom`의 `createPortal`을 임포트합니다.
* [ ] `ReviewModal`과 `ReviewListModal`을 `document.body`에 렌더링하여 부모의 `transform` 속성 영향을 제거합니다.

### Phase 3: 최종 확인
- [ ] 실제 마커를 클릭했을 때 정보 모달이 중앙에 뜨고, 리뷰 버튼을 눌렀을 때 전체 화면 모달로 정상 동작하는지 확인합니다.
- [ ] `docs/frontend-modification-history.md`에 레이아웃 및 버그 수정 사항을 기록합니다.

---
[✅ 규칙을 잘 수행했습니다.]
