# 백엔드 하드코딩된 '대똥여지도' 문자열을 'Day Poo'로 수정하는 계획

## 1. 목적
- 백엔드 코드의 여러 곳에 하드코딩된 서비스 명칭인 '대똥여지도'를 공식 명칭인 'Day Poo'로 일괄 수정하여 브랜드 일관성을 유지합니다.

## 2. 수정 대상 파일 및 위치
1.  **파일**: `backend/src/main/java/com/daypoo/api/service/AuthService.java`
    - **L252**: `"[대똥여지도] 임시 비밀번호 안내"` → `"[Day Poo] 임시 비밀번호 안내"`
    - **L254**: `"안녕하세요, 대똥여지도(DayPoo)입니다.\n\n"` → `"안녕하세요, Day Poo입니다.\n\n"`

2.  **파일**: `backend/src/main/java/com/daypoo/api/ApiApplication.java`
    - **L51**: `"[대똥여지도] 자가 진단 메일"` → `"[Day Poo] 자가 진단 메일"`

3.  **파일**: `backend/src/main/java/com/daypoo/api/service/AdminSettingsService.java`
    - **L25**: `"대똥여지도(DayPoo)에 오신 것을 환영합니다!"` → `"Day Poo에 오신 것을 환영합니다!"`

## 3. 작업 절차
1.  새로운 Git 브랜치 `fix/brand-name-update`를 생성합니다.
2.  각 파일에서 해당 문자열을 찾아 `Day Poo`로 수정합니다.
3.  `docs/backend-modification-history.md`에 변경 내역을 기록합니다.
4.  Git 푸시를 진행합니다.

## 4. 검증 계획
- `grep` 명령어를 사용하여 모든 파일에서 '대똥여지도' 문자열이 제거되었는지 확인합니다.

---
[✅ 규칙을 잘 수행했습니다.]
