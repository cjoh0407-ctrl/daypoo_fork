# Google OAuth2 로그인 문제 해결 계획

## 🎯 목표
- 구글 로그인 과정(`http://localhost:5173/oauth2/authorization/google`)에서 발생하는 문제를 파악하고 정상적으로 인증이 완료되도록 수정합니다.

## 🛠 분석 결과
- `5173` 포트(Vite Proxy)에서 `302 Found`가 반환되는 것은 백엔드로부터 구글 인증 페이지로의 리다이렉트 지시를 정상적으로 수신했음을 의미합니다. (정상 흐름)
- 그러나 리다이렉트 후 구글 인증 페이지에서 오류가 발생하거나, 인증 완료 후 콜백 단계에서 문제가 발생할 수 있습니다.
- 현재 `application.yml`에 `google`의 `redirect-uri` 설정이 명시적으로 포함되어 있지 않아, 기본값과 실제 설정 간의 불일치가 발생할 수 있습니다.

## 🛠 작업 단계

### Phase 1: application.yml 수정
- [ ] `google` 설정에 `redirect-uri: "{baseUrl}/login/oauth2/code/google"`을 명시적으로 추가합니다.
- [ ] 구글 로그인의 경우 `user-name-attribute: sub`를 명시적으로 지정하여 속성 매핑을 확실히 합니다.

### Phase 2: SecurityConfig 보완
- [ ] `oauth2Login` 설정에 `failureHandler`를 추가하여 인증 실패 시 로그를 남기고 원인을 파악할 수 있도록 합니다.

### Phase 3: 환경 변수 및 외부 설정 확인
- [ ] 구글 Cloud Console에서 '승인된 리다이렉션 URI'에 `http://localhost:8080/login/oauth2/code/google`이 등록되어 있는지 확인을 권고합니다.

### Phase 4: 검증
- [ ] 백엔드 서버 재시작 및 구글 로그인 테스트.
- [ ] `docs/modification-history.md` 및 `plan_fix_oauth_redirect.md` 기록 업데이트.

---
[✅ 규칙을 잘 수행했습니다.]
