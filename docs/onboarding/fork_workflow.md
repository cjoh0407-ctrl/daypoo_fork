# 🔄 DayPoo Forking Workflow 가이드

우리 프로젝트(DayPoo)는 원본 저장소(`Upstream`)를 안전하게 보호하고, 각자의 공간에서 자유롭게 실험하며 코드를 작성할 수 있도록 **Fork(포크) 기반 협업 방식**을 채택했습니다.

새롭게 합류하신 팀원분들은 아래의 1~5단계를 순서대로 따라 초기 세팅과 일일 개발 사이클을 연습해 보세요!

---

## 🚀 [최초 1회] 내 컴퓨터에 작업 환경 세팅하기

### 1단계: 원본 저장소 Fork & Clone

1. DayPoo 원본 GitHub 저장소 페이지(Organization 저장소)에 접속합니다.
2. 우측 상단의 **[Fork]** 버튼을 눌러 자신의 GitHub 계정으로 저장소를 통째로 복사합니다.
3. 내 계정으로 복사된(Fork된) 저장소의 주소를 복사한 뒤, 내 컴퓨터(로컬) 터미널을 열고 클론합니다.
   ```bash
   # 팀원의 터미널에서 실행
   git clone [내 깃허브 계정에 Fork된 저장소 주소 URL]
   cd daypoo
   ```

### 2단계: 최신 원본 코드 추적 설정 (Upstream 등록)

원본 저장소에서 다른 팀원들이 작업한 최신 코드를 내 컴퓨터로 계속 받아오기 위해, 로컬 저장소에 원본 주소(`upstream`)를 등록해야 합니다.

```bash
# 원본 저장소 주소를 'upstream'이라는 이름으로 등록
git remote add upstream [DayPoo 원본 저장소 주소 URL]

# 제대로 등록되었는지 확인 (origin과 upstream 두 개가 보이면 정상)
git remote -v
```

### 3단계: 필수 초기 세팅 실행 (매우 중요 ⭐️)

클론을 받았어도 아직 내 컴퓨터에는 **문법 검사 및 커밋 규칙을 제어하는 봇(Husky)**이 설치되어 있지 않습니다.

```bash
# 루트 폴더에서 이 명령어 한 번이면 자동으로 모든 제약 조건 봇이 활성화됩니다!
npm install
```

---

### 4단계: 각 파트별 의존성 설치

루트 `npm install`은 Git Hook만 활성화합니다. 실제 개발에 필요한 라이브러리는 각 폴더에서 따로 설치해야 합니다.

#### ⚛️ 프론트엔드 (React + Vite)

```bash
cd frontend
npm install
```

#### ☕ 백엔드 (Spring Boot + Gradle)

Gradle은 빌드 시 의존성을 자동으로 다운로드합니다. 아래 명령어를 실행하면 의존성을 미리 받아올 수 있습니다.

```bash
cd backend

# Windows
gradlew.bat dependencies

# Mac / Linux
./gradlew dependencies
```

#### 🐍 AI 서비스 (Python)

```bash
cd ai-service

# 가상환경 생성 (최초 1회)
python -m venv .venv

# 가상환경 활성화
.venv\Scripts\activate         # Windows
# source .venv/bin/activate    # Mac / Linux

# 의존성 설치
pip install -r requirements.txt
```

> 💡 **Tip:** 이후 AI 서비스 작업 시에는 매번 가상환경을 활성화(`activate`)한 후 작업해주세요!

---

## 💻 [매일 반복] 일일 기능 개발 사이클

자, 이제 **'새로운 기능(예: 지도 마커 추가)'**을 개발하라는 임무를 받았다고 가정해 봅시다. 매일 개발을 시작할 때와 끝낼 때는 아래 사이클을 반복합니다.

### 5단계: 최신화 및 브랜치 생성

항상 가장 최신 코드를 바탕으로 작업해야 나중에 병합(Merge)할 때 붉은 에러(Conflict)를 막을 수 있습니다.

```bash
# 1. 원본(upstream)의 최신 코드를 받아와서 내 로컬 main 폴더를 최신화
git pull upstream main

# 2. 내 작업용 독립 브랜치 생성 및 이동 (규칙: 자율, 권장: feature/[기능명])
git checkout -b feature/map-marker
```

### 6단계: 열심히 코딩하고 커밋하기

이제 코드를 열심히 작성합니다! 에러가 나든 지저분하게 짜든 괜찮습니다.
작업을 마치고 저장을 한 뒤, 커밋을 시도합니다.

```bash
git add .

# 우리가 설정한 규칙에 맞게 커밋 메시지 작성! (타입: 내용)
git commit -m "feat: 카카오맵 마커 렌더링 추가"
```

> **🪄 여기서 마법 발생!**
> 커밋을 누르는 순간 Husky가 자동으로 실행되어, 내가 수정한 코드의 들여쓰기와 띄어쓰기를(Prettier, Spotless 등) **최고의 표준에 맞게 자동으로 착착 다림질해 줍니다.** 만약 치명적인 오류가 있다면 여기서 멈춰서 알려줍니다!

검사를 무사히 통과했다면, 다림질된 코드를 **나의 깃허브(origin)**에 올립니다.

```bash
git push origin feature/map-marker
```

### 7단계: 원본에 합쳐달라고 요청하기 (Pull Request 날리기)

1. 팀원의 깃허브(내 포크된 저장소)에 들어가면 위에 **"Compare & pull request"**라는 초록색 버튼이 뜹니다. 클릭!
2. 목적지(base)를 **원본 저장소(Upstream)의 `main`**으로 잘 맞춥니다.
3. 우리가 아까 만들어둔 **PR 템플릿(체크리스트)**이 자동으로 뜹니다. 내용을 정성스럽게 채우고 제출!
4. 리뷰어(팀장 등)가 코드를 확인하고 승인(Approve)하면, 자랑스럽게 짠 내 코드가 원본 저장소에 "Squash and Merge"로 영원히 기록됩니다! 🎉

### 8단계: PR 머지 후 — 팀원 모두 최신 코드 동기화하기

내 PR이 원본 저장소(`Upstream`)의 `main`에 머지되었다면, **모든 팀원은 자신의 로컬을 최신 상태로 업데이트**해야 합니다. 그래야 다음 작업이 최신 코드 위에서 시작됩니다.

```bash
# 1. main 브랜치로 이동
git checkout main

# 2. 원본(upstream)의 최신 코드를 받아와서 내 로컬 main 동기화
#    ⚠️ 'git pull origin main'이 아닌 'upstream'임을 주의!
#       origin = 내 포크 저장소 / upstream = 원본(팀) 저장소
git pull upstream main

# 3. (선택) 내 포크(origin)에도 반영해두기
git push origin main

# 4. 다음 작업을 위한 새 브랜치 생성
git checkout -b feature/다음-기능
```

> **💡 왜 `origin`이 아닌 `upstream`인가요?**
> - `origin` = **내 포크 저장소** (내 GitHub 계정의 복사본)
> - `upstream` = **원본 팀 저장소** (PR이 머지된 실제 목적지)
>
> PR이 머지되는 곳은 `upstream`이므로, 최신 코드도 `upstream`에서 받아와야 합니다!

---

> **전체 흐름 요약**:
>
> `Fork + Clone` ➔ `upstream 등록` ➔ `최신화(pull upstream)` ➔ `브랜치 생성` ➔ `코딩 + 커밋` ➔ `내 포크에 push` ➔ `PR 제출` ➔ `머지 완료` ➔ **`다시 pull upstream`** ➔ ♻️ 무한 반복!
