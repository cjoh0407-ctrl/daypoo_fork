# 프로젝트 초기 협업 환경 세팅 계획 (Initial Setup Plan)

본 문서는 `plan.md`의 전체 구조를 바탕으로, 백엔드(Java), 프론트엔드(React/Node.js), AI(Python) 팀원들이 하나의 모노레포(Monorepo)에서 부딪힘 없이 협업하기 위한 **초기 세팅**에 집중한 구체적 실행 계획입니다.

설정이 완료된 후 각자의 기능 개발을 시작하게 됩니다.

---

## 1. 저장소(Repository) 및 기술 스택 설정

단일 저장소 내에 서브젝트별로 폴더를 엄격하게 분리하여 관리하며, 각 프로젝트는 다음의 명확한 버전과 스택을 따릅니다.

### 1.1 기술 스택 및 버전 정보

- **프론트엔드 (`/frontend`)**
  - **Node.js**: `v20.x` (LTS 권장)
  - **React**: `v18.x` (최신 안정화 버전)
  - **빌드/개발 도구**: `Vite`
  - **상태 관리/라우팅**: `Zustand`, `React Router v6`
- **백엔드 (`/backend`)**
  - **Java**: `JDK 21` (LTS)
  - **프레임워크**: `Spring Boot 3.2.x` (또는 최신 3.x)
  - **빌드 도구**: `Gradle`
  - **API 명세**: `Swagger UI` (Springdoc OpenAPI v2)
- **AI 서비스 (`/ai-service`)**
  - **Python**: `v3.11.x`
  - **웹 프레임워크**: `FastAPI` (내장 Swagger 제공)
  - **주요 라이브러리**: `LangChain`, `LangGraph`

### 1.2 폴더 구조 규약

```
DayPoo/
├── .github/                # GitHub 템플릿(PR, Issue) 관리
├── .husky/                 # 전역 Git 훅(commitlint, lint-staged) 관리
├── frontend/               # React(18) + Vite 기반 SPA (Node.js 생태계)
├── backend/                # Spring Boot(3.x) + Java 21 애플리케이션 (Gradle 생태계)
├── ai-service/             # FastAPI + Python 3.11 애플리케이션
├── package.json            # 루트 패키지 (Husky 및 공통 스크립트 실행용)
└── README.md
```

---

## 2. 브랜치 전략 및 깃(Git) 협업 규칙 (Forking Workflow 기반)

- **저장소 운영 방식**: 팀(Organization)의 원본(Upstream) 저장소를 각 팀원이 자신의 계정으로 **Fork(포크)** 한 후, 개별 Fork 저장소에서 작업하여 원본 저장소로 PR(Pull Request)을 날리는 방식을 사용합니다.
- **운영 브랜치**: `main` (원본 저장소 배포용)
- **개발 브랜치**: `develop` (원본 저장소 통합용)
- **기능 브랜치**: 팀원은 자신의 Fork 저장소에서 `feature/[기능명]` 형태로 브랜치를 파서 작업합니다.
- **Merge 원칙**: Fork 저장소의 `feature` 브랜치에서 원본(Upstream) 저장소의 `develop` 브랜치로 PR을 생성합니다. 최소 1명 이상의 리뷰어 승인(Approve) 후 원본 저장소에 "Squash and Merge" 합니다.

### 2.1 일일 개발 사이클 실전 루틴

```
[최초 1회] Fork → Clone → upstream 등록 → npm install
     ↓
[매 작업마다] git pull upstream main   ← 항상 최신 코드베이스에서 시작!
     ↓
git checkout -b feature/기능명
     ↓
코딩 → git add . → git commit -m "feat: 기능 설명"
(커밋 시 Husky가 자동으로 코드 포맷팅 및 메시지 규칙 검사)
     ↓
git push origin feature/기능명
     ↓
GitHub에서 PR 제출 (upstream의 main 또는 develop으로 목적지 설정)
     ↓
리뷰어 Approve → Squash and Merge 완료 🎉
     ↓
[모든 팀원] git checkout main → git pull upstream main   ← 필수!
```

> ⚠️ **주의**: `git pull origin main`이 아닌 **`git pull upstream main`** 을 사용해야 합니다.
> - `origin` = 내 포크 저장소 (내 GitHub 계정)
> - `upstream` = 원본 팀 저장소 (PR이 실제로 머지된 곳)

---

## 3. 커밋 메시지 규약 강제화 (Commitlint + Husky)

루트(root) 폴더에서 Node.js를 이용해 전체 프로젝트의 Git Hook(커밋 시점 검사)을 통제합니니다. Commitlint를 적용하여 [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) 메시지 규칙을 강제합니다.

- **예시 포맷**: `feat: 로그인 기능 추가` / `fix: 카카오맵 마커 렌더링 오류 수정` / `chore: Husky 설정 수정`
- **사용 도구**: `husky`, `@commitlint/cli`, `@commitlint/config-conventional`
- 커밋 메시지 양식이 어긋나면 커밋이 거부됩니다.

---

## 4. 모듈별 코드 포맷팅 & 린팅 자동화 (Lint-staged)

커밋하는 순간, 변경이 발생한 폴더(frontend, backend, ai)를 감지하고 해당 언어에 맞는 Linter와 Formatter를 백그라운드에서 실행시킵니다. (`lint-staged` 사용)

### 4.1 프론트엔드 (`/frontend`)

- **도구**: `ESLint`, `Prettier`
- **검사 내용**: Javascript/JSX/CSS 문법 거사, 탭 간격 및 세미콜론 강제 적용.
- **실행 명령**: `cd frontend && npm run lint`

### 4.2 백엔드 (`/backend`)

- **도구**: `Spotless` (Gradle 플러그인)
- **검사 내용**: Java 파일 코드 네이밍, 불필요한 import 제거, 구글 자바 포맷 적용.
- **실행 명령**: `cd backend && ./gradlew spotlessApply`

### 4.3 AI 서비스 (`/ai-service`)

- **도구**: `Black` (포매터), `isort` (import 정렬), `Flake8` (린터)
- **검사 내용**: 파이썬 권장 스타일 규약(PEP 8) 준수 여부, 사용하지 않는 변수 검사.
- **실행 명령**: `cd ai-service && black . && isort . && flake8 .`

---

## 5. GitHub 템플릿 도입

협업 중 이슈 및 PR 규격을 하나로 맞추어 리뷰 시간을 단축합니다.

- **Issue Templates** (`.github/ISSUE_TEMPLATE/`):
  - 버그 리포트 템플릿 (`bug_report.md`)
  - 기능 제안 템플릿 (`feature_request.md`)
- **PR Template** (`.github/pull_request_template.md`):
  - 변경 사항 요약, 연관 이슈 트래킹, 테스트 내역 등을 명시하도록 강제.

---

## 6. 초기 세팅 상세 수행 Todo List (Checklist)

이 문서를 바탕으로 다음 작업들을 순차적으로 실행(추후 implement)할 예정입니다. 모든 과정은 AI가 임의의 추측 없이 100% 명확하게 수행할 수 있도록 구체적인 의존성 및 설정 명령어를 포함합니다.

- [ ] 6.1 루트 폴더 설정
  - [ ] 프로젝트 최상단 이동 후 `npm init -y` 명령어로 루트 `package.json` 생성.
  - [ ] 루트 템플릿 `.gitignore` 생성 (내용: `node_modules/`, `.env`, `.DS_Store`, `frontend/dist/`, `backend/build/`, `ai-service/__pycache__/`, `.venv/` 등 공통 무시 파일 병합).

- [ ] 6.2 프론트엔드(`frontend/`) 스캐폴딩 및 린팅 세팅 (React 18 + Vite)
  - [ ] `npm create vite@latest frontend -- --template react` 명령어로 프론트엔드 뼈대 생성.
  - [ ] `cd frontend && npm install` 후 기본 라이브러리 설치: `npm i axios react-router-dom zustand lucide-react`
  - [ ] 개발 의존성 설치: `npm i -D eslint prettier eslint-config-prettier eslint-plugin-react`
  - [ ] `frontend/.prettierrc` 생성: `{ "singleQuote": true, "trailingComma": "all", "printWidth": 100, "tabWidth": 2, "semi": true }` 규칙 적용.

- [ ] 6.3 백엔드(`backend/`) 스캐폴딩 및 린팅 세팅 (Spring Boot 3.2.x, Java 21)
  - [ ] Spring Initializr API(`curl https://start.spring.io/starter.zip`)를 사용하여 의존성(`web`, `data-jpa`, `postgresql`, `lombok`, `validation`)이 포함된 Gradle 프로젝트 다운로드 후 `backend/` 폴더에 압축 해제.
  - [ ] `backend/build.gradle`에 `spotless-plugin-gradle` 의존성 추가.
  - [ ] Spotless 설정 속성 추가: `java { googleJavaFormat() }` 및 린트 명령 테스트 (`./gradlew spotlessCheck`).

- [ ] 6.4 AI 서비스(`ai-service/`) 스캐폴딩 및 린팅 세팅 (Python 3.11 + FastAPI)
  - [ ] `ai-service/` 디렉토리 생성 및 `python -m venv .venv` 로 가상환경 세팅.
  - [ ] `ai-service/requirements.txt` 생성: `fastapi`, `uvicorn`, `langchain`, `langgraph`, `groq`, `black`, `flake8`, `isort` 명시.
  - [ ] 루트 폴더 또는 `ai-service/` 내부에 `pyproject.toml` 생성 후 Black(line-length 88), isort 프로파일 세팅.

- [ ] 6.5 Husky & Commitlint & Lint-staged 중앙 통제 시스템 설치
  - [ ] 루트 위치에서 패키지 설치: `npm i -D husky lint-staged @commitlint/cli @commitlint/config-conventional`
  - [ ] `npx husky init` 실행 후 `.husky/pre-commit` 및 `.husky/commit-msg` 파일 훅 연결.
  - [ ] `.husky/commit-msg` 파일 안에 `npx --no -- commitlint --edit "${1}"` 입력하여 검증 스크립트 작성.
  - [ ] 루트 디렉토리 `commitlint.config.js` 생성: `module.exports = { extends: ['@commitlint/config-conventional'] };`
  - [ ] 루트 `package.json`의 `lint-staged` 속성에 환경별 경로 매칭 추가:
    ```json
    "lint-staged": {
      "frontend/**/*.{js,jsx,ts,tsx,css}": ["prettier --write", "eslint --fix"],
      "ai-service/**/*.py": ["black", "isort", "flake8"],
      "backend/**/*.java": ["cd backend && ./gradlew spotlessApply"]
    }
    ```

- [ ] 6.6 GitHub 템플릿 부착
  - [ ] `.github/ISSUE_TEMPLATE/` 생성 후 `bug_report.md` 와 `feature_request.md` 규격 파일 작성.
  - [ ] `.github/pull_request_template.md` 생성하여 PR 시 체크리스트 형식 부여.

- [ ] 6.7 로컬 데이터베이스 개발 환경 세팅 (Docker Compose)
  - [ ] 프로젝트 최상단(루트)에 `docker-compose.yml` 파일 생성.
  - [ ] PostgreSQL 16 서비스 설정 스크립트 작성 (포트 5432, 볼륨 마운트, 환경변수 `POSTGRES_PASSWORD`, `POSTGRES_DB=daypoo` 세팅, PostGIS 확장 포함).
  - [ ] Redis 서비스 설정 스크립트 작성 (포트 6379, 캐싱 및 세션/Rate Limit 용도).
