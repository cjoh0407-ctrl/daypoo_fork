# 프로젝트 협업 환경 세팅 (Initial Setup Plan)

본 문서는 백엔드(Java), 프론트엔드(React/Node.js), AI(Python) 팀원들이 하나의 모노레포(Monorepo)에서 효율적으로 협업하기 위해 구축된 **초기 세팅 정보**를 담고 있습니다.

---

## 1. 저장소(Repository) 및 기술 스택 정보

단일 저장소 내에 서브젝트별로 폴더를 엄격하게 분리하여 관리하며, 각 프로젝트는 다음의 실제 버전을 따릅니다.

### 1.1 기술 스택 및 버전 정보

- **프론트엔드 (`/frontend`)**
  - **Node.js**: `v20.x` (LTS)
  - **React**: `v19.x` (최신 안정화 버전)
  - **빌드/개발 도구**: `Vite`, `Tailwind CSS v4`
  - **상태 관리/라우팅**: `Zustand`, `React Router v7`
- **백엔드 (`/backend`)**
  - **Java**: `JDK 21` (LTS)
  - **프레임워크**: `Spring Boot 3.4.3`
  - **빌드 도구**: `Gradle`
  - **API 명세**: `Swagger UI` (Springdoc OpenAPI v2.8.5)
- **AI 서비스 (`/ai-service`)**
  - **Python**: `v3.12.x` (slim)
  - **웹 프레임워크**: `FastAPI` (내장 Swagger 제공)
  - **주요 라이브러리**: `LangChain`, `LangGraph`, `Uvicorn`

### 1.2 폴더 구조 규약

```
DayPoo/
├── .github/                # GitHub 템플릿(PR, Issue) 및 Workflow 관리
├── .husky/                 # 전역 Git 훅(commitlint, lint-staged) 관리
├── docs/                   # 프로젝트 문서 통합 관리 (architecture, guides, history, plans 등)
├── frontend/               # React(19) + Vite + Tailwind v4
├── backend/                # Spring Boot(3.4) + Java 21 + JPA/QueryDSL
├── ai-service/             # FastAPI + Python 3.12 (app/api, app/core 등)
├── package.json            # 루트 패키지 (Husky 및 전역 lint-staged 설정)
└── README.md
```

---

## 2. 브랜치 전략 및 깃(Git) 협업 규칙 (Forking Workflow 기반)

- **저장소 운영 방식**: 팀(Organization)의 원본(Upstream) 저장소를 각 팀원이 자신의 계정으로 **Fork(포크)** 한 후 작업하는 방식을 사용합니다.
- **운영 브랜치**: `main` (배포 및 통합용)
- **기능 브랜치**: 팀원은 자신의 Fork 저장소에서 `feature/[기능명]` 형태로 브랜치를 파서 작업합니다.
- **Merge 원칙**: Fork 저장소의 `feature` 브랜치에서 원본(Upstream) 저장소의 `main` 브랜치로 PR을 생성합니다. 최소 1명 이상의 리뷰어 승인 후 "Squash and Merge" 합니다.

---

## 3. 커밋 메시지 규약 강제화 (Commitlint + Husky)

루트(root) 폴더에서 전역적으로 Git Hook을 통제합니다. [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) 메시지 규칙을 강제합니다.

- **예시**: `feat: 로그인 기능 추가`, `fix: 지도 마커 오류 수정`, `chore: 의존성 업데이트`
- **사용 도구**: `husky`, `@commitlint/cli`
- 규칙에 어긋나면 커밋이 거부됩니다.

---

## 4. 모듈별 코드 포맷팅 & 린팅 자동화 (Lint-staged)

커밋 시 변경된 파일을 감지하여 언어별 Linter와 Formatter를 자동 실행합니다.

### 4.1 프론트엔드 (`/frontend`)
- **도구**: `ESLint`, `Prettier`
- **규칙**: 싱글 쿼터, 세미콜론 사용, Tailwind 클래스 자동 정렬 등.

### 4.2 백엔드 (`/backend`)
- **도구**: `Spotless` (Google Java Format)
- **규칙**: 미사용 import 자동 제거, 구글 자바 포맷 적용.

### 4.3 AI 서비스 (`/ai-service`)
- **도구**: `Black`, `isort`
- **규칙**: PEP 8 준수 및 import 정렬.

---

## 5. 초기 세팅 완료 상태 (Checklist)

현재 프로젝트의 초기 환경 구축은 다음과 같이 완료되었습니다.

- [x] 5.1 루트 폴더 설정 및 Husky/Commitlint 세팅
- [x] 5.2 프론트엔드(`frontend/`) 스캐폴딩 (React 19 + Tailwind v4)
- [x] 5.3 백엔드(`backend/`) 스캐폴딩 (Spring Boot 3.4.3 + Java 21)
- [x] 5.4 AI 서비스(`ai-service/`) 스캐폴딩 (Python 3.12 + FastAPI)
- [x] 5.5 GitHub Issue/PR 템플릿 부착
- [x] 5.6 로컬 개발 환경용 Docker Compose 구성 (Postgres, Redis)
- [x] 5.7 AWS 배포 워크플로우(GitHub Actions) 구축

---

> **Tip**: 온보딩 시 이 문서를 먼저 읽고 전체적인 기술 스택과 협업 규칙을 파악해 주세요. 상세한 작업 방법은 `docs/onboarding/` 내의 다음 번호 문서들을 참고하시기 바랍니다.
