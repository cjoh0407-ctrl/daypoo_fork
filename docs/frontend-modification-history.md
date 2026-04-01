# Frontend Modification History

## [2026-04-01 18:27:00] HeroSection UI & Animation Refinement
- **작업 내용**: 히어로 섹션 타이포그래피 비율 조정 및 파동 애니메이션 고도화
- **상세 변경 내역**:
  - `HeroSection.tsx`: `h1`, `p` 폰트 크기 및 비율 재조정 (더 크고 임팩트 있는 가로 비율 확보)
  - `HeroSection.tsx`: 다층 구조(Multi-layered)의 유체 파동 애니메이션 도입으로 실시간 엔진 느낌 강화
  - `HeroSection.tsx`: 디지털 펄스 파티클 및 글래스 마스크 오버레이 추가
- **결과**: 전반적인 디자인 일관성 향상 및 프리미엄한 사용자 경험 제공

## [2026-04-01 18:05:00] Design Polish: Navbar & HeroSection UI/UX Refinement
- **작업 내용**: 내비바 공간감 확보 및 히어로 섹션 타이포그래피/건강 엔진 애니메이션 고도화
- **상세 변경 내역**:
  - `Navbar.tsx`: 플로팅 내비바의 패딩을 `14px 24px 14px 32px`로 확대하고 내부 간격(gap)을 `24px`로 늘려 시각적으로 더 여유롭고 프리미엄한 디자인 구현. 그림자 효과 강조(`box-shadow`)로 입체감 부여.
  - `HeroSection.tsx`: 메인 타이틀 폰트 크기를 `100px`에서 `85px`로 조정하고 행간(`0.95`)과 자간을 최적화하여 세련된 타이포그래피 밸런스 확보. 서브 텍스트 가독성 개선(폰트 굵기 및 투명도 조정).
  - `HeroSection.tsx`: '실시간 건강 엔진' 위젯의 성능 시각화 강화. 웨이브 애니메이션 속도를 `1.8s`로 단축하고 이중 웨이브 글로우 효과를 추가하여 역동적인 실시간 데이터 처리 시각화 완성.
- **결과/영향**: 전체적인 UI의 일관성이 높아졌으며, 히어로 섹션의 시각적 임팩트와 내비바의 사용성이 대폭 개선됨.

## [2026-04-01 18:02:00] MyPage Shop discountPrice Integration
- **작업 내용**: 마이페이지 상점 아이템 할인가(discountPrice) 연동 및 구매 로직 고도화
- **상세 변경 내역**:
  - `MyPage.tsx:AvatarItem`: `discountPrice` 필드를 인터페이스에 추가하여 타입 안정성 확보.
  - `MyPage.tsx:fetchShopData`: API 응답 데이터로부터 `discountPrice`를 추출하여 `AvatarItem` 객체에 매핑.
  - `MyPage.tsx:HomeTab`: 아이템 카드(`DeckCard`)의 `sublabel` 타입을 `React.ReactNode`로 확장하고, 할인가 적용 시 원가 취소선(strikethrough)과 할인가를 동시에 표시하는 프리미엄 UI 적용.
  - `MyPage.tsx:handleSave`: 아이템 구매 시 포인트 차감 기준을 `discountPrice` 우선으로 변경하여 경제 시스템 데이터 정합성 보장.
- **결과/영향**: 백엔드 할인 정책이 프론트엔드 UI와 구매 로직에 완벽히 반영되어 사용자가 정확한 가격으로 아이템을 구매할 수 있게 됨.

## [2026-04-01 17:58:00] Admin Dashboard UI/UX Redesign & Premium Shop Consistency
- **작업 내용**: 관리자 대시보드 성장 엔진 리포트 차트 고도화 및 프리미엄 상점 아이템 카드 UI 통일
- **상세 변경 내역**:
  - `AdminPage.tsx:DashboardView`: 성장 엔진 리포트 차트를 '모니터링 벨로시티' 컨셉으로 리디자인. 네온 글로우 필터, 커스텀 펄스 도트, 배경 해치 패턴 및 디지털 미터 플레이트 오버레이 추가로 가시성 및 전문성 강화.
  - `AdminPage.tsx:StoreView`: 상점 아이템 카드의 배경색을 `#F7F8F8`로 고정하고, 아이콘 영역 비율을 `70%`로 통일하여 아이콘 종류에 관계없이 일관된 배경 크기 유지.
  - `AdminPage.tsx:StoreView`: 카드 패딩 및 텍스트 레이아웃을 정교화하여 'Price Unit' 및 'Status' 영역을 명확히 구분하는 프리미엄 카드 디자인 적용.
- **결과/영향**: 데이터가 적을 때도 대시보드가 풍성해 보이며, 상점 아이템들이 정렬된 그리드 시스템 내에서 완벽한 시각적 균형을 이룸.
