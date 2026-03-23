# 프론트엔드 변경 가이드: 인증 시스템 개편 (Email 기반 식별)

인증 시스템이 기존 '아이디(username)' 기반에서 '이메일(email)' 기반으로 완전히 전환되었습니다. 백엔드 DB에서 `username` 컬럼이 삭제되었으며, 모든 인증 및 유저 식별 로직이 `email`을 사용하도록 변경되었습니다.

## 1. 주요 변경 사항

- **아이디(username) 필드 제거**: 모든 DTO 및 API 응답에서 `username` 필드가 사라졌습니다.
- **로그인/회원가입**: 기존에 `username`을 보내던 곳에 `email`을 보내야 합니다.
- **API 인증**: JWT 토큰의 Subject가 `username`에서 `email`로 변경되었습니다. (프론트엔드 로직상 토큰을 단순히 저장/전달만 한다면 큰 문제는 없습니다.)

## 2. API 스펙 변경 내역

### [POST] /api/v1/auth/signup (회원가입)
- **변경**: `username` 필드 삭제
- **수정 전**:
  ```json
  {
    "username": "user123",
    "password": "password123",
    "email": "user@example.com",
    "nickname": "쾌변킹"
  }
  ```
- **수정 후**:
  ```json
  {
    "password": "password123",
    "email": "user@example.com",
    "nickname": "쾌변킹"
  }
  ```

### [POST] /api/v1/auth/login (로그인)
- **변경**: `username` 필드를 `email`로 변경
- **수정 전**:
  ```json
  {
    "username": "user123",
    "password": "password123"
  }
  ```
- **수정 후**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

### [GET] /api/v1/auth/find-id (아이디 찾기)
- **변경**: 기존에 가공된 `username`을 반환하던 로직이 가공된(마스킹된) `email`을 반환하도록 변경되었습니다.
- **응답 예시**: `he***@example.com`

## 3. 주의 사항

- 프론트엔드 코드 내에서 `username`이라는 변수명을 사용하여 상태 관리를 하고 있다면, 혼선을 방지하기 위해 `email`로 리팩토링하는 것을 권장합니다.
- 백엔드에서는 더 이상 `username` 필드를 받지 않으므로, 요청 시 해당 필드가 포함되면 `400 Bad Request` 또는 유효성 검사 에러가 발생할 수 있습니다. (현재 스펙상으로는 에러가 발생합니다.)

---
**백엔드 작업 완료일**: 2026-03-23
