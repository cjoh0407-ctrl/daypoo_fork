# 💡 내가 직접 작업해야 할 것들 (Manual Configurations)

현재 자동화된 프로젝트 세팅 외에 개발자가 직접 확인하고 값을 입력해야 하는 항목들입니다.

## 1. OAuth2 카카오/구글 로그인 (API KEY 설정)

소셜 로그인(OAuth2) 기능을 테스트하고 실 서비스에 연동하려면 개발자 콘솔에서 앱을 생성하고 API Key를 발급받아 환경 변수나 설정 파일에 입력해야 합니다.

### 설정 위치
- 파일: `backend/src/main/resources/application.yml`
- 또는 로컬 환경변수(Environment Variables)

### 🔹 Kakao
[카카오 디벨로퍼스](https://developers.kakao.com)에서 애플리케이션 생성 후 키 발급
- `KAKAO_CLIENT_ID`: REST API 키 (예: `f8a...................`)
- `KAKAO_CLIENT_SECRET`: Client Secret 코드 (보안 설정에서 발급)
- **리다이렉트 URI 설정**: 플랫폼 -> Web 에 `http://localhost:8080/login/oauth2/code/kakao` 추가

### 🔹 Google
[Google Cloud Console](https://console.cloud.google.com/)에서 새 프로젝트 생성 -> 'API 및 서비스' -> '사용자 인증 정보' -> 'OAuth 2.0 클라이언트 ID' 생성
- `GOOGLE_CLIENT_ID`: 클라이언트 ID (예: `123456789-xxxxx.apps.googleusercontent.com`)
- `GOOGLE_CLIENT_SECRET`: 클라이언트 보안 비밀
- **리다이렉트 URI 설정**: 승인된 리디렉션 URI에 `http://localhost:8080/login/oauth2/code/google` 추가

---

## 2. 보안 환경 변수 (JWT)

### 🔹 JWT Secret Key
- `JWT_SECRET_KEY`: JWT 서명에 사용되는 비밀키입니다. 로컬에서는 기본값이 적용되어 동작하지만, 프로덕션 배포 시에는 반드시 길고 안전한 무작위 문자열(Base64 인코딩 권장)로 교체해야 합니다.

---

## 3. 전국공중화장실표준데이터 공공데이터 연동 (API KEY 설정)

전국의 화장실 데이터를 벌크 인서트(Bulk Insert) 및 주기적인 업데이트 처리를 하기 위해 공공데이터포털(data.go.kr)의 API 키가 필요합니다.

### 설정 위치
- 파일: `backend/src/main/resources/application.yml`
- 또는 로컬 환경변수(Environment Variables)

### 🔹 공공데이터포털
[공공데이터포털](https://www.data.go.kr) 접속 -> '전국공중화장실표준데이터' 검색 및 활용 신청
- `PUBLIC_DATA_API_KEY`: 디코딩(Decoding)된 서비스 키 (예: `AbCdEfG...`)

---

## 4. AI 마이크로서비스 (OpenAI API KEY 설정)

비저장 프라이버시 AI 촬영 파이프라인 및 건강 리포트 생성을 위해 OpenAI API 키가 필요합니다.

### 설정 위치
- 파일: `ai-service/.env` (파일이 없으면 생성)
- 또는 로컬 환경변수(Environment Variables)

### 🔹 OpenAI
[OpenAI API](https://platform.openai.com) 접속 -> API Keys 발급
- `OPENAI_API_KEY`: 발급받은 시크릿 키 (예: `sk-...`)
- `MODEL_NAME`: 기본값 `gpt-4o` (이미지 분석이 가능한 모델 필수)

---

## 5. 상점 및 인벤토리 (결제 및 스토리지)

상점에서 판매될 아이템 이미지 및 실제 결제(테스트) 연동 시 필요한 정보입니다.

### 설정 위치
- 파일: `backend/src/main/resources/application.yml`
- 또는 로컬 환경변수(Environment Variables)

### 🔹 이미지 스토리지 (AWS S3 등)
아이템 이미지를 저장하고 서빙하기 위한 스토리지 정보입니다. 현재는 `static` 경로를 활용할 수 있지만, 운영 환경에서는 S3 등을 권장합니다.
- `STORAGE_ACCESS_KEY`: `<YOUR_ACCESS_KEY>`
- `STORAGE_SECRET_KEY`: `<YOUR_SECRET_KEY>`
- `STORAGE_BUCKET_NAME`: `<YOUR_BUCKET_NAME>`

### 🔹 결제 연동 (토스페이먼츠/포트원 등 - 필요 시)
유료 아이템 결제 기능을 추가할 경우 필요한 API 키입니다.
- `PAYMENT_CLIENT_KEY`: `<YOUR_CLIENT_KEY>`
- `PAYMENT_SECRET_KEY`: `<YOUR_SECRET_KEY>`

*(이 외의 추후 구현 과정에서 필요한 환경 변수는 이곳에 지속적으로 추가해 드리겠습니다.)*
