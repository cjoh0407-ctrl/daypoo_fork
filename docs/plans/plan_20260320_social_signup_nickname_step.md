# 소셜 로그인 2단계 가입(닉네임 설정) 구현 계획

## 🎯 목표
- 소셜 로그인 시 자동으로 닉네임이 결정되는 대신, 사용자가 직접 닉네임을 설정할 수 있는 가입 흐름을 구축합니다.
- 데이터베이스에 중복되거나 임시적인 닉네임이 쌓이는 것을 방지합니다.

## 🛠 백엔드(Backend) 변경 사항

### Phase 1: CustomOAuth2UserService & SuccessHandler 수정
- [ ] `CustomOAuth2UserService.java`: 신규 사용자 발견 시 DB 저장을 수행하지 않고 `OAuth2UserInfo` 정보만 유지하도록 변경.
- [ ] `OAuth2SuccessHandler.java`: 
    - 가입된 회원 여부를 판단하여 분기 처리.
    - 미가입 회원의 경우, 이메일/제공자 정보를 담은 단기 유효 토큰(`registrationToken`) 생성.
    - 프론트엔드 `/signup/social?token=...` 페이지로 리다이렉트.

### Phase 2: 소셜 가입 완료 API 구현
- [ ] `SocialSignUpRequest.java`: `registrationToken`과 `nickname`을 받는 DTO 생성.
- [ ] `AuthService.java`: 토큰 검증 후 최종적으로 `User` 엔티티를 생성 및 저장하는 `socialSignUp` 메서드 구현.
- [ ] `AuthController.java`: `POST /api/v1/auth/social/signup` 엔드포인트 추가.

## 🎨 프론트엔드(Frontend) 작업 가이드

### 1. 전용 라우트 생성
- [ ] `/signup/social` 주소로 접근 가능한 가입 단계 전용 컴포넌트 추가.
- [ ] 쿼리 스트링에서 `registration_token`을 추출하여 보관.

### 2. UI/UX 구성
- [ ] 닉네임 입력 필드 및 중복 확인 버튼 구현.
- [ ] 기존 `GET /api/v1/auth/check-nickname` API 연동.

### 3. 가입 프로세스 완료
- [ ] 닉네임과 토큰을 백엔드에 전송하여 로그인 성공 처리(JWT 저장).

---
[✅ 규칙을 잘 수행했습니다.]
