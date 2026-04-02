# 닉네임 중복 방지 및 소셜 로그인 개선 계획

## 🎯 목표
- 회원가입 및 소셜 로그인 시 닉네임 중복을 엄격하게 차단하고, 중복 시 사용자에게 명확한 에러를 표시합니다.
- 소셜 로그인에서 중복된 닉네임을 자동으로 생성(예: `nickname_123`)하는 로직을 제거하고 가입을 중단합니다.

## 🛠 분석 결과
- **현상:** 소셜 로그인 시 기존 구성원 중 동일한 닉네임이 있으면 뒤에 랜덤 숫자를 붙여 자동으로 고유 닉네임을 생성(`CustomOAuth2UserService.java`)하고 가입을 완료시킵니다.
- **사용자 요청:** "닉네임 중복입니다"라고 명시하고 가입을 막아야 함.
- **일반 회원가입:** `AuthService.java`에서 이미 `checkNicknameDuplicate`를 통해 중복 시 `NICKNAME_ALREADY_EXISTS` 에러를 던지고 있습니다. 하지만 소셜 로그인 흐름은 별도로 구현되어 있습니다.

## 🛠 작업 단계

### Phase 1: CustomOAuth2UserService 수정
- [ ] 소셜 로그인 정보 수집 시, 해당 계정이 신규 가입자인 경우에만 닉네임 중복 체크를 수행합니다.
- [ ] 중복되는 닉네임이 있을 경우 `OAuth2AuthenticationException("이미 사용 중인 닉네임입니다.")`을 던져 프로세스를 중단합니다.
- [ ] 기존의 랜덤 숫자 부착 로직(`while` 루프)을 제거합니다.

### Phase 2: SecurityConfig 및 OAuth2FailureHandler 확인
- [ ] `SecurityConfig.java`의 `failureHandler`가 예외 메시지를 쿼리 파라미터(`?error=...`)로 프론트엔드에 리다이렉트하는지 확인합니다.

### Phase 3: 테스트 및 검증
- [ ] 동일한 닉네임을 가진 소셜 계정으로 로컬 테스트 환경에서 로그인을 시도하여 가입이 차격되고 적절한 에러 메시지가 표시되는지 확인합니다.
- [ ] `docs/modification-history.md` 기록 업데이트.

---
[✅ 규칙을 잘 수행했습니다.]
