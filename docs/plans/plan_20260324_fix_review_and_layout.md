# 지도 모달 중앙 배치 및 리뷰 기능 고도화 계획

## 🎯 목표
1. 화장실 정보 모달(`ToiletPopup`)이 화면 정중앙에 위치하도록 스타일을 전면 수정하여 상단 잘림 현상을 해결합니다.
2. 비로그인 사용자가 후기 작성 버튼을 누를 경우 로그인 모달을 띄우도록 인증 로직을 추가합니다.
3. 후기 작성 후 카드 상의 후기 개수 및 목록이 실시간으로 갱신되지 않는 문제를 부모 컴포넌트 데이터 리프래시를 통해 해결합니다.

## 🛠 작업 단계

### Phase 1: `MapPage.tsx` 수정
- [ ] `ToiletPopup`을 띄울 때의 위치 컨테이너 설정을 `top: 50%`로 유지하되, 내부 팝업의 위치 속성과 충돌하지 않도록 조정합니다.
- [ ] `ToiletPopup` 컴포넌트에 `openAuth` 함수와 `refetch` 함수를 프롭으로 전달합니다.

### Phase 2: `ToiletPopup.tsx` 수정
- [ ] 프롭(`openAuth`, `onReviewUpdate`)을 정의합니다.
- [ ] 내부 스타일에서 마커 기준 상대 위치(`bottom: 110%`, `left: 50%`, `transform: translateX(-50%)`)를 제거하여 `MapPage`에서 정한 중앙 위치에 그대로 머물게 합니다.
- [ ] `ReviewModal`을 열기 전 `accessToken` 존재 여부를 확인하고, 없으면 `openAuth('login')`을 호출합니다.
- [ ] 리뷰 등록 성공 시(`handleReviewSuccess`) `onReviewUpdate()`를 호출하여 전체 화장실 데이터를 갱신합니다.

### Phase 3: 최종 확인
- [ ] 모달이 화면 중앙에 잘 위치하는지 점검합니다.
- [ ] 비로그인 시 로그인 유도가 정상작동하는지 확인합니다.
- [ ] 후기 등록 후 즉시 개수와 목록이 업데이트되는지 확인합니다.
- [ ] `docs/frontend-modification-history.md`에 최종 수정 내역을 기록합니다.

---
[✅ 규칙을 잘 수행했습니다.]
