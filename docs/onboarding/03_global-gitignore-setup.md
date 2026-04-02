# Global Gitignore 설정 가이드

## 1. 개요

Global gitignore는 **내 컴퓨터의 모든 Git 저장소**에 공통으로 적용되는 무시 규칙 파일입니다. Git이 설계 단계부터 의도한 공식 기능이며, 운영체제나 IDE가 자동 생성하는 파일을 개인 환경 수준에서 처리하기 위한 표준 방법입니다.

---

## 2. 왜 필요한가

### 2.1 문제: 프로젝트 `.gitignore`의 한계

프로젝트 `.gitignore`는 **팀 전체가 공유하는 규칙**입니다. 그런데 여기에 개인 환경 파일(`.DS_Store`, `.idea/` 등)을 넣으면 다음과 같은 문제가 발생합니다.

| 문제        | 설명                                                                   |
| ----------- | ---------------------------------------------------------------------- |
| 무한 증식   | 팀원마다 OS와 에디터가 다르므로, 모든 조합의 규칙이 계속 추가됨        |
| 책임 불명확 | 프로젝트 관련 규칙과 개인 환경 규칙이 뒤섞여 유지보수가 어려움         |
| PR 오염     | 기여자가 자신의 에디터 설정을 `.gitignore`에 슬쩍 추가하는 사례가 빈번 |
| 반복 작업   | 새 프로젝트를 만들 때마다 같은 OS/IDE 규칙을 매번 복사해야 함          |

### 2.2 해결: 책임 분리

Git은 ignore 규칙을 **세 가지 레벨**로 분리하여 설계되어 있습니다.

```
┌─────────────────────────────────────────────────────────────────┐
│ 레벨 1: Global gitignore (~/.gitignore_global)                  │
│ - 내 OS, 에디터가 생성하는 파일                                    │
│ - 내 컴퓨터의 모든 저장소에 적용                                    │
│ - Git에 커밋되지 않음 (나만 사용)                                  │
├─────────────────────────────────────────────────────────────────┤
│ 레벨 2: 프로젝트 .gitignore                                      │
│ - 빌드 결과물, 의존성 패키지, 시크릿 등 프로젝트 관련 파일             │
│ - 해당 프로젝트에만 적용                                           │
│ - Git에 커밋됨 (팀 전체 공유)                                     │
├─────────────────────────────────────────────────────────────────┤
│ 레벨 3: 로컬 exclude ($GIT_DIR/info/exclude)                    │
│ - 특정 저장소에서만 무시하고 싶은 개인 파일                           │
│ - 해당 저장소에만 적용                                             │
│ - Git에 커밋되지 않음 (나만 사용)                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 공식 근거

### 3.1 Git 공식 문서 (git-scm.com)

Git 공식 문서는 사용자가 모든 상황에서 Git이 무시하도록 하고 싶은 패턴(예: 에디터가 생성하는 백업이나 임시 파일)은 `core.excludesFile`로 지정된 파일에 넣으라고 명시하고 있습니다.

### 3.2 GitHub 공식 문서 (docs.github.com)

GitHub는 항상 특정 파일이나 디렉토리를 무시하려면 `~/.config/git/ignore` 파일에 추가하라고 안내하며, 글로벌 설정 파일에 나열된 모든 파일과 디렉토리를 Git이 무시한다고 설명합니다.

### 3.3 GitHub 공식 gitignore 저장소

`github/gitignore` 저장소에는 `Global/` 디렉토리가 별도로 존재하며, macOS, Windows, Linux, JetBrains, VisualStudioCode 등 OS별, 에디터별 Global gitignore 템플릿을 공식 제공하고 있습니다.

### 3.4 Atlassian (Bitbucket)

Atlassian 역시 `core.excludesFile` 속성을 설정하여 로컬 시스템의 모든 저장소에 대한 글로벌 ignore 패턴을 정의할 수 있다고 안내하며, 운영체제별 파일(`.DS_Store`, `Thumbs.db`)이나 개발 도구가 생성하는 임시 파일이 전역적으로 무시하기에 적합한 후보라고 설명합니다.

---

## 4. 설정 방법

### 4.1 파일 생성

```bash
touch ~/.gitignore_global
```

> **참고:** 파일 이름과 경로는 자유롭게 지정할 수 있습니다.
> 흔히 사용되는 이름: `~/.gitignore_global`, `~/.gitignore`, `~/.config/git/ignore`

### 4.2 Git에 등록

```bash
git config --global core.excludesfile ~/.gitignore_global
```

### 4.3 설정 확인

```bash
git config --global core.excludesfile
# 출력: /Users/내이름/.gitignore_global
```

> 이 두 단계는 **컴퓨터당 딱 한 번만** 실행하면 됩니다.

---

## 5. 권장 Global gitignore 내용

```gitignore
# ================================================
# macOS
# ================================================
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes

# ================================================
# Windows
# ================================================
Thumbs.db
ehthumbs.db
Desktop.ini
$RECYCLE.BIN/

# ================================================
# Linux
# ================================================
*~

# ================================================
# IDE / Editor
# ================================================
.idea/
.vscode/
*.iml
*.iws
*.ipr
*.sw?
*.suo
*.ntvs*
*.njsproj
*.sln
*.sublime-workspace
*.sublime-project

# ================================================
# 개인 작업 폴더
# ================================================
_local/
scratch/
```

### 5.1 각 항목 설명

| 패턴              | 생성 주체                         | 설명                                         |
| ----------------- | --------------------------------- | -------------------------------------------- |
| `.DS_Store`       | macOS Finder                      | 폴더 메타데이터 (아이콘 위치, 보기 설정 등)  |
| `.DS_Store?`      | macOS                             | `.DS_Store`의 변형 파일                      |
| `._*`             | macOS                             | 리소스 포크 (Resource Fork) 메타데이터       |
| `.Spotlight-V100` | macOS Spotlight                   | 검색 인덱스 데이터                           |
| `.Trashes`        | macOS                             | 휴지통 메타데이터                            |
| `Thumbs.db`       | Windows Explorer                  | 이미지 썸네일 캐시                           |
| `ehthumbs.db`     | Windows Media Center              | 미디어 썸네일 캐시                           |
| `Desktop.ini`     | Windows                           | 폴더 표시 설정                               |
| `$RECYCLE.BIN/`   | Windows                           | 휴지통 폴더                                  |
| `*~`              | Linux/Vim/Emacs                   | 편집기 백업 파일 (예: `file.txt~`)           |
| `.idea/`          | JetBrains (IntelliJ, WebStorm 등) | IDE 프로젝트 설정                            |
| `.vscode/`        | Visual Studio Code                | 에디터 설정                                  |
| `*.iml`           | JetBrains                         | IntelliJ 모듈 파일                           |
| `*.iws`, `*.ipr`  | JetBrains                         | IntelliJ 워크스페이스/프로젝트 파일 (레거시) |
| `*.sw?`           | Vim                               | 스왑 파일 (`.swp`, `.swo` 등)                |
| `*.suo`           | Visual Studio                     | 솔루션 사용자 옵션                           |
| `*.ntvs*`         | Node.js Tools for VS              | Node.js 도구 설정                            |
| `*.njsproj`       | Visual Studio                     | Node.js 프로젝트 파일                        |
| `*.sln`           | Visual Studio                     | 솔루션 파일                                  |
| `*.sublime-*`     | Sublime Text                      | 에디터 워크스페이스/프로젝트 설정            |
| `_local/`         | 개인 관례                         | 로컬 실험용 폴더                             |
| `scratch/`        | 개인 관례                         | 임시 메모/스크래치 폴더                      |

---

## 6. 프로젝트 `.gitignore`와의 관계

### 6.1 판단 기준

```
이 파일이 왜 생겼는가?
    │
    ├── 내 OS 때문에 (.DS_Store, Thumbs.db)
    │   └── ✅ Global gitignore
    │
    ├── 내 에디터 때문에 (.idea/, .vscode/)
    │   └── ✅ Global gitignore
    │
    └── 프로젝트 때문에 (node_modules/, build/, .env, *.tfstate)
        └── ✅ 프로젝트 .gitignore
```

### 6.2 안전망(Safety Net) 전략

Global gitignore는 **개인 설정**이므로, 팀원 중 설정하지 않은 사람이 있을 수 있습니다. 이를 대비해 프로젝트 `.gitignore`에 **최소한의 안전망**을 두는 것이 실무적으로 안전합니다.

```gitignore
# 프로젝트 .gitignore 상단에 안전망으로 유지 (최소한만)
# ℹ️  이 항목들은 Global gitignore에서 관리하는 것이 모범 사례입니다.
#    Global 설정을 하지 않은 팀원을 위한 안전망으로 유지합니다.
.DS_Store
Thumbs.db
Desktop.ini
.idea/
.vscode/
```

> **주의:** 안전망에는 가장 흔한 항목만 넣고, 전체 목록을 복사하지 않습니다.
> 전체를 복사하면 Global gitignore의 의미가 없어집니다.

### 6.3 Global gitignore에 넣으면 안 되는 것

| 패턴              | 이유                                           |
| ----------------- | ---------------------------------------------- |
| `node_modules/`   | 프로젝트 도구(npm)가 생성, 팀 전체에 적용 필요 |
| `build/`, `dist/` | 빌드 결과물, 프로젝트마다 구조가 다름          |
| `.env`            | 프로젝트 시크릿, 프로젝트 규칙으로 관리        |
| `*.tfstate`       | Terraform 상태 파일, 인프라 프로젝트 규칙      |
| `*.log`           | 프로젝트 로그, 프로젝트마다 정책이 다름        |

---

## 7. `.terraform.lock.hcl` 참고 사항

Terraform을 사용하는 프로젝트의 경우, `.terraform.lock.hcl` 파일은 **의도적으로 무시하지 않고 반드시 커밋**해야 합니다.

Terraform은 특정 provider에 대한 의존성이 여전히 존재하는지 판단하기 위해 두 가지 소스(설정 파일과 상태 파일)를 사용합니다. 만약 설정과 상태 모두에서 특정 provider에 대한 마지막 의존성을 제거하면, `terraform init`이 해당 provider에 대한 기존 lock 파일 항목을 제거합니다.

이 파일은 버전 관리 저장소에 포함해야 하며, 설정 자체의 변경 사항을 논의하듯이 외부 의존성의 변경 사항도 코드 리뷰를 통해 논의할 수 있습니다.

특정 provider가 lock 파일에 이미 기록된 선택이 있으면, 더 새로운 버전이 출시되었더라도 Terraform은 항상 해당 버전을 재선택하여 설치합니다. 이는 팀 전체가 동일한 provider 버전을 사용하도록 보장합니다.

따라서 `.terraform.lock.hcl`은 Global gitignore든 프로젝트 `.gitignore`든 **어디에도 추가하지 않아야** 합니다.

---

## 8. 팀 온보딩 체크리스트

새로운 팀원이 합류할 때 아래 항목을 안내합니다.

```
□ 1. Global gitignore 파일 생성
     touch ~/.gitignore_global

□ 2. Git에 등록
     git config --global core.excludesfile ~/.gitignore_global

□ 3. 섹션 5의 권장 내용을 파일에 작성

□ 4. 설정 확인
     git config --global core.excludesfile
     → 경로가 출력되면 완료
```

---

## 9. 자주 묻는 질문 (FAQ)

### Q1. Global gitignore를 설정하면 프로젝트 `.gitignore`는 무시되나요?

아닙니다. 두 파일은 **합산(union)** 으로 동작합니다. 두 파일에 적힌 모든 패턴이 동시에 적용됩니다.

### Q2. Global gitignore를 Git에 커밋해야 하나요?

아닙니다. Global gitignore는 홈 디렉토리(`~/`)에 위치하며, 어떤 저장소에도 속하지 않습니다. 개인 환경 설정이므로 커밋 대상이 아닙니다.

### Q3. 팀원 전원이 반드시 설정해야 하나요?

권장 사항이지 강제는 아닙니다. 설정하지 않은 팀원을 위해 프로젝트 `.gitignore`에 최소한의 안전망을 유지하는 이유가 바로 이것입니다.

네, 잘려나간 Q4 부분 전체를 완성하겠습니다.

---

### Q4. 이미 커밋된 `.DS_Store` 같은 파일은 어떻게 하나요?

`.gitignore`에 추가하더라도 이미 추적 중인 파일은 자동으로 제거되지 않습니다. 아래 명령어로 추적을 해제해야 합니다.

```bash
# 특정 파일 추적 해제 (파일 자체는 삭제하지 않음)
git rm --cached .DS_Store

# 하위 디렉토리 포함, 모든 .DS_Store를 재귀적으로 추적 해제
find . -name ".DS_Store" -print0 | xargs -0 git rm --cached --ignore-unmatch

# Thumbs.db도 동일하게 처리
find . -name "Thumbs.db" -print0 | xargs -0 git rm --cached --ignore-unmatch

# .idea/ 디렉토리 전체 추적 해제
git rm --cached -r .idea/

# 변경 사항 커밋
git commit -m "chore: remove tracked OS/IDE files from git history"
```

> **주요 옵션 설명**
>
> | 옵션               | 설명                                                          |
> | ------------------ | ------------------------------------------------------------- |
> | `--cached`         | Git 인덱스(추적 목록)에서만 제거하고, 로컬 파일은 그대로 유지 |
> | `-r`               | 디렉토리를 재귀적으로 제거할 때 사용                          |
> | `--ignore-unmatch` | 해당 파일이 없어도 에러 없이 넘어감 (스크립트에서 유용)       |

> **⚠️ 주의:** `--cached` 없이 `git rm`을 실행하면 로컬 파일까지 삭제됩니다. 반드시 `--cached` 옵션을 포함하세요.
