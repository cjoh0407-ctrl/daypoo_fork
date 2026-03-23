# 리팩토링 및 인증 시스템 개편 통합 플랜

---

## Part 1: 백엔드 [아이디 제거 및 이메일 기반 전면 전환] (진행 중)

### 1. 개요
데이터베이스 스키마와 `User` 엔티티에서 `username` 컬럼이 성공적으로 제거되었습니다. 현재 시스템은 `email`을 단일 식별자로 사용하고 있으나, 일부 서비스 및 컨트롤러 코드에서 여전히 제거된 `username` 필드나 `findByUsername` 메서드를 참조하고 있어 빌드 오류가 발생할 수 있습니다. 이를 해결하여 리팩토링을 완수합니다.

### 2. 세부 실행 계획

#### Step 1: 서비스 레이어 잔여 참조 수정
*   **파일**: `backend/src/main/java/com/daypoo/api/service/TitleAchievementService.java` (62행)
*   **작업**: 로그 출력 시 호출되는 `user.getUsername()`을 `user.getNickname()` 또는 `user.getEmail()`로 변경합니다.

#### Step 2: 랭킹 시스템 컨트롤러 수정
*   **파일**: `backend/src/main/java/com/daypoo/api/controller/RankingController.java` (26, 37, 48행)
*   **작업**: 
    *   `@AuthenticationPrincipal String username`을 `email`로 변수명 변경 (가독성 목적).
    *   `userRepository.findByUsername(username)` 호출을 `userRepository.findByEmail(email)`로 변경합니다.

#### Step 3: 고객 지원 컨트롤러 수정
*   **파일**: `backend/src/main/java/com/daypoo/api/controller/SupportController.java` (49행)
*   **작업**: 
    *   `getUserByUsername` 메서드명을 `getUserByEmail(String email)`로 변경합니다.
    *   내부의 `userRepository.findByUsername(username)` 호출을 `userRepository.findByEmail(email)`로 변경합니다.
    *   해당 메서드를 호출하는 `createInquiry`, `getMyInquiries` 내의 변수명도 `email`로 통일합니다.

#### Step 4: 기타 잔여 코드 검토
*   **작업**: `CustomOAuth2UserService` 등 로그나 임시 변수에 남은 `username` 용어들이 시스템 흐름에 지장이 없는지 확인하고, 혼선을 줄 수 있는 부분은 점진적으로 `email`로 용어를 통일합니다.

---

## Part 2: 프론트엔드 [인증 시스템 개편 플랜 (Email 기반 식별 전환)]

### 1. 개요
인증 시스템이 기존 '아이디(username)' 기반에서 '이메일(email)' 기반으로 전환됨에 따라 프론트엔드 코드를 수정합니다.

### 2. 세부 작업 내역

#### [AuthModal.tsx] 로그인 로직 수정
- [ ] `LoginForm` 내부의 `api.post('/auth/login', ...)` 요청 바디 수정
  - `username` 필드명을 `email`로 변경
- [ ] 에러 메시지 처리 및 상태 관리 변수 검토

#### [AuthModal.tsx] 회원가입 로직 수정
- [ ] `SignupForm` 내부의 `api.post('/auth/signup', ...)` 요청 바디 수정
  - `username: email` 필드 제거
  - `email`, `password`, `nickname`만 전송하도록 변경
- [ ] 중복 확인 엔드포인트 수정
  - `api.get('/auth/check-username?username=...')` -> `api.get('/auth/check-email?email=...')`
- [ ] 가입 후 자동 로그인 호출 시 필드명 수정 (`username` -> `email`)

#### [SocialSignupPage.tsx] 소셜 가입 및 프로필 로직 검토
- [ ] 소셜 회원가입 시 `username` 필드가 포함되어 있는지 확인 후 제거/수정
- [ ] `SocialSignUpRequest` DTO 구조에 맞게 프론트엔드 요청 수정

---

## 3. 테스트 및 주의사항
- [ ] **회원가입**: 이메일을 통한 신규 가입이 정상적으로 수행되는지 확인
- [ ] **중복 확인**: 이미 존재하는 이메일 입력 시 에러 메시지가 정상 출력되는지 확인
- [ ] **로그인**: 가입한 이메일과 비밀번호로 로그인이 성공하는지 확인
- [ ] **토큰 관리**: 로그인 후 발급된 JWT 토큰이 `localStorage`에 잘 저장되고 이후 API 요청에 사용되는지 확인
*   **프론트엔드 영향도**: 프론트엔드 코드(`frontend/`)는 절대 직접 수정하지 않으며, 변경된 API 스펙은 문서를 통해 공유합니다.
*   **테스트**: 수정 후 `./gradlew build`를 통해 컴파일 오류가 없는지 최종 확인합니다.

[✅ 규칙을 잘 수행했습니다.]
