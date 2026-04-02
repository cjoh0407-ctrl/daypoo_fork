# 관리자 페이지 유저 관리 기능 프론트엔드 연동 가이드

## 1. API 개요
유저 목록 조회 API가 검색 필드 한정 및 구독 상태 필터링 기능이 포함된 최신 버전으로 업데이트되었습니다.

- **Endpoint**: `GET /api/v1/admin/users`
- **Method**: `GET`
- **Auth**: Admin 권한 토큰 필요

## 2. 쿼리 파라미터 (Query Parameters)

| 파라미터 | 타입 | 필수 여부 | 설명 |
| :--- | :--- | :--- | :--- |
| `search` | String | optional | **이메일** 또는 **닉네임** 검색어 (ID 검색은 제외됨) |
| `role` | String | optional | 역할 필터 (`ROLE_USER`, `ROLE_ADMIN`) |
| `plan` | String | optional | 구독 플랜 필터 (`BASIC`, `PRO`, `PREMIUM`) |
| `page` | Integer | optional | 페이지 번호 (0부터 시작, 기본값 0) |
| `size` | Integer | optional | 페이지당 항목 수 (기본값 20) |

### 💡 구독 플랜(`plan`) 파마리터 값 안내
- `BASIC`: 유료 구독이 없거나 만료된 일반(Free) 유저
- `PRO`: 현재 PRO 플랜을 구독 중인 활성 유저
- `PREMIUM`: 현재 PREMIUM 플랜을 구독 중인 활성 유저
- **전체 조회 시**: 해당 파라미터를 비우거나 전달하지 않습니다.

## 3. UI 구현 권장 사항

### A. 검색창 (Search Input)
- **대상**: 이메일/닉네임 통합 검색 (Placeholder: "이메일 또는 닉네임으로 검색")
- **최적화**: 타이핑 시마다 API를 호출하지 않도록 **500ms Debounce** 처리를 권장합니다.
- **예외**: 유저 ID(PK)는 검색 대상에서 제외되었으므로 별도의 입력 필드나 안내는 불필요합니다.

### B. 필터 셀렉트박스 (Filter Selects)
- **역할 필터**: 전체 / 일반 유저 / 관리자
- **구독 필터**: 전체 / 미구독(BASIC) / 프로 / 프리미엄
- **동작**: 필터 선택값이 변경될 때마다 즉시 `fetchUsers`를 호출하여 리스트를 갱신합니다.

## 4. API 호출 예시 (Axios/Fetch)

```javascript
// 예: "길동"이라는 닉네임/이메일을 가진 'PRO' 유저 검색
const response = await api.get('/admin/users', {
  params: {
    search: '길동',
    plan: 'PRO',
    role: 'ROLE_USER',
    page: 0,
    size: 20
  }
});
```

---
[✅ 규칙을 잘 수행했습니다.]
