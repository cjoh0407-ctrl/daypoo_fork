# 🚀 프론트엔드 성능 및 애니메이션 최적화 계획서

본 계획서는 서비스의 애니메이션 끊김(Jank) 현상을 해결하고 전반적인 성능을 극대화하기 위한 6단계 최적화 과정을 상세히 정의합니다.

## 📅 작업 일정 및 단계

### [1단계] 진단 및 초기 측정
- **도구 설치**: `rollup-plugin-visualizer` 설치 및 `vite.config.js` 연동
- **기준 측정**: 초기 번들 크기 및 핵심 페이지(메인, 지도)의 성능 지표 기록
- **병목 식별**: Framer Motion 오남용 사례, 불필요한 번들 중복, 리렌더링 과다 발생 지점 분석

### [2단계] Framer Motion 고도화 (애니메이션 최적화)
- **속도 향상**: `width/height` 등 레이아웃 속성을 `transform(x, y, scale)` 및 `opacity`로 전면 교체
- **Lazy Loading**: `motion`을 `LazyMotion` + `m` 패턴으로 전환 (`features.ts` 동적 로드)
- **전환 최적화**: `AnimatePresence`의 `exit` 시간을 0.3초 이하로 단축 및 `mode="popLayout"` 적용
- **하드웨어 가속**: 핵심 요소(모달, 페이지 전환)에만 `willChange="transform"` 전략적 적용

### [3단계] 코드 스플리팅 및 지연 로딩
- **페이지 분할**: `src/pages/` 내 모든 컴포넌트 `React.lazy()` 적용 및 `Suspense` 스켈레톤 UI 구축
- **미리 로드(Preload)**: 내비게이션 hover 시 핵심 페이지 번들 미리 로드 로직 구현
- **컴포넌트 분리**: 카카오맵, VisitModal, 차트 등 무거운 컴포넌트 동적 import 적용
- **청크 전략**: `vite.config.js`의 `manualChunks`를 세분화 (react-vendor, animation, map 등)

### [4단계] React 렌더링 효율화
- **컨텍스트 최적화**: 모든 Context Provider의 `value`를 `useMemo`로 래핑하여 불필요한 전파 방지
- **메모이제이션**: 지도 마커, 리스트 아이템 등 반복 요소에 `React.memo` 적용
- **핸들러 최적화**: `useCallback`으로 이벤트 핸들러 참조 고정 및 무거운 계산 `useMemo` 적용
- **지도 최적화**: `MapView` 리렌더링 고립화 및 마커 업데이트 시 SDK API를 직접 호출하여 React 사이클 우회

### [5단계] 에셋 및 자원 최적화
- **이미지 압축**: 빌드 시 `vite-plugin-imagemin` 적용 및 주요 이미지를 WebP로 변환
- **지연 로드**: 하단 에셋에 `loading="lazy"` 적용 및 초기 에셋은 `eager` 모드 설정
- **기타 최적화**: SVG 컴포넌트화(`vite-plugin-svgr`) 및 Tailwind CSS 4 퍼지 설정 점검

### [6단계] 빌드 검증 및 최종 보고
- **빌드 테스트**: `npm run build` 실행 및 청크별 크기 변화 요약
- **사용자 시나리오 검증**: 메인 → 로그인 → 지도 → 랭킹 탐색 시 애니메이션 유연성 직접 확인
- **결과 보고서 작성**: 번들 크기 비교 및 적용 기술 목록 정리

---

## ⚠️ 주의 및 준수 사항
1. **무오류 지향**: 각 단계 완료 후 `npm run dev`로 기능 정상 작동을 확인합니다.
2. **이력 기록**: 모든 유의미한 코드 수정은 `docs/frontend-modification-history.md`에 기록합니다.
3. **코드 품질**: 작업 완료 시 `npm run lint`를 실행하여 포맷을 정리합니다.
4. **배포**: 수정 사항은 최종적으로 `git push`하여 배포 서버에 반영합니다.
