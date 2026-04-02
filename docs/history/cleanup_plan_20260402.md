# 🧹 docs 폴더 정리 계획 (Cleanup Plan)

## 1. 중복 파일 제거 (Deduplication)

동일하거나 내용이 겹치는 파일들을 정리합니다.

- [ ] **`docs/reports/DayPoo 프로젝트 QA 리포트 (2026-03-31)(2).md`**
  - **판단**: `(2)`가 붙은 사본입니다. 원본(`DayPoo 프로젝트 QA 리포트 (2026-03-31).md`)만 남기고 삭제
- [ ] **`docs/history/frontend-modification-history-old.md`** (이미 archive에 있음)
  - **판단**: 백업용으로 옮겨둔 구버전입니다. 이미 최신본이 통합되었으므로 영구 삭제

## 2. 아카이브 이동 (Archive)

현재 프로젝트의 메인 로직과는 직접적 연관이 적은 리서치/실험 데이터입니다. `docs/archive/` 폴더를 새로 만들어 이동을 제안합니다.

- [ ] **`docs/reports/stateless-tinkering-naur.md`**
  - **판단**: 트러블슈팅 관련 폴더 만들어서 이동(트러블슈팅에 해당하는 내용인지 검증 필요)
- [ ] **`docs/reports/sync_performance_analysis.md`**
  - **판단**: 트러블슈팅 관련 폴더 만들어서 이동(트러블슈팅에 해당하는 내용인지 검증 필요)
- [ ] **`docs/infrastructure/terraform_example.md`**
  - **판단**: 아카이브 이동(가이드에 해당하면 가이드 관련 폴더에)

## 3. 파일명 및 구조 개선 (Refactoring)

가독성을 높이기 위해 파일명을 변경하거나 위치를 조정합니다.

- [ ] **파일명 변경**: `docs/reference/[API Reference] 행정안전부 공중화장실정보 조회서비스 326c614d78388042b064d5d7eb8405bd.md`
  - **제안**: `docs/reference/public_restroom_api_reference.md`로 간결하게 변경.
- [ ] **파일명 변경**: `docs/reference/🚨 [논의 안건] DayPoo 백엔드 스펙 동기화 및 의사기결정 요청.md`
  - **제안**: `docs/reference/backend_sync_discussion.md`로 변경.
- [ ] **파일 삭제**: `docs/logs/gh_error.txt`
  - **판단**: 삭제

---

**작성일**: 2026-04-02
**상태**: 검토 중 (In-review)
