# 💡 내가 직접 작업해야 할 것들 (Manual Configurations)

현재 자동화된 프로젝트 세팅 외에 개발자가 직접 확인하고 값을 입력해야 하는 항목들입니다. 프로젝트 루트의 `.env` 파일에 아래 내용들을 기입해 주세요.

---

## 1. 인프라 설정 (Infrastructure) - **[필수]**

서버 구동을 위해 가장 먼저 설정해야 하는 항목입니다.

- **기입 위치**: 프로젝트 루트 `/.env`
- **참조 위치**: `backend/src/main/resources/application.yml`

### 🔹 PostgreSQL (PostGIS)
- `DB_HOST`: `localhost` (로컬 실행 시)
- `DB_PORT`: `5432`
- `POSTGRES_DB`: `daypoo_db` (기본값)
- `POSTGRES_USER`: `daypoo`
- `POSTGRES_PASSWORD`: `<YOUR_PASSWORD>`

### 🔹 Redis
- `REDIS_HOST`: `localhost`
- `REDIS_PORT`: `6379`
- `REDIS_PASSWORD`: (비밀번호가 있을 경우만 입력)

### 🔹 OpenSearch (검색 엔진)
- `OPENSEARCH_URL`: `http://localhost:9200`

---

## 2. 서비스 URL 설정 (Service URLs) - **[필수]**

CORS 및 마이크로서비스 간 통신을 위해 필요합니다.

- **기입 위치**: 프로젝트 루트 `/.env`
- **참조 위치**: `backend/src/main/resources/application.yml`

- `FRONTEND_URL`: `http://localhost:5173` (Vite 기본 포트)
- `AI_SERVICE_URL`: `http://localhost:8000` (AI 마이크로서비스 주소)
- `PUBLIC_DATA_URL`: `https://apis.data.go.kr/1741000/public_restroom_info/info`

---

## 3. 인증 및 보안 (Auth & Security) - **[필수]**

### 🔹 JWT (JSON Web Token)
- `JWT_SECRET_KEY`: 최소 32자 이상의 무작위 문자열 (Base64 인코딩 권장)

### 🔹 OAuth2 (카카오/구글 로그인)
- `KAKAO_CLIENT_ID`: REST API 키
- `KAKAO_CLIENT_SECRET`: 보안 설정에서 발급받은 Secret 코드
- `GOOGLE_CLIENT_ID`: OAuth 2.0 클라이언트 ID
- `GOOGLE_CLIENT_SECRET`: 클라이언트 보안 비밀

### 🔹 메일 서버 (비밀번호 찾기/알림용)
- `MAIL_USERNAME`: Gmail 주소 (예: `example@gmail.com`)
- `MAIL_PASSWORD`: Gmail 앱 비밀번호 (16자리)

---

## 4. 외부 API 연동 (External APIs)

### 🔹 전국공중화장실표준데이터 (공공데이터포털)
- `PUBLIC_DATA_API_KEY`: 디코딩(Decoding)된 서비스 키

### 🔹 OpenAI (AI 마이크로서비스용)
- **기입 위치**: `ai-service/.env` (또는 루트 `.env` 공유 가능)
- `OPENAI_API_KEY`: `sk-...` 로 시작하는 API 키

---

## 5. 결제 및 스토리지 (Payment & Storage) - **[선택]**

### 🔹 토스페이먼츠
- `TOSS_SECRET_KEY`: 토스페이먼츠 시크릿 키
- `VITE_TOSS_CLIENT_KEY`: 토스페이먼츠 클라이언트 키 (프론트엔드 대응)

### 🔹 AWS S3 (이미지 업로드용)
- `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY` / `STORAGE_BUCKET_NAME`

---

> **Tip**: 모든 환경 변수는 프로젝트 루트의 **`.env`** 파일에 정의하는 것을 원칙으로 합니다. `ai-service` 또한 실행 시 루트의 `.env`를 참조하도록 설정되어 있습니다.
