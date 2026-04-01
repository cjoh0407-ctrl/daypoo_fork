# 람다봇(main.py) API 규격 정합성 개선 계획

## 1. 개요
현재 배포된 람다봇(`main.py`)이 백엔드의 최신 API 규격과 일치하지 않아 404 Not Found 및 400 Bad Request 에러로 인해 정상 작동하지 않고 있습니다. 이를 최신 API 명세에 맞춰 전면 수정하는 계획을 수립합니다.

## 2. 주요 수정 사항 및 계획

### **[작업 1] 화장실 조회 로직 수정 (Toilets API)**
- **대상:** `main.py` 내 화장실 조회 호출 부분
- **수정 내용:**
    - 호출 경로 변경: `/toilets/nearby` → `/toilets`
    - 파라미터명 변경: `lat` → `latitude`, `lng` → `longitude`
    - 반환 데이터 구조 확인: 백엔드가 `List<ToiletResponse>`를 직접 반환하므로 이에 맞춰 파라싱 로직 단순화.
- **목적:** 존재하지 않는 경로 호출 문제를 해결하고 정확한 위치 기반 화장실 데이터를 획득합니다.

### **[작업 2] 배변 기록 생성 로직 수정 (Poo Records API)**
- **대상:** `main.py` 내 `POST /records` 호출 부분
- **수정 내용:**
    - **필수 필드 추가:** `toiletId`, `latitude`, `longitude` 필드를 생성 요청 본문에 반드시 포함 (작업 1에서 얻은 데이터 활용).
    - **필드명 및 타입 매핑:**
        - `shape` (기존) → `bristolScale` (Integer 타입으로 매핑)
        - `color` (유지)
        - `smellLevel` 등 (기존) → `conditionTags` (List<String> 타입으로 매핑)
- **목적:** 백엔드의 필수 유효성 검증(@NotNull) 통과 및 데이터 정합성을 확보합니다.

### **[작업 3] 화장실 리뷰 작성 로직 수정 (Reviews API)**
- **대상:** `main.py` 내 리뷰 생성 호출 부분
- **수정 내용:**
    - 호출 경로 변경: `/reviews/toilets/{id}` → `/toilets/{id}/reviews` (계층적 구조로 변경)
    - 데이터 타입 변경: `emojiTags` 필드를 문자열(`"clean,tissue"`)에서 문자열 리스트(`["clean", "tissue"]`)로 변경.
- **목적:** 리소스 경로 불일치 및 데이터 타입 오류를 해결합니다.

## 3. 수정 대상 파일
- `/Users/changjun/Desktop/project/daypoo_fork/terraform/bot_lambda/main.py`

## 4. 검증 계획
1.  **로컬 실행 테스트:** 수정된 `main.py`를 로컬에서 직접 실행하여 운영 API 서버로부터 200 OK 응답을 받는지 확인.
2.  **데이터베이스 확인:** 봇이 생성한 `bot_N@daypoo.com` 유저의 활동 기록이 DB에 정상적으로 인서트 되었는지 확인.
3.  **랭킹 페이지 확인:** 랭킹 점수가 실시간으로 반영되어 순위가 변동되는지 가시적으로 확인.

---
[✅ 규칙을 잘 수행했습니다.]
