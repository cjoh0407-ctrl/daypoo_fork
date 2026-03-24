# 리팩토링 및 백엔드 관련 기능 보완 계획 (floating-orbiting-meerkat.md 참조)

이 문서는 사용자가 제공한 진단 보고서(`floating-orbiting-meerkat.md`)를 바탕으로 백엔드에서 수행할 리팩토링 및 누락된 엔드포인트 구현 계획을 상세히 설명합니다.

> [!IMPORTANT]
> **프론트엔드 제약 사항**: `frontend` 폴더는 어떠한 경우에도 직접 수정하지 않습니다. 모든 변경 사항은 `backend` 및 관련 문서에서만 이루어집니다.

---

## 🏗 구현 목표

보고서에서 식별된 백엔드 누락 항목 및 개선 사항을 순차적으로 구현합니다.

1.  **[CRITICAL] AI 분석 전용 엔드포인트 신설 (`/records/analyze`)**
2.  **[MEDIUM] AI 응답 데이터(`warning_tags`) 전달 시스템 구축**
3.  **[LOW] 관리자 시스템 로그 API 구현 (`GET /admin/logs`)**

---

## 🛠 상세 작업 단계

### Phase 1: AI 분석 엔드포인트 구현 (PooRecordController)

기존에는 기록 저장 시에만 AI 분석이 수행되었으나, 프론트엔드의 "미리보기" UX를 지원하기 위해 분석만 수행하는 엔드포인트를 추가합니다.

- **DTO 추가**:
    - `PooAnalysisRequest.java`: `imageBase64` 필드 포함.
    - `AiAnalysisPreviewResponse.java` (또는 기존 Response 확장): 분석 결과만 포함하는 응답 DTO.
- **Service 수정 (`PooRecordService.java`)**:
    - `analyzeImageOnly()` 메서드 추가: `AiClient`를 통해 분석 결과만 받아 반환.
- **Controller 수정 (`PooRecordController.java`)**:
    - `@PostMapping("/analyze")` 엔드포인트 추가.

### Phase 2: AI 응답 데이터 확장 (`warning_tags`)

AI 서비스에서 반환하는 경고 태그를 프론트엔드까지 온전히 전달하도록 구조를 개선합니다.

- **DTO 수정 (`AiAnalysisResponse.java`)**:
    - `List<String> warningTags` 필드 추가.
- **매핑 로직 보완**:
    - `AiClient` 및 `PooRecordService`에서 AI 서비스의 응답을 DTO로 변환할 때 `warning_tags`를 누락 없이 매핑.

### Phase 3: 관리자 시스템 로그 API 구현

관리자 대시보드에서 시스템 상태를 모니터링할 수 있도록 로그 조회 API를 신설합니다.

- **데이터 모델/DTO 설계**:
    - `SystemLogResponse.java`: 로그 시간, 레벨, 메시지, 출처 등 포함.
- **Controller 확장 (`AdminController.java`)**:
    - `GET /admin/logs` 메서드 추가. (필요 시 페이징 처리)

---

## ✅ 검증 계획

1.  **엔드포인트 동작 확인**: `curl` 또는 로컬 테스트를 통해 `/api/v1/records/analyze` 호출 및 응답 확인.
2.  **데이터 무결성 확인**: 응답 데이터에 `warningTags`가 정상적으로 포함되는지 확인.
3.  **관리자 API 확인**: `/api/v1/admin/logs` 호출 시 시스템 로그 데이터가 반환되는지 확인.

---

## 🪵 변경 이력 기록

모든 작업 완료 후 `docs/modification-history.md`에 기록을 남길 예정입니다.

---

위 계획에 따라 리팩토링을 시작해도 좋을까요?
