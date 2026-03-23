# 프론트엔드 인증 시스템 개편 플랜 (Email 기반 식별 전환)

인증 시스템이 기존 '아이디(username)' 기반에서 '이메일(email)' 기반으로 전환됨에 따라 프론트엔드 코드를 수정합니다.

## 1. 개요
- 백엔드 API 스펙 변경에 따른 요청 필드 및 엔드포인트 수정
- `AuthModal.tsx` 내의 로그인 및 회원가입 로직 업데이트
- 불필요해진 `username` 중복 검사 로직 제거 및 `email` 중복 검사로 대체

## 2. 세부 작업 내역

### [AuthModal.tsx] 로그인 로직 수정
- [ ] `LoginForm` 내부의 `api.post('/auth/login', ...)` 요청 바디 수정
  - `username` 필드명을 `email`로 변경
- [ ] 에러 메시지 처리 및 상태 관리 변수 검토

### [AuthModal.tsx] 회원가입 로직 수정
- [ ] `SignupForm` 내부의 `api.post('/auth/signup', ...)` 요청 바디 수정
  - `username: email` 필드 제거
  - `email`, `password`, `nickname`만 전송하도록 변경
- [ ] 중복 확인 엔드포인트 수정
  - `api.get('/auth/check-username?username=...')` -> `api.get('/auth/check-email?email=...')`
- [ ] 가입 후 자동 로그인 호출 시 필드명 수정 (`username` -> `email`)

### [SocialSignupPage.tsx] 소셜 가입 및 프로필 로직 검토
- [ ] 소셜 회원가입 시 `username` 필드가 포함되어 있는지 확인 후 제거/수정
- [ ] `SocialSignUpRequest` DTO 구조에 맞게 프론트엔드 요청 수정

## 3. 테스트 계획
- [ ] **회원가입**: 이메일을 통한 신규 가입이 정상적으로 수행되는지 확인
- [ ] **중복 확인**: 이미 존재하는 이메일 입력 시 에러 메시지가 정상 출력되는지 확인
- [ ] **로그인**: 가입한 이메일과 비밀번호로 로그인이 성공하는지 확인
- [ ] **토큰 관리**: 로그인 후 발급된 JWT 토큰이 `localStorage`에 잘 저장되고 이후 API 요청에 사용되는지 확인
