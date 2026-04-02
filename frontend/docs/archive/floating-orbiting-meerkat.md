# DayPoo 프론트엔드-백엔드-AI 연동 상태 진단 보고서

## Context

프론트엔드(React 19/Vite), 백엔드(Spring Boot 3.4/Java 21), AI 서비스(FastAPI/GPT-4o) 3개 서비스 간의 연동 상태를 전수 분석하여, 미구현/누락된 연결 고리(Missing Link)를 식별한 보고서입니다.

---

## ✅ 프론트엔드 연동 현황 및 누락 체크리스트

### 프론트엔드 정상 연동 항목

| 기능 | 프론트엔드 호출 | 백엔드 엔드포인트 | 상태 |
| :--- | :--- | :--- | :--- |
| 로그인/회원가입 | `POST /auth/login`, `POST /auth/signup` | AuthController | ✅ 정상 |
| 소셜 로그인 | `POST /auth/social/signup` | AuthController | ✅ 정상 |
| 사용자 정보 조회 | `GET /auth/me` | AuthController | ✅ 정상 |
| 닉네임/비밀번호 변경 | `PATCH /auth/profile`, `PATCH /auth/password` | AuthController | ✅ 정상 |
| 아이디 찾기/비밀번호 초기화 | `GET /auth/find-id`, `POST /auth/password/reset` | AuthController | ✅ 정상 |
| 토큰 갱신 | `POST /auth/refresh` | AuthController | ✅ 정상 (자동) |
| 로그아웃 | `POST /auth/logout` | AuthController | ✅ 연동 완료 |
| 회원 탈퇴 | `DELETE /auth/me` | AuthController | ✅ 연동 완료 |
| 화장실 검색 | `GET /toilets?lat&lng&radius` | ToiletController | ✅ 정상 |
| 체크인 | `POST /records/check-in` | PooRecordController | ✅ 정상 |
| 기록 저장 | `POST /records` | PooRecordController | ✅ 정상 |
| 기록 조회 | `GET /records` | PooRecordController | ✅ 정상 |
| 건강 리포트 | `GET /reports/{type}` | ReportController | ✅ 정상 |
| 랭킹 (글로벌/건강/지역) | `GET /rankings/*` | RankingController | ✅ 정상 |
| 알림 (SSE 구독/조회/삭제) | `/notifications/*` | NotificationController | ✅ 정상 |
| 결제 확인 | `POST /payments/confirm` | PaymentController | ✅ 정상 |
| 상점/컬렉션 조회 | `/shop/items`, `/shop/inventory` | ShopController | ✅ 연동 완료 |
| 문의 등록/조회 | `POST /support/inquiries`, `GET /support/inquiries` | SupportController | ✅ 정상 |
| FAQ 조회 | `GET /support/faqs` | SupportController | ✅ 연동 완료 |
| 관리자 - 통계/유저/화장실/문의/상품 | `GET /admin/*` | Admin Controllers | ✅ 연동 완료 |

### 프론트엔드 측 누락된 항목

- **[CRITICAL] AI 이미지 분석 호출 실패**: 프론트엔드 [VisitModal.tsx:104](frontend/src/components/map/VisitModal.tsx#L104)에서 `POST /records/analyze`를 호출하지만, 백엔드에 해당 엔드포인트가 **존재하지 않음** → 404 에러 발생, AI 카메라 분석 기능 전체 작동 불가
- **[LOW] 관리자 시스템 로그 목 데이터**: [AdminPage.tsx:1234](frontend/src/pages/AdminPage.tsx#L1234)에 명시적 TODO 존재 — 백엔드 로그 API 자체도 미구현

---

## ✅ 백엔드 연동 현황 및 누락 체크리스트

### 백엔드 정상 연동 항목

| 기능 | 백엔드 → AI 서비스 | 상태 |
| :--- | :--- | :--- |
| 대변 이미지 분석 | `AiClient.analyzePoopImage()` → AI `POST /api/v1/analysis/analyze` | ✅ 정상 |
| 건강 리포트 생성 | `AiClient.analyzeHealthReport()` → AI `POST /api/v1/report/generate` | ✅ 정상 |
| JWT 인증/인가 | JwtProvider + JwtAuthenticationFilter | ✅ 정상 |
| OAuth2 소셜 로그인 | Kakao/Google OAuth2 | ✅ 정상 |
| Rate Limiting | Redis 기반 AOP | ✅ 정상 |
| CORS | SecurityConfig에서 설정 | ✅ 정상 |
| SSE 실시간 알림 | Redis Pub/Sub + EventSource | ✅ 정상 |
| 공공 데이터 화장실 동기화 | `POST /admin/sync-toilets` → 공공데이터 API | ✅ 정상 |

### 백엔드 측 누락된 항목

- **[CRITICAL] `/records/analyze` 엔드포인트 부재**: [PooRecordController.java](backend/src/main/java/com/daypoo/api/controller/PooRecordController.java)에 `POST /records/analyze`가 없음. 현재 AI 분석은 `POST /records` 내부에서 인라인으로 실행되는 구조 → 프론트엔드 UX와 **설계 불일치**
- **[MEDIUM] AI 분석 응답 데이터 손실**: AI 서비스가 반환하는 `warning_tags` 등이 백엔드 DTO에서 누락되어 **건강 경고가 사용자에게 전달되지 않음**
- **[LOW] 긴급 화장실 엔드포인트 미구현**: `GET /toilets/emergency`가 백엔드에 존재하지 않음
- **[LOW] 관리자 로그 API 미구현**: 백엔드에 `GET /admin/logs` 엔드포인트가 없음

---

## ⚠️ 종합 미구현/보완 필요 사항

### CRITICAL (즉시 수정 필요)

#### 1. AI 카메라 분석 기능 연동 끊김 (백엔드 작업 필요)

- **증상**: 프론트엔드는 `POST /records/analyze` (분석만 수행) 호출, 백엔드는 해당 엔드포인트 없음
- **수정 방안**: `PooRecordController.java`에 `@PostMapping("/analyze")` 추가 필요

### MEDIUM (조기 수정 권장)

#### 2. 로그아웃 시 서버 토큰 무효화 (완료)

- **상태**: `AuthContext.tsx` 수정 완료 (`api.post('/auth/logout')` 호출 추가)

#### 3. 회원탈퇴 기능 구현 (완료)

- **상태**: `MyPage.tsx` SettingsTab에 탈퇴 버튼 및 `api.delete('/auth/me')` 연동 완료

#### 4. AI 분석 응답 warning_tags 데이터 손실 (백엔드/타입 작업 필요)

- **수정 파일**: `AiAnalysisResponse.java`, `api.ts`, `VisitModal.tsx` 상호 보완 필요

#### 5. 상점/컬렉션 시스템 연동 (완료)

- **상태**: `MyPage.tsx`에서 Shop API 호출 및 인벤토리 데이터 반영 완료

#### 6. 관리자 대시보드 실데이터 연동 (완료)

- **상태**: `AdminPage.tsx`에서 `GET /admin/stats` 실데이터 연동 완료

---

## 우선순위별 구현 순서

| 순서 | 항목 | 심각도 | 상태 |
| :--- | :--- | :--- | :--- |
| 1 | AI 분석 엔드포인트 신설 (`/records/analyze`) | CRITICAL | 백엔드 미구현 |
| 2 | 로그아웃 API 호출 추가 | MEDIUM | **완료** |
| 3 | 회원탈퇴 UI + API 연동 | MEDIUM | **완료** |
| 4 | AI 응답 warning_tags 전달 | MEDIUM | 미해결 |
| 5 | 상점 API 연동 | MEDIUM | **완료** |
| 6 | 관리자 대시보드 실데이터 | MEDIUM | **완료** |
| 7 | FAQ API 연동 | LOW | **완료** |
| 8 | 관리자 로그 API | LOW | 미해결 |

---

## 검증 방법

1. **로그아웃 검증**: 로그아웃 후 서버 세션/토큰 무효화 호출 확인
2. **회원탈퇴 검증**: 마이페이지 설정에서 회원탈퇴 진행 후 재로그인 불가 확인
3. **상점 연동 검증**: MyPage 컬렉션/상점 탭에서 실제 DB 아이템 목록 표시 확인
4. **대시보드 검증**: Admin 대시보드에서 실시간 통계 차트 및 위젯 데이터 반환 확인
