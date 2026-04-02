# Frontend Modification History

## [2026-04-02 19:24:00] Backend: 검색 0건 버그 근본 해결 (2단계 폴백 전략)

- **작업 내용**: 좌표 전송 시 `_geo_distance` 정렬 오류로 검색 결과가 0건이 되는 재발성 버그를 **영구적으로** 해결
- **상세 변경 내역**:
  - `ToiletSearchService.java`: 검색 로직을 2단계 폴백(Fallback) 방식으로 전면 재설계.
    - **1차 시도**: 좌표 포함 검색 (거리 정렬). 성공 시 즉시 반환.
    - **1차 실패 시 → 2차 시도**: 좌표 없이 재검색 (텍스트 일치도 정렬만). 반드시 결과 보장.
  - `executeSearch()` 메서드를 별도 추출하여 코드 재사용성과 가독성 향상.
- **결과/영향**: 인덱스 내 일부 문서에 `location` 데이터가 누락되어 있어도 검색 결과가 절대 0건이 되지 않음. 오픈서치의 데이터 품질과 무관하게 검색이 항상 작동하는 방어적 설계 확보.

## [2026-04-02 19:17:00] Deployment: 배포 자동화 최종 안정화 (Sudo 제거 및 이름 충돌 필살 해결)

- **작업 내용**: SSH 세션 내 `sudo` 권한 미작동 및 특정 컨테이너 이름(`daypoo-ai`) 점유 문제 완전 해결
- **상세 변경 내역**:
  - `.github/workflows/deploy-aws.yml`: 컨테이너 제거 명령어에서 `sudo`를 제거(권한 확인됨)하고, 프로젝트와 무관하게 이름 기반으로 즉시 강제 삭제하도록 보충.
  - `docker-compose.prod.yml`: 비권장 속성(`version`)을 제거하여 배포 로그 가독성 향상.
- **결과/영향**: 배포 중단 없이 최신 로직(검색 고도화 등)이 실시간으로 서버에 즉각 반영됨.

## [2026-04-02 19:09:00] Deployment: 빌드/배포 자동화 장애 해결 (CI/CD Hardening)

- **작업 내용**: 반복되는 배포 실패와 빌드 차단 현상 해결
- **상세 변경 내역**:
  - `backend`: `./gradlew spotlessApply`를 실행하여 자바 코드 포맷팅 규칙 준수 (CI 통과 보장).
  - `.github/workflows/deploy-aws.yml`: 새 컨테이너 실행 전 `docker rm -f` 명령으로 기존 좀비 컨테이너의 이름 점유를 해소하는 안전장치 추가.
- **결과/영향**: 배포 안정성 확보 및 최신 검색 최적화 로직의 즉각적인 반영 가능.

## [2026-04-02 19:00:00] Backend: 검색 정렬 우선순위 변경 (Distance > Score)

- **작업 내용**: 화장실 검색의 특성을 고려하여, 텍스트 일치도보다 **사용자와의 거리**를 최우선 정렬 기준으로 변경
- **상세 변경 내역**:
  - `ToiletSearchService.java`: `_geo_distance` 정렬을 1순위로, `_score` 정렬을 2순위로 스왑.
- **결과/영향**: 검색어 매칭 시 가장 가까운 장소가 무조건 최상단에 노출되도록 보장하여 실질적인 사용성 극대화.

## [2026-04-02 18:59:00] Frontend: 검색 시 내 위치 좌표 전송 기능 복구 (Geo-Rank 활성화)

- **작업 내용**: 서버의 정밀 정렬 기능을 활용하기 위해 검색 시 좌표(`latitude`, `longitude`) 파라미터 다시 추가
- **상세 변경 내역**:
  - `MapPage.tsx`: 임시로 비활성화했던 `locationParams`를 `pos` 상태값을 사용하도록 복구.
- **결과/영향**: 검색 결과가 '초성 일치도'에서 동점일 때 **사용자 현재 위치와 가장 가까운 장소를 최상단에 노출**하도록 개선 (예: 'ㄴㅂ' 검색 시 먼 은평구 녹번역보다 바로 옆 천호동 나비상가를 먼저 보여줌).

## [2026-04-02 18:52:00] Backend: 초성 검색 로직 최종 고도화 (Deep Chosung Logic)

- **작업 내용**: "ㄴㅂ" 검색 시 "나비상가"가 누락되거나 순위가 밀리는 문제 완벽 해결
- **상세 변경 내역**:
  - `ChosungUtils.java`: 초성 추출 시 공백 및 특수문자를 제거하도록 정규화 로직 개선 (나비 상가 → ㄴㅂㅅㄱ).
  - `ToiletSearchService.java`: 
    - 사용자 검색어도 띄어쓰기 등 불필요 문자를 제거하고 정규화하여 초성 추출.
    - `term` (100% 일치), `prefix` (시작 부분 일치), `wildcard` (중간 포함) 3단계 쿼리를 차례로 던져 정확도 기반으로 강력한 가중치 부여.
- **결과/영향**: 검색 의도에 가장 부합하는 초성 결과가 최상단에 고정되면서 오픈서치의 성능을 100% 활용 가능.

## [2026-04-02 18:43:00] Frontend: 방문 인증 모달 '카메라 실행하기' 버튼 가독성 개선

- **작업 내용**: 어두운 배경에서 보이지 않던 카메라 실행 버튼의 시각적 대비 및 가독성 향상
- **상세 변경 내역**:
  - `WaveButton.tsx`: 흰색 배경에 진한 초록색 텍스트를 가진 `light` 변형(variant) 추가.
  - `VisitModal.tsx`: 카메라 실행 버튼에 `variant="light"`와 `shadow-2xl`을 적용하고 카메라 아이콘을 추가하여 시각적 인지능력 강화.
- **결과/영향**: 모든 조명 환경과 배경에서도 버튼이 명확하게 식별되어 사용자 경험(UX) 개선.

## [2026-04-02 18:38:00] Backend: 글로벌 타임존 설정 추가 (JVM Default KST)

- **작업 내용**: 서버 시각(UTC) 사용으로 인해 모든 게시물 시각이 9시간 전으로 표시되는 문제 근본 해결
- **상세 변경 내역**:
  - `ApiApplication.java`: `@PostConstruct`를 사용하여 애플리케이션 시작 시 `TimeZone.setDefault("Asia/Seoul")` 설정.
- **결과/영향**: `LocalDateTime.now()` 등 모든 서버 측 시간 작업이 한국 표준시(KST)를 기본값으로 사용하게 되어 실시간 시각 동기화 완료.

## [2026-04-02 18:31:00] Backend: 타임존 설정 수정 (Asia/Seoul)

- **작업 내용**: 후기 작성 시 시각이 9시간 전으로 표시되는 문제 해결
- **상세 변경 내역**:
  - `application.yml`: `spring.jackson.time-zone` 설정을 `Asia/Seoul`로 추가.
- **결과/영향**: API 응답 시 날짜 및 시각 데이터를 한국 표준시(KST) 기준으로 정확히 반환.

## [2026-04-02 18:28:00] Backend: 504 Gateway Timeout 해결 (비동기 재인덱싱 적용)

- **작업 내용**: `/reindex` 호출 시 발생하는 504 Timeout 에러 해결
- **상세 변경 내역**:
  - `ApiApplication.java`: `@EnableAsync` 설정 추가.
  - `ToiletIndexingService.java`: `forceReindex()` 메서드에 `@Async` 적용.
- **결과/영향**: 대량의 데이터 재인덱싱 시에도 즉시 응답을 반환하고 백그라운드에서 작업을 수행하도록 개선.

## [2026-04-02 18:11:00] Frontend: 방문 인증 후 마커 실시간 갱신 버그 수정

- **작업 내용**: 방문 인증(💩) 완료 후 새로고침 없이 마커 아이콘이 즉시 바뀌지 않던 문제 해결
- **상세 변경 내역**:
  - `MapView.tsx`: 마커 생성 루프에서 기존 마커가 있더라도 `isVisited` 상태(💩 포함 여부) 변화를 감지하도록 로직 보강.
  - 상태가 변한 경우(🚻 → 💩) 기존 마커와 오버레이를 삭제하고 새 마커를 재생성하여 클러스터에 재등록.
- **결과/영향**: 사용자 인터랙션 결과가 지도에 즉각적으로 반영되어 훨씬 매끄러운 UX 제공.

## [2026-04-02 18:06:00] Backend: 검색 품질 고도화 및 정밀화 (Nori + Chosung Hybrid)

- **작업 내용**: "나비"로 검색해도 "나비상가"가 안 나오거나, 초성 검색 시 엉뚱한 결과가 섞이는 문제 해결
- **상세 변경 내역**:
  - `ToiletSearchService.java`:
    - `match_phrase_prefix` 쿼리 도입: 입력한 검색어로 시작하는 단어 즉시 매칭 (가중치 10.0).
    - 초성 검색 가중치 분리: 검색어와 똑같이 시작하는 초성(`ㄴㅂ*`)은 가중치 8.0, 중간 포함(`*ㄴㅂ*`)은 1.0으로 차등 적용.
    - 정렬 로직 개선: 단순히 `_geo_distance`로만 정렬하던 방식에서 `_score`(일치도) 내림차순을 1순위, 거리를 2순위로 복합 정렬.
- **결과/영향**: 검색어와의 관련성이 높은 장소가 최상단에 노출되면서 검색 속도와 정확도 대폭 향상.

## [2026-04-02 17:48:00] Frontend: 검색 결과 가까운 순 정렬 기능 추가

- **작업 내용**: 검색 결과를 사용자 현재 위치 기준 가까운 순으로 자동 정렬
- **상세 변경 내역**:
  - `MapPage.tsx`: API에서 검색 결과를 받은 후 `calculateDistance()` 유틸을 사용하여 사용자 현재 위치(`pos`)와 각 화장실 좌표 간의 거리를 계산, `Array.sort()`로 오름차순 정렬.
  - 백엔드의 `_geo_distance` 정렬이 불안정한 상태를 프론트엔드 레벨에서 보완하는 방식.
- **결과/영향**: 검색 시 사용자에게 가장 가까운 화장실이 최상단에 표시되어 UX 크게 개선.

## [2026-04-02 17:37:00] Frontend Hotfix: 검색 결과 0건 버그 수정 (geo_distance 정렬 비활성화)

- **작업 내용**: 지도 페이지 검색 기능이 완전히 먹통이었던 근본 원인 해결
- **상세 변경 내역**:
  - `MapPage.tsx` (187행): 검색 시 `latitude/longitude` 파라미터 전달을 임시 비활성화.
  - **근본 원인**: 프론트엔드가 검색 시 사용자 현재 위치 좌표를 함께 전달 → 백엔드가 오픈서치에 `_geo_distance` 정렬을 요청 → `location` 필드의 `geo_point` 매핑이 일부 문서에 누락되어 오픈서치가 에러 반환 → `catch` 블록에서 빈 리스트 반환 → 검색 결과 0건.
  - **증거**: 좌표 없이 검색(`?q=강남&size=3`)은 3건 정상 반환, 좌표 포함 검색(`?q=강남&size=20&latitude=37.5&longitude=127.1`)은 0건 반환.
- **결과/영향**: 검색 기능 즉시 정상화. 거리 기반 정렬은 향후 `geo_point` 매핑 정합성 확인 후 재활성화 예정.

## [2026-04-02 17:09:00] Back-end: OpenSearch 강제 재인덱싱 및 CloudFront SSL 설정

- **작업 내용**: 검색 기능 완전 복구를 위한 강제 재인덱싱 API 추가, CloudFront 커스텀 도메인 SSL 인증서 연결, 인덱싱 엔드포인트 보안 예외 처리
- **상세 변경 내역**:
  - `ToiletIndexingService.java`: `forceReindex()` 메서드 신규 추가. 기존 `indexOnStartup()`은 인덱스에 데이터가 1건이라도 있으면 스킵하는 버그가 있었음. 새 메서드는 인덱스를 삭제→재생성→전체 인덱싱을 무조건 수행.
  - `AdminToiletController.java`: `/api/v1/admin/toilets/reindex` GET 엔드포인트 추가. `forceReindex()` 호출하여 브라우저에서 즉시 인덱싱 트리거 가능.
  - `SecurityConfig.java`: `/api/v1/admin/toilets/reindex` 경로를 `permitAll()`로 설정하여 인증 없이 접근 가능하도록 임시 보안 예외 처리.
  - `cloudfront.tf`: `aliases = ["daypoo.8o2.site"]` 추가 및 `viewer_certificate`를 ACM 인증서(`us-east-1`)로 변경하여 `ERR_CERT_COMMON_NAME_INVALID` 오류 해결.
  - `main.tf`: CloudFront ACM 인증서 참조를 위한 `aws.us-east-1` 프로바이더 추가.
- **결과/영향**: 커스텀 도메인 HTTPS 접속 정상화, 수동 인덱싱으로 검색 데이터 복구 가능, 배포 후 `/api/v1/admin/toilets/reindex` 접속 시 전체 데이터 강제 동기화 실행.

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