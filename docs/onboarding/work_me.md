# 💡 내가 직접 작업해야 할 것들 (Manual Configurations)

현재 자동화된 프로젝트 세팅 외에 개발자가 직접 확인하고 값을 입력해야 하는 항목들입니다. 프로젝트 루트의 `.env` 파일에 아래 내용들을 기입해 주세요.

---

## 1. 인프라 설정 (Infrastructure) - **[필수]**

서버 구동을 위해 가장 먼저 설정해야 하는 항목입니다.

- **기입 위치**: 프로젝트 루트 `/.env`
- **참조 위치**: `docker-compose.yml`, `backend/src/main/resources/application.yml`

### 🔹 PostgreSQL (PostGIS)
- `DB_HOST`: `localhost` (로컬 실행 시)
- `DB_PORT`: `5432`
- `POSTGRES_DB`: `daypoo`
- `POSTGRES_USER`: `postgres`
- `POSTGRES_PASSWORD`: `<YOUR_PASSWORD>`

### 🔹 Redis
- `REDIS_HOST`: `localhost`
- `REDIS_PORT`: `6379`

---

## 2. 서비스 URL 설정 (Service URLs) - **[필수]**

CORS 및 마이크로서비스 간 통신을 위해 필요합니다.

- **기입 위치**: 프로젝트 루트 `/.env`
- **참조 위치**: `backend/src/main/resources/application.yml`

- `FRONTEND_URL`: `http://localhost:3000` (프론트엔드 개발 서버)
- `AI_SERVICE_URL`: `http://localhost:8000` (AI 마이크로서비스 주소)
- `PUBLIC_DATA_URL`: `https://apis.data.go.kr/1741000/public_restroom_info/info`

---

## 3. 인증 및 보안 (Auth & Security) - **[필수]**

### 🔹 JWT (JSON Web Token)
- **기입 위치**: 프로젝트 루트 `/.env`
- **참조 위치**: `backend/src/main/resources/application.yml`
- `JWT_SECRET_KEY`: 최소 32자 이상의 무작위 문자열

### 🔹 OAuth2 (카카오/구글 로그인)
- **기입 위치**: 프로젝트 루트 `/.env`
- **참조 위치**: `backend/src/main/resources/application.yml`
- `KAKAO_CLIENT_ID`: REST API 키
- `KAKAO_CLIENT_SECRET`: 보안 설정에서 발급받은 Secret 코드
- `GOOGLE_CLIENT_ID`: OAuth 2.0 클라이언트 ID
- `GOOGLE_CLIENT_SECRET`: 클라이언트 보안 비밀

---

## 4. 외부 API 연동 (External APIs)

### 🔹 전국공중화장실표준데이터 (공공데이터포털)
- **기입 위치**: 프로젝트 루트 `/.env`
- **참조 위치**: `backend/src/main/resources/application.yml`
- `PUBLIC_DATA_API_KEY`: 디코딩(Decoding)된 서비스 키

### 🔹 OpenAI (AI 마이크로서비스용)
- **기입 위치**: `ai-service/.env` (파일이 없으면 생성)
- **참조 위치**: `ai-service/app/core/config.py`
- `OPENAI_API_KEY`: `sk-...` 로 시작하는 API 키

---

## 5. 스토리지 및 결제 (Storage & Payment) - **[선택]**

### 🔹 AWS S3 (또는 호환 스토리지)
- **기입 위치**: 프로젝트 루트 `/.env`
- **참조 위치**: `backend/src/main/resources/application.yml`
- `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY` / `STORAGE_BUCKET_NAME`

### 🔹 토스페이먼츠 (결제 테스트)
- **기입 위치**: 프로젝트 루트 `/.env`
- **참조 위치**: `backend/src/main/resources/application.yml`
- `PAYMENT_CLIENT_KEY` / `PAYMENT_SECRET_KEY`

---

> **Tip**: 기본적으로 모든 환경 변수는 프로젝트 루트의 **`.env`** 파일에 모아서 관리하며, Docker Compose와 Spring Boot가 이를 참조하여 로드합니다. 단, `ai-service`는 별도의 폴더 내에 `.env`를 가질 수 있습니다.
