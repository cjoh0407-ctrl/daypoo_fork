# Implementation Plan: 백엔드 스펙 동기화 및 논의 안건(A안) 반영

백엔드 상세 설계서(v1.2)와 전체 구현 계획서(v4.3) 간의 스펙 충돌을 해결하기 위해, 논의 안건 중 **권장 사항(A안)**을 프로젝트에 반영하는 계획입니다.

## 🎯 목표
- GPS 음영 지역 대응을 위한 인증 반경 확대 및 체류 시간 검증 도입
- AI 서비스 간 통신 효율화를 위한 데이터 전송 방식 개선 (JSON -> Multipart)
- 복잡한 자체 인증 대신 소셜 로그인(Kakao/Google) 중심으로 인프라 정비
- 테이블 명칭 및 관리 도구 가이드 일원화

## 🛠 작업 단계

### Phase 1: 📍 위치 인증 정책 고도화 (안건 1)
- [x] `LocationVerificationService.java` 수정:
    - `ALLOWED_RADIUS_METERS`를 `50.0`에서 `150.0`으로 상향.
- [x] 체류 시간(1분) 검증 로직 구현:
    - `PooRecordService.createRecord` 시점에 유저의 화장실 도착 시간(`arrival_time`) 기록 (Redis 활용).
    - 도착 시간 기록용 `/api/v1/records/check-in` 호출 후 1분이 지나야 기록이 가능하도록 로직 보완.

### Phase 2: 🤖 AI 이미지 서버 통신 최적화 (안건 3)
- [x] `AiClient.java` 수정:
    - Base64 텍스트 전송 방식을 `byte[]` 기반 `multipart/form-data` 전송 방식으로 변경.
    - `RestTemplate` 설정을 Multipart 전송에 맞게 조정 및 리팩토링.
- [x] `ai-service/app/api/v1/endpoints/analysis.py` 수정:
    - FastAPI `UploadFile`을 사용하여 Multipart 전송 수신 및 처리.

### Phase 3: 🔐 인증 시스템 및 인프라 정비 (안건 2, 4, 5)
- [x] 자체 회원가입/로그인 최소화:
    - 소셜 로그인 위주로 `openapi.yaml` 및 문서 업데이트.
- [x] 관리자 API 경로 최종 확인:
    - 모든 Admin 관련 경로는 `/api/v1/admin/**`으로 통일된 상태인지 재검토.
- [x] 테이블 및 도구 가이드 통일:
    - `docs/onboarding/work_me.md`에서 `pgAdmin4` 관련 가이드를 완전히 제거하고 `DBeaver` 사용 권장 문구로 대체.
    - 프로젝트 전반의 문서에서 테이블 명칭을 `POO_RECORDS`로 통일.

### Phase 4: 📝 문서 업데이트 및 검증
- [x] `openapi.yaml` 업데이트: 변경된 API(check-in 등) 명세 반영.
- [x] `modification-history.md` 기록.
- [ ] 통합 테스트 수행: GPS 반경 및 체류 시간, AI 이미지 분석 호출 정상 여부 확인. (진행 예정)

---
[✅ 규칙을 잘 수행했습니다.]
