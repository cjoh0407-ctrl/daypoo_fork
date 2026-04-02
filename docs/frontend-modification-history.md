# Frontend Modification History

## [2026-04-02 15:20:00] Back-end: OpenSearch (2.15) & Nori Analyzer Implementation

- **작업 내용**: OpenSearch 엔진 버전 업그레이드 및 Nori 형태소 분석기 커스텀 매핑 적용 (사용자 요청에 따른 백엔드 수정 제한 예외 처리)
- **상세 변경 내역**:
  - `ToiletIndexingService.java`: `nori_tokenizer` (mixed 모드) 및 `custom analyzer`를 이용한 인덱스 생성 로직(Mapping) 최적화. `number_of_replicas: 0` 설정을 통해 1개 노드 환경에서의 Yellow 상태 해결.
  - `ToiletIndexingService.java`: 위치 기반 검색 성능 고도화를 위해 `geo_point` 타입인 `location` 필드를 도입하고, 직렬화 시 `lat/lon` 데이터 구조 연동.
  - `opensearch.tf`: 엔진 버전을 `OpenSearch_2.11`에서 `OpenSearch_2.15`로, 볼륨 용량을 `10GB`에서 `20GB`로 상향 조정.
  - `init_opensearch_nori.sh`: Nori 분석기 설정을 바탕으로 인덱스를 즉각 초기화하고 재생성할 수 있는 복구 스크립트 작성.
  - `ToiletIndexingService.java` & `ToiletSearchService.java`: 인덱스 이름을 `toilets_v2`로 변경하여, VPC 외부망에서의 스크립트 실행 없이 백엔드 서버가 시작 시 자동으로 새로운 Nori/GeoPoint 규격의 인덱스를 생성하도록 개선.
- **결과/영향**: 한국어 자연어 검색 정확도가 대폭 향상되었으며, 거리 기반 정렬 및 고해상도 검색이 가능해짐. 클러스터 상태를 Green으로 정상화하여 가용성 확보.

## [2026-04-02 14:59:00] Mobile UI Optimization: Section Gaps & Typography Refinement

- **작업 내용**: 메인 페이지 섹션 간 불필요한 여백 제거 및 모바일 반응형 텍스트 크기 최적화
- **상세 변경 내역**:
  - `MapSection.tsx`: 모바일 환경에서의 상단 패딩을 `pt-12`(48px)에서 `pt-4`(16px)로 대폭 축소하여 물결 SVG와 콘텐츠 사이의 간격 밀착.
  - `MapSection.tsx`: 모바일 제목(`h2`) 크기를 `text-2xl`에서 `text-xl`로, 설명(`p`) 크기를 `text-sm`에서 `text-[13px]`로 하향 조정하여 가독성 및 화면 점유율 최적화.
  - `ReportCard_Glass.tsx`: 모바일 하단 패딩을 `pb-20`에서 `pb-10`으로 줄여 섹션 전환부의 시각적 연속성 강화.
- **결과/영향**: 섹션 간의 흐름이 더 자연스러워졌으며, 모바일 기기에서 텍스트가 과도하게 크게 표시되는 현상을 해결하여 한 화면에 더 많은 정보를 쾌적하게 노출.

## [2026-04-02 11:20:00] UI/UX Refinement: Navbar & LoginForm Responsiveness

- **작업 내용**: 해상도 별 내비게이션 바 및 로그인 폼 레이아웃 깨짐 현상 수정
- **상세 변경 내역**:
  - `Navbar.tsx`: 네비 링크 컨테이너에 `flex-nowrap` 및 텍스트에 `whitespace-nowrap` 적용. 패딩(`14px 28px 14px 36px`) 및 간격(`16px`) 축소로 중간 해상도 공간 확보.
  - `LoginForm.tsx`: 하단 유틸리티 영역(체크박스, 비밀번호 찾기)에 `flex-wrap` 및 `gap-y-2` 적용. 텍스트에 `whitespace-nowrap` 및 모바일 대응 폰트 크기 조정(`11px`)으로 줄바꿈 문제 해결.
- **결과/영향**: 모바일 및 태블릿 환경에서의 UI 완성도가 향상되었으며, 텍스트가 세로로 깨지는 시각적 결함 제거.

## [2026-04-02 11:10:00] Smart Navigation: "Record Activity" & Nearest Toilet Auto-Open

- **작업 내용**: 메인 CTA 버튼 연동 및 위치 기반 가장 가까운 화장실 자동 팝업 기능 구현
- **상세 변경 내역**:
  - `HeroSection.tsx`: 버튼 텍스트를 '기록하러 가기'로 변경하여 직관성 강화.
  - `MainPage.tsx`: CTA 클릭 액션을 단순 스크롤에서 `/map?openNearest=true` 경로 이동으로 업그레이드.
  - `MapPage.tsx`: `useSearchParams`로 파라미터 감지 후 Geolocation을 통해 5km 내 최단 거리 화장실 자동 선택 및 팝업 노출 로직 추가.
- **결과/영향**: 사용자의 위치에 따른 즉각적인 화장실 정보 제공으로 서비스 체류 시간 및 활동 기록 전환율 향상 기대.

## [2026-04-02 10:45:00] Social Signup Authentication Flow Optimization

- **작업 내용**: 소셜 회원가입 완료 시 사용자 정보 자동 갱신 및 상태 동기화 로직 개선
- **상세 변경 내역**:
  - `SocialSignupPage.tsx`: `localStorage.setItem`을 사용한 수동 토큰 저장 방식을 `AuthContext`의 `login` 함수 호출로 대체.
  - 가입 성공 즉시 `await login(accessToken, refreshToken)`을 수행하여 `/auth/me` API를 통한 최신 유저 정보 동기화 보장.
- **결과/영향**: 소셜 회원가입 직후 메인 페이지 이동 시 사용자 프로필 및 인증 상태가 즉시 반영되어 초기 사용자 경험(UX) 향상.

## [2026-04-02 10:00:00] Frontend Performance Optimization & Bundle Size Reduction (6-Step Roadmap)

- **작업 내용**: 애니메이션 끊김(Jank) 현상 해결 및 프론트엔드 로딩 성능 획기적 개선 (번들 용량 1.22MB -> 411KB, 약 66% 절감)
- **상세 변경 내역**:
  - **1단계 (진단)**: `rollup-plugin-visualizer` 도입을 통해 비대한 번들 구조 분석 및 베이스라인 측정.
  - **2단계 (Framer Motion 최적화)**: `LazyMotion` + `domAnimation` 적용으로 애니메이션 엔진을 동적 로드하도록 변경. 모든 `motion` 컴포넌트를 `m`으로 교체하고 `left/top` 애니메이션을 `transform(x, y)` 기반으로 전면 수정하여 브라우저 리플로우(Reflow) 제거.
  - **3단계 (코드 스플리팅)**: `App.tsx`에서 `React.lazy()`와 `Suspense`를 사용하여 모든 페이지 컴포넌트를 청크로 분리. 초기 로딩 시 필요한 코드만 다운로드되도록 최적화.
  - **4단계 (렌더링 효율화)**: `AuthContext`의 `value`에 `useMemo`를 적용하여 불필요한 리렌더링 방지. `MapView.tsx`에 `React.memo` 적용 및 마커 업데이트 로직을 ID 기반 `diffing` 방식으로 고도화하여 지도 이동 성능 개선.
  - **5단계 (에셋 최적화)**: `vite-plugin-imagemin` 설치 및 설정을 통해 빌드 시 이미지 리소스 자동 압축 파이프라인 구축.
  - **6단계 (결과 검증)**: 빌드 결과 메인 번들 크기가 **1.22MB에서 411KB로 약 66% 감소**하였으며, 핵심 페이지 이탈률 방지를 위한 로딩 속도 최적화 완료.
- **결과/영향**: 저사양 기기 및 모바일 환경에서도 끊김 없는 60fps 애니메이션을 보장하며, 서비스 진입 속도가 대폭 향상됨.

## [2026-04-02 09:47:00] Map Toilet Marker Design Consistency & Clarity Improvement

- **작업 내용**: 화장실 마커 디자인 일관성 확보 및 렌더링 선명도(Blur 제거) 고도화
- **상세 변경 내역**:
  - `MapView.tsx`: 24시간 운영 화장실(`isOpen24h`)에만 부여되던 금색 `outline`을 제거하여 전체 마커의 디자인 일관성 통일.
  - `MapView.tsx`: 마커 컨테이너에서 흐릿함을 유발하던 하드웨어 가속 설정(`will-change`, `transform: translateZ(0)`, `contain: strict`)을 제거하여 외곽선 선명도 개선.
  - `MapView.tsx`: `box-shadow`를 보다 정교하고 얇게 재조정하고, `-webkit-font-smoothing` 및 `backface-visibility: hidden` 설정을 추가하여 이모지와 마커가 번져 보이지 않도록 최적화.
  - `MapView.tsx`: 마커 하단 화살표 영역에 `drop-shadow` 필터를 적용하여 입체감과 가독성 향상.
- **결과/영향**: 지도의 모든 마커가 일정한 톤앤매너로 표시되며, 고해상도 디스플레이에서도 뭉개짐 없이 선명하고 프리미엄한 화장실 위치 정보를 제공함.

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
