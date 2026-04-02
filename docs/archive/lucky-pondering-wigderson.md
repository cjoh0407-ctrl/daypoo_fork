# DayPoo QA 이슈 분류 및 디버깅 가이드

## Context
프론트엔드-백엔드 연동 테스트 및 전반적인 QA 과정에서 발견된 15개 이슈에 대해, 코드 분석을 기반으로 **책임 소재 분류**, **근본 원인 분석**, **프론트엔드/백엔드 각각의 체크리스트**를 제공합니다.

---

## 1. 이슈 분류 요약표

| # | 이슈 | 프론트엔드 | 백엔드 | 기획/UX |
|---|------|:---------:|:------:|:-------:|
| 1-1 | 관리자 새로고침 시 오류 | **주** | 부 | |
| 1-2 | 검색란 흰색 글씨 | **주** | | |
| 1-3 | 관리자 진입 동선 UX | | | **주** |
| 1-4 | 플랜 설명 동일 출력 | **주** | | |
| 2-1 | 유저 관리 페이징/필터 실패 | **주** | 점검 | |
| 2-2 | 톱니바퀴 관리 창 미작동 | **주** | | |
| 3-1 | 화장실 목록 보기 버튼 미작동 | **주** | | |
| 3-2 | 고객 지원 페이징 미작동 | **주** | 점검 | |
| 3-3 | 답변하기/답변완료 미작동 | **주** | | |
| 4-1 | 상점 필터링 오류 | **주** | **주** | |
| 4-2 | 아이템 등록/이미지 업로드 실패 | **주** | 부 | |
| 4-3 | 보안 프로토콜 제어 미작동 | **주** | 부 | **주** |
| 5-1 | 결제 요청 실패 | 점검 | **주** | |
| 5-2 | 카메라 인증 후 방문 미완료 | **주** | 점검 | |
| 5-3 | 방문 인증 후 마커 색상 미반영 | **주** | | |

---

## 2. 상세 원인 분석

### [1-1] 관리자 새로고침 시 오류
- **원인**: React SPA(BrowserRouter)에서 `/admin` 경로로 직접 접근/새로고침하면, 서버가 해당 경로의 HTML을 반환하지 못함
- **추가 원인**: 새로고침 시 AuthContext가 초기화되며, `user.role === 'ROLE_ADMIN'` 체크가 완료되기 전에 리다이렉트될 가능성
- **프론트**: Vite 프록시 설정(`vite.config.js`)에 `historyApiFallback` 미설정, 배포 환경 Nginx에서 `try_files $uri /index.html` 미설정
- **백엔드**: Spring Security에서 SPA fallback 라우팅 미처리 가능

### [1-2] 검색란 흰색 글씨
- **원인**: `AdminPage.tsx:1311` - `globalSearch` 입력 필드의 text color가 지정되지 않았거나 배경과 동일한 흰색으로 설정됨
- **순수 프론트 CSS 이슈**: `text-white` 또는 Tailwind 기본 스타일에 의한 문제

### [1-4] 플랜 설명 동일 출력
- **원인**: `PremiumPage.tsx:14-65` 코드 확인 결과, 각 플랜의 `desc`와 `features`는 서로 다르게 정의되어 있음. 단, features의 `ok: true/false` 시각적 구분이 불명확할 수 있음
- **프론트**: 렌더링 로직에서 `ok: false` 항목이 충분히 구분되지 않는 UI 문제

### [2-1] 유저 관리 페이징/필터링 실패
- **원인 가능성 1**: `apiClient.ts`의 응답 파싱 - Spring의 `Page` 객체 응답을 `PageResponse<T>`로 올바르게 매핑하지 못할 수 있음
- **원인 가능성 2**: API 응답이 `{ data: { content: [...], totalPages: ... } }` 형태인데, `api.get`이 내부적으로 `data`를 언래핑하면서 구조가 달라질 수 있음
- **백엔드 코드**: `AdminManagementService.getUsers()` - JPA Specification 기반 쿼리는 정상 구현됨

### [2-2] 톱니바퀴 아이콘 미작동
- **원인**: `AdminPage.tsx:452` - 톱니바퀴 버튼에 `onClick` 핸들러가 없음. 빈 `<button>` 태그
- **순수 프론트 이슈**: 유저 상세 모달/패널 구현 필요

### [3-1] 화장실 목록 보기 버튼 미작동
- **원인**: `AdminPage.tsx:572` - "전체 화장실 목록 보기" 버튼에 `onClick` 핸들러가 없음
- **순수 프론트 이슈**

### [3-2] 고객 지원 페이징 미작동
- **원인**: CsView의 페이징 코드(`AdminPage.tsx:907-927`)는 정상 구현됨. 2-1과 동일한 API 응답 파싱 이슈일 가능성이 높음
- **백엔드**: `AdminInquiryController` 및 `AdminManagementService.getInquiries()` 정상 구현 확인

### [3-3] 답변하기/답변완료 미작동
- **핵심 원인**: `AdminPage.tsx:895` - "답변하기" 버튼에 **onClick 핸들러가 없음**. API 호출 로직 자체가 미구현
- **백엔드**: `POST /api/v1/admin/inquiries/{id}/answer` 엔드포인트는 정상 구현됨
- **순수 프론트 이슈**: 답변 입력 모달 + API 호출 로직 구현 필요

### [4-1] 상점 필터링 오류 (핵심 버그)
- **근본 원인: 프론트-백엔드 타입 불일치**
  - **프론트** (`admin.ts:5`): `ItemType = 'TITLE' | 'AVATAR' | 'EFFECT'`
  - **백엔드** (`ItemType.java`): `AVATAR_SKIN, MARKER_SKIN`
  - 프론트가 `?type=TITLE`을 보내면, 백엔드에서 enum 매핑 실패 → 필터 무시되거나 에러
- **수정 필요**: 양쪽 타입을 일치시켜야 함

### [4-2] 아이템 등록/이미지 업로드 실패
- **원인**: `AdminPage.tsx:1200-1252` - AddItemView가 **완전히 정적 UI**
  - input/select에 state 바인딩 없음
  - "등록 완료" 버튼에 onClick 핸들러 없음 (API 호출 미구현)
  - 이미지 업로드 UI만 있고 실제 파일 업로드 로직 없음
- **백엔드**: `createItem` API는 존재하나, 이미지는 URL 문자열로 저장. 파일 업로드 엔드포인트 부재(S3 등 미설정)

### [4-3] 보안 프로토콜 제어 미작동
- **원인**: `AdminPage.tsx:1156-1170` - 토글 스위치가 **완전히 정적 UI** (하드코딩된 데이터, state/onClick 없음)
- **백엔드**: 보안 프로토콜 제어 관련 API 엔드포인트 자체가 존재하지 않음
- **기획 필요**: 실제 구현 범위와 우선순위 결정 필요

### [5-1] 결제 요청 실패
- **원인 가능성**:
  1. `toss.secret-key` 환경변수 미설정 또는 잘못된 값 → `PaymentService.validateSecretKey()` 실패
  2. `VITE_TOSS_CLIENT_KEY` 환경변수 미설정 → Toss SDK 초기화 실패
  3. Toss 테스트 모드에서의 API 키 형식 문제
- **백엔드 우선 점검**: 로그에서 `TOSS_SECRET_KEY is missing` 또는 Toss API 401 에러 확인

### [5-2] 카메라 인증만으로 방문 인증 미완료
- **원인**: `VisitModal.tsx:122-125` - `handleNext()`에서 `canComplete` 체크가 있어, 60초 체류 시간이 경과하지 않으면 촬영 후에도 완료 불가
- **추가**: 프론트에서 촬영 후 "바로 인증 완료" 버튼이 `disabled={!canComplete}`로 되어 있어, 타이머 상태에 따라 비활성화됨
- **논의 필요**: "카메라 인증 = 체류 증명" 으로 간주할지 기획 결정 필요

### [5-3] 방문 인증 후 마커 색상 미반영
- **원인**: `useToilets.ts:147-151` - `markVisited`가 로컬 state만 업데이트. MapView의 마커 렌더링이 이 state 변경에 반응하지 않을 수 있음 (Kakao Maps 오버레이 직접 DOM 조작 시 React 리렌더와 동기화 안 됨)
- **순수 프론트 이슈**: 마커 오버레이를 React state와 동기화하는 로직 필요

---

## 3. 백엔드 체크리스트

> 창준님이 직접 확인해야 할 항목

### 긴급 (블로커)

#### [5-1] 결제 실패 디버깅
- [ ] `application.yml`에서 `toss.secret-key` 값이 올바르게 설정되어 있는지 확인
- [ ] 서버 로그에서 `TOSS_SECRET_KEY is missing` 메시지 검색
- [ ] Toss 테스트 모드 시크릿 키 형식: `test_sk_` 접두사 확인
- [ ] `PaymentService.createHeaders()` - Basic Auth 인코딩이 올바른지 확인 (`secretKey + ":"` 형식)
- [ ] `PaymentController`에서 인증된 사용자의 email을 올바르게 전달하는지 확인
- [ ] RestTemplate 타임아웃(connect 5s, read 30s) 내에 Toss API가 응답하는지 확인

#### [4-1] ItemType enum 불일치 수정
- [ ] 현재 백엔드: `AVATAR_SKIN, MARKER_SKIN` (2종류)
- [ ] 프론트엔드 기대값: `TITLE, AVATAR, EFFECT` (3종류)
- [ ] **결정 필요**: 백엔드 enum을 프론트에 맞출지, 프론트를 백엔드에 맞출지
- [ ] 선택지 A: 백엔드 ItemType을 `TITLE, AVATAR, EFFECT`로 변경 + DB 마이그레이션
- [ ] 선택지 B: 프론트 타입을 `AVATAR_SKIN, MARKER_SKIN`으로 변경
- [ ] `ItemRepository.findAllByType()` 쿼리가 enum 불일치 시 에러를 던지는지 vs 빈 결과를 반환하는지 확인

### 중요

#### [1-1] SPA 라우팅 지원
- [ ] Spring Security 설정에서 `/admin` 등 프론트 라우트에 대해 `index.html`로 포워딩하는 설정 존재 여부 확인
- [ ] 배포 환경(Nginx 등)에서 `try_files $uri $uri/ /index.html` 설정 확인
- [ ] Spring Boot에서 `WebMvcConfigurer.addViewControllers()`로 SPA fallback 구현 고려

#### [4-2] 이미지 업로드 지원
- [ ] 현재 아이템 이미지는 `imageUrl` (VARCHAR)로 URL만 저장
- [ ] 파일 업로드 필요 시: S3 버킷 설정 + `MultipartFile` 처리 엔드포인트 추가
- [ ] 또는 외부 이미지 호스팅 URL을 프론트에서 직접 입력하는 방식으로 결정

#### [2-1, 3-2] 페이징 API 응답 확인
- [ ] Swagger UI에서 `/admin/users?page=0&size=20` 직접 호출하여 응답 구조 확인
- [ ] Spring `Page` 객체의 JSON 직렬화 결과가 프론트의 `PageResponse<T>` 인터페이스와 일치하는지 확인
- [ ] 특히 `content`, `totalElements`, `totalPages`, `number` 필드명 일치 여부

### 참고

#### [5-2] 체류 시간 정책 확인
- [ ] `LocationVerificationService.hasStayedLongEnough()` - 60초 체류 요구사항이 의도된 것인지 확인
- [ ] 카메라 촬영 완료 시 체류 시간을 면제할지 기획 논의

---

## 4. 프론트엔드 체크리스트 (팀원 전달용)

> 프론트엔드 팀원에게 전달할 수정 요청 사항

### 긴급 (블로커)

#### [4-1] 상점 ItemType 타입 불일치 수정
- **파일**: `frontend/src/types/admin.ts:5`
- **현재**: `export type ItemType = 'TITLE' | 'AVATAR' | 'EFFECT';`
- **문제**: 백엔드 enum은 `AVATAR_SKIN, MARKER_SKIN` (2종류)
- **수정**: 백엔드와 협의 후 타입 일치시키기 (백엔드 enum 변경 시 프론트도 맞춤)
- **영향 범위**: `StoreView`, `AddItemView`, 필터 버튼 라벨 전부 수정 필요

#### [3-3] 답변하기 기능 구현
- **파일**: `frontend/src/pages/AdminPage.tsx:895`
- **현재**: `<button>` 클릭 이벤트 없음 (정적 UI)
- **필요 구현**:
  1. 문의 상세 조회 모달 (GET `/admin/inquiries/{id}`)
  2. 답변 입력 폼 + 제출 (POST `/admin/inquiries/{id}/answer` with `{ answer: string }`)
  3. 상태 갱신 후 리스트 리패치

#### [2-2] 유저 관리 톱니바퀴 버튼 구현
- **파일**: `frontend/src/pages/AdminPage.tsx:452`
- **현재**: `onClick` 핸들러 없음
- **필요 구현**: 유저 상세 모달 (GET `/admin/users/{id}`) + 역할 변경 기능 (PATCH `/admin/users/{id}/role`)

#### [4-2] 아이템 등록 폼 기능 구현
- **파일**: `frontend/src/pages/AdminPage.tsx:1200-1252`
- **현재**: 모든 input이 state 바인딩 없는 정적 UI, 제출 로직 없음
- **필요 구현**:
  1. `useState`로 폼 상태 관리 (name, description, type, price, imageUrl)
  2. "등록 완료" 버튼에 `onClick` → POST `/admin/shop/items` API 호출
  3. 이미지: URL 직접 입력 or 파일 업로드 (백엔드와 협의)

### 중요

#### [1-1] 관리자 페이지 새로고침 오류
- **파일**: `frontend/src/pages/AdminPage.tsx` + `frontend/src/context/AuthContext.tsx`
- **확인사항**:
  1. AuthContext의 `loading` 상태가 true일 때 리다이렉트하지 않도록 가드 로직 확인
  2. `AdminPage` 상단의 인증 체크에서 `loading` 중일 때 early return하는지 확인
  3. Vite 빌드 후 배포 시 SPA fallback 설정 (`nginx.conf` 또는 서버 설정)

#### [1-2] 검색란 흰색 글씨 수정
- **파일**: `frontend/src/pages/AdminPage.tsx:1311` 근처 globalSearch 입력 필드
- **원인**: input의 `text-color`가 배경과 동일하거나 미지정
- **수정**: Tailwind 클래스에 `text-black` 또는 `text-[#1A2B27]` 명시적 추가

#### [3-1] 화장실 목록 보기 버튼 연결
- **파일**: `frontend/src/pages/AdminPage.tsx:572`
- **현재**: `<button>전체 화장실 목록 보기</button>` - onClick 없음
- **수정**: 검색/필터링이 포함된 화장실 전체 목록 뷰로 이동하는 핸들러 추가 (또는 `setActiveTab('toilets')` 연결)

#### [2-1, 3-2] 페이징 작동 확인
- **파일**: `frontend/src/services/apiClient.ts`
- **확인사항**:
  1. `api.get()` 응답 파싱에서 Spring `Page` JSON 구조를 올바르게 매핑하는지 확인
  2. 응답 구조: `{ content: [...], totalPages: N, totalElements: N, ... }` ← 이것이 `data` 래핑 없이 바로 오는지, 아니면 `{ data: { content: [...] } }` 형태인지
  3. 브라우저 DevTools Network 탭에서 실제 응답 구조 확인 후 `PageResponse<T>` 타입과 대조

#### [5-3] 방문 인증 후 마커 색상 동기화
- **파일**: `frontend/src/hooks/useToilets.ts:147` + `frontend/src/components/map/MapView.tsx`
- **원인**: `markVisited()`가 React state를 업데이트하지만, Kakao Maps 오버레이는 직접 DOM이라 React 리렌더에 반응하지 않을 수 있음
- **수정**: MapView에서 `toilets` prop/state 변경 시 해당 마커 오버레이의 배경색/아이콘을 업데이트하는 useEffect 추가

#### [5-2] 카메라 촬영 후 인증 완료 흐름
- **파일**: `frontend/src/components/map/VisitModal.tsx:306`
- **현재**: "바로 인증 완료" 버튼이 `disabled={!canComplete}` → 60초 미경과 시 비활성
- **확인**: 기획 의도에 따라 카메라 촬영 완료 시 `canComplete = true`로 설정하는 로직 추가 검토

### 참고 (UX 개선)

#### [1-3] 관리자 진입 동선 UX
- 메인 페이지에서 관리자 페이지로의 진입 버튼 위치/표시 조건 기획 필요
- ROLE_ADMIN 유저에게만 네비게이션에 관리자 메뉴 노출

#### [1-4] 플랜 설명 텍스트 구분
- **파일**: `frontend/src/pages/PremiumPage.tsx:14-65`
- **현재**: 각 플랜의 `desc`는 다르지만, features의 `ok: true/false` 시각적 구분이 불충분할 수 있음
- **수정**: `ok: false` 항목에 `line-through`, 회색 처리 등 시각적 차별화 강화

#### [4-3] 보안 프로토콜 제어
- 현재 UI만 존재 (하드코딩 데이터), 백엔드 API도 없음
- 기획 단계에서 실제 구현 범위 결정 필요 (MVP에서 제외 가능)

#### [5-1] 결제 프론트엔드 측 확인
- **파일**: `frontend/src/pages/PremiumPage.tsx`
- `VITE_TOSS_CLIENT_KEY` 환경변수가 `.env` 파일에 올바르게 설정되어 있는지 확인
- 브라우저 콘솔에서 Toss SDK 로딩 에러 확인

---

## 5. 디버깅 우선순위 권장

### 즉시 착수 (백엔드)
1. **결제 실패** — `toss.secret-key` 환경변수 확인 + 서버 로그 확인
2. **ItemType enum 불일치** — 프론트팀과 협의하여 통일된 enum 값 결정
3. **Page 응답 구조** — Swagger에서 Admin API 응답 구조 확인하여 프론트팀에 공유

### 즉시 착수 (프론트엔드)
1. **미구현 onClick 핸들러** — 답변하기, 톱니바퀴, 화장실 목록 보기, 아이템 등록 (가장 많은 이슈의 원인)
2. **검색란 CSS** — 5분 내 수정 가능
3. **API 응답 파싱** — DevTools에서 실제 응답 확인 후 PageResponse 매핑 수정

### 협의 필요
1. ItemType enum 통일 방향
2. 이미지 업로드 방식 (URL 입력 vs 파일 업로드)
3. 카메라 촬영 시 체류 시간 면제 여부
4. 보안 프로토콜 제어 실제 구현 범위

---

## 6. 핵심 파일 경로 참조

### 백엔드
| 파일 | 용도 |
|------|------|
| `backend/src/main/java/com/daypoo/api/service/PaymentService.java` | 결제 처리 |
| `backend/src/main/java/com/daypoo/api/service/AdminManagementService.java` | 관리자 비즈니스 로직 |
| `backend/src/main/java/com/daypoo/api/entity/enums/ItemType.java` | 아이템 타입 enum |
| `backend/src/main/java/com/daypoo/api/controller/Admin*.java` | 관리자 API 컨트롤러 |
| `backend/src/main/resources/application.yml` | 설정 파일 (Toss 키 등) |

### 프론트엔드
| 파일 | 용도 |
|------|------|
| `frontend/src/pages/AdminPage.tsx` | 관리자 페이지 전체 (1500+ lines) |
| `frontend/src/types/admin.ts` | 관리자 타입 정의 (ItemType 불일치) |
| `frontend/src/pages/PremiumPage.tsx` | 결제/플랜 페이지 |
| `frontend/src/pages/PaymentSuccessPage.tsx` | 결제 확인 |
| `frontend/src/components/map/VisitModal.tsx` | 방문 인증 모달 |
| `frontend/src/hooks/useToilets.ts` | 화장실 데이터/방문 상태 |
| `frontend/src/services/apiClient.ts` | API 클라이언트 (응답 파싱) |
| `frontend/vite.config.js` | Vite 설정 (SPA fallback) |
