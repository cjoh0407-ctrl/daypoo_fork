# 리팩토링 및 인증 시스템 개편 통합 플랜 (완료)

---

## Part 1: 백엔드 [아이디 제거 및 이메일 기반 전면 전환] (완료)

### 1. 개요
데이터베이스 스키마와 `User` 엔티티에서 `username` 컬럼이 성공적으로 제거되었습니다. 모든 서비스 및 컨트롤러 코드에서 제거된 `username` 필드 대신 `email`을 사용하도록 리팩토링이 완료되었습니다.

### 2. 세부 실행 계획

#### Step 1: 서비스 레이어 잔여 참조 수정
*   [x] **파일**: `backend/src/main/java/com/daypoo/api/service/TitleAchievementService.java`
*   [x] **작업**: 호출되는 `user.getUsername()`을 `user.getEmail()`로 변경 완료.

#### Step 2: 랭킹 시스템 컨트롤러 수정
*   [x] **파일**: `backend/src/main/java/com/daypoo/api/controller/RankingController.java`
*   [x] **작업**: 
    *   `@AuthenticationPrincipal String email`로 변수명 변경 완료.
    *   `userRepository.findByEmail(email)` 호출로 변경 완료.

#### Step 3: 고객 지원 컨트롤러 수정
*   [x] **파일**: `backend/src/main/java/com/daypoo/api/controller/SupportController.java`
*   [x] **작업**: 
    *   `getUserByEmail(String email)`로 메서드명 변경 완료.
    *   내부의 호출을 `userRepository.findByEmail(email)`로 변경 완료.

#### Step 4: 기타 잔여 코드 검토 및 용어 통일
*   [x] **작업**: `PaymentController`, `openapi.yaml` 등 로그 및 변수에 남은 `username` 용어를 `email`로 통일 작업 완료.

---

## Part 2: 프론트엔드 [인증 시스템 개편 플랜 (Email 기반 식별 전환)] (완료)

### 1. 개요
인증 시스템이 기존 '아이디(username)' 기반에서 '이메일(email)' 기반으로 전환됨에 따라 프론트엔드 코드 수정이 완료되었습니다.

### 2. 세부 작업 내역

#### [AuthModal.tsx] 로그인 로직 수정
- [x] `LoginForm` 내부의 `api.post('/auth/login', ...)` 요청 바디 수정 (`email` 필드 사용)
- [x] 에러 메시지 처리 및 상태 관리 변수 검토 완료

#### [AuthModal.tsx] 회원가입 로직 수정
- [x] `SignupForm` 내부의 `api.post('/auth/signup', ...)` 요청 바디 수정
  - `username` 필드 제거, `email`, `password`, `nickname` 전송
- [x] 중복 확인 엔드포인트 수정 (`check-email` 사용)
- [x] 가입 후 자동 로그인 호출 시 필드명 수정 (`email`)

#### [SocialSignupPage.tsx] 소셜 가입 및 프로필 로직 검토
- [x] 소셜 회원가입 시 `username` 필드 제거 완료
- [x] `SocialSignUpRequest` DTO 구조에 맞게 프론트엔드 요청 수정 완료

---

## 3. 테스트 및 주의사항 (검증 완료)
- [x] **회원가입**: 이메일을 통한 신규 가입이 정상적으로 수행되는지 확인
- [x] **중복 확인**: 이미 존재하는 이메일 입력 시 에러 메시지가 정상 출력되는지 확인
- [x] **로그인**: 가입한 이메일과 비밀번호로 로그인이 성공하는지 확인
- [x] **토큰 관리**: 로그인 후 발급된 JWT 토큰이 `localStorage`에 잘 저장되고 이후 API 요청에 사용되는지 확인
*   **컴파일 확인**: 수정 후 전반적인 코드 빌드가 정상임을 최종 확인했습니다.

[✅ 규칙을 잘 수행했습니다.]
