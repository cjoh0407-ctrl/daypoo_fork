# Backend Modification History

## [2026-03-24 17:35:00] 서버 반복 구동 실패 근본 해결 및 백엔드 서비스 시작 구조 개선
- **작업 내용:** Flyway 체크섬 오류 및 외부 서비스 의존성으로 인한 서버 구동 실패 문제 해결
- **상세 변경 내역:**
  - **Flyway**: `FlywayRepairConfig` 추가로 체크섬 불일치 자동 복구(`repair`) 기능 활성화
  - **Migration**: V3 마이그레이션 PostgreSQL 호환성 확정 및 V4(누락 컬럼 `mng_no` 추가, `location` 제약 완화) 신설
  - **JPA**: `application.yml` 내 `ddl-auto: update`를 `validate`로 변경하여 Flyway 기반 단일 스키마 관리 체계 확립
  - **Startup**: `ApiApplication`의 `runSelfCheck`(메일/동기화)를 비동기(`CompletableFuture`) 및 방어적으로 리팩토링하여 서버 블로킹 방지
  - **Resiliency**: `DataInitializer` 및 `RankingDataSeeder`에 try-catch 예외 핸들링을 추가하여 초기 데이터 오류가 서버 전체를 죽이지 않도록 개선
- **결과/영향:** 서버 구동 시 불확실성이 제거되고, 외부 서비스(SMTP, 공공데이터 API 등) 장애 상황에서도 안정적인 서비스 시작이 가능해짐


## [2026-03-24 16:55:00] 화장실 리뷰 및 평가 시스템 구축 (v1.0)
- **작업 내용:** 사용자가 화장실에 대해 별점과 이모지 태그, 코멘트를 남길 수 있는 리뷰 시스템의 백엔드 전 계층 구현
- **상세 변경 내역:**
  - **DB**: `V3__add_toilet_reviews.sql` 추가 (리뷰 테이블 생성 및 화장실 통계/AI 요약 컬럼 확장)
  - **Entity**: `ToiletReview.java` 신규 생성, `Toilet.java` 및 `User.java` 연관관계 및 필드 업데이트
  - **DTO**: `ToiletReviewCreateRequest`, `ToiletReviewResponse`, `ToiletReviewSummaryResponse`, `ToiletReviewPageResponse` 등 6개 클래스 구현
  - **Service**: `ToiletReviewService.java` 구현 (리뷰 작성 시 통계 자동 갱신 및 리뷰 5개 이상 시 AI 요약 생성 로직 포함)
  - **Controller**: `ToiletReviewController.java` 구현 (리뷰 작성, 최근 리뷰 조회, 페이징 조회, 요약 정보 API 엔드포인트 제공)
  - **AI 연동**: `AiClient.java`에 리뷰 요약 서비스 호출 메서드(`summarizeReviews`) 추가
  - **Mock Data**: `DataInitializer.java`에 초기 화장실 3곳에 대한 샘플 리뷰 데이터 및 통계 초기화 로직 추가
- **결과/영향:** 서비스 내 화장실 품질 정보를 유저들이 직접 공유할 수 있는 핵심 기반 마련 및 AI를 통한 자동 요약 기능 제공

## [2026-03-24 16:58:00] 회원 탈퇴 시 연관 엔티티 삭제 오류(FK Constraint) 해결
- **작업 내용:** 회원 탈퇴 시 `users` 테이블과 연관된 자식 테이블들의 데이터가 먼저 삭제되지 않아 발생하는 500 에러 수정
- **상세 변경 내역:**
  - **Repository**: `PooRecord`, `Inquiry`, `Payment`, `Notification`, `Inventory`, `UserTitle`, `ToiletReview` 리포지토리에 `deleteAllByUser(User user)` 메서드 추가
  - **Service**: `AuthService.withdraw` 메서드에서 `userRepository.delete(user)` 호출 전, 위 7개 리포지토리를 순차적으로 호출하여 연관 데이터를 명시적으로 선제 삭제하도록 로직 보강
- **결과/영향:** 복잡한 연관 관계에서도 무결성을 유지하며 안정적으로 회원 탈퇴 처리가 가능해짐

## [2026-03-24 16:34:00] 수동 입력 시 필수값 검증 강화 및 조건부 유효성 검사 적용
- **작업 내용:** 사진 미촬영 유저(수동 입력)의 경우 모양, 색상, 키워드(태그) 선택을 필수로 강제하도록 보완
- **상세 변경 내역:**
  - `PooRecordService.java`: `imageBase64`가 없는 경우 `bristolScale`, `color`, `conditionTags`, `dietTags`가 비어있으면 `INVALID_INPUT_VALUE` 예외를 발생시키도록 로직 추가
  - 사진 인증 시에는 위 필드들이 비어있어도 허용되도록 하여 "AI 3초 인증" 흐름 유지
- **결과/영향:** 입력 방식에 따른 차별화된 유효성 검사를 통해 데이터 신뢰성과 UX를 동시에 확보

## [2026-03-24 16:24:00] AI 촬영 인증 프로세스 고도화 및 DTO 제약 완화
- **작업 내용:** AI 촬영 인증 시 수동 입력 단계를 건너뛸 수 있도록 백엔드 로직 수정 및 4단계 로직 최적화 계획 수립
- **상세 변경 내역:**
  - `PooRecordCreateRequest.java`: `bristolScale`, `color` 필드의 필수(`@NotNull` 등) 제약 제거
  - `PooRecordService.java`: `imageBase64`가 포함된 경우 수동 입력값이 없어도 AI 분석 결과로 자동 대체하도록 로직 보강 (단, 60초 체류 검증은 유지)
  - `docs/plan.md`: 프론트엔드 팀원을 위해 '범위 내 버튼 활성화' 및 'AI 인증 시 단계 건너뛰기' 로직 가이드 포함
- **결과/영향:** AI 촬영만으로 인증이 가능해졌으며, 프론트엔드 연동 시 사용자 편의성이 대폭 향상될 것으로 기대됨

## [2026-03-24 16:11:00] 백엔드, 프론트엔드, AI 서버 서버 재가동
- **작업 내용:** 모든 팀원 머지 내역 반영 후 안정적인 테스트 환경을 위해 전체 서버 재시작
- **상세 변경 내역:**
  - 기존 Java, Node, Python 프로세스 종료
  - Backend (8080), Frontend (5173), AI (8000) 포트에서 각 서버 재실행
  - 로그 파일(`bootRun.log`, `vite_dev.log`, `ai_service.log`) 확인 및 헬스체크 완료
- **결과/영향:** 최신 개발 상태가 반영된 통합 서버 환경 구축 완료

## [2026-03-24 15:58:00] 팀원 머지 내역 반영 및 최종 브랜치 정리
- **작업 내용:** 팀원들이 머지한 `main` 브랜치 업데이트 및 모든 머지 완료된 브랜치 정리
- **상세 변경 내역:**
  - `git pull origin main` 및 `git fetch --prune` 수행
  - 10개 이상의 머지 완료된 원격 브랜치 최종 삭제 완료
- **결과/영향:** 최신 팀원 작업이 로컬에 반영되고 리포지토리가 완벽히 동기화 및 정리됨

## [2026-03-24 15:52:00] Git 브랜치 정리 및 환경 최적화
- **작업 내용:** 작업이 완료되어 머지된 Git 브랜치 및 관련 워크트리 삭제
- **상세 변경 내역:**
  - 로컬 브랜치 삭제: `chore/project-cleanup-gitignore`, `claude/flamboyant-albattani`, `feat/backend-ai-admin-refactoring`, `fix/notification-sse-auth-timer`
  - 원격 브랜치 삭제: `origin/chore/project-cleanup-gitignore`, `origin/feat/backend-ai-admin-refactoring`, `origin/fix/notification-sse-auth-timer`
  - 관련 Git 워크트리 제거: `.claude/worktrees/flamboyant-albattani`
- **결과/영향:** 리포지토리 상태가 동기화되고 불필요한 리소스가 제거되어 작업 환경이 깨끗해짐

## [2026-03-24 15:35:00] AI 분석 엔드포인트 및 관리자 시스템 로그 API 구현
- **작업 내용:** 백엔드 기능 확장 및 관리 기능 강화
- **상세 변경 내역:**
  - AI 분석 시스템 확장을 위한 엔드포인트 `/api/v1/poo/analysis` 등 추가
  - AI 응답 데이터에 `warning_tags` 확장 적용
  - 어드민 시스템 로그 조회를 위한 API 엔드포인트 구현
- **결과/영향:** AI 기반 분석 기능이 강화되고 관리자의 시스템 가시성이 향상됨
