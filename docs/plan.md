# 백엔드 구독 관리 리팩토링 계획

## 1. 개요
사용자가 PRO/PREMIUM 멤버십을 직접 관리(취소, 자동 갱신 설정)할 수 있도록 백엔드 API를 확장하고 관련 코드를 리팩토링합니다. `docs/Reference/구독해지플랜.md`를 바탕으로 진행합니다.

## 2. 주요 변경 사항

### 2.1 백엔드 (API 확장 및 리팩토링)
- **Controller 수정**: `SubscriptionController.java`
    - `POST /api/v1/subscriptions/cancel`: 구독 취소 엔드포인트 추가
    - `PATCH /api/v1/subscriptions/auto-renewal`: 자동 갱신 토글 엔드포인트 추가
    - 기존 `getMySubscription` 메서드에서 `IllegalArgumentException` 대신 `BusinessException(ErrorCode.SUBSCRIPTION_NOT_FOUND)`를 사용하도록 리팩토링 (일관성 유지)

### 2.2 프론트엔드
- **주의**: 전역 규칙(`FRONTEND DIRECTORY RESTRICTION`)에 따라 `frontend/` 폴더 내의 파일은 직접 수정하지 않습니다.
- 프론트엔드 작업은 백엔드 API 배포 후 별도로 진행되거나 사용자가 직접 수행해야 합니다.

## 3. 작업 단계
1. **브랜치 생성**: `feature/subscription-cancellation` (✅ 완료)
2. **코드 수정**: `SubscriptionController.java`에 신규 엔드포인트 추가 및 기존 로직 개선 (✅ 완료)
3. **로깅**: `docs/backend-modification-history.md`에 변경 사항 기록 (✅ 완료)
4. **검증**: 컴파일 성공 확인 (✅ 완료)

## 4. 기대 결과
- 사용자가 고객센터 문의 없이 대시보드/설정 페이지에서 직접 구독을 취소하거나 자동 갱신을 끌 수 있는 인터페이스 제공 가능
- 백엔드 예외 처리의 일관성 확보

이 계획에 대해 승인해 주시면 작업을 시작하겠습니다.
