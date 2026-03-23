# [CRITICAL] 관리자 계정 추가 계획

## 1. 개요
사용자님의 요청에 따라 새로운 관리자용 계정을 초기 데이터에 주입하여 서버 기동 시 자동으로 생성되도록 설정합니다.

## 2. 계정 정보안
- **아이디(Username)**: `admin@admin.com` (또는 지정하신 이메일을 로직상 username, email 모두에 동일 적용)
- **비밀번호(Password)**: `admin1234`
- **이메일(Email)**: `admin@admin.com`
- **닉네임(Nickname)**: `관리자`
- **권한(Role)**: `ROLE_ADMIN`

## 3. 작업 영역 및 방법
* `backend/src/main/java/com/daypoo/api/global/config/DataInitializer.java` 파일의 `run()` 메서드 내부(1. Admin & Users 영역)에 위 정보에 맞춘 `userRepository.save()` 구문을 추가합니다.
* 추가 작업 완료 후 `docs/modification-history.md`에 수정 내역을 로깅하고 서버를 재시작하여 DB에 반영시킵니다.

위 계획서 내용대로 `DataInitializer`에 새 관리자 계정을 추가하는 코드를 바로 작성해도 될까요? 승인해주시면 즉시 반영하겠습니다.
