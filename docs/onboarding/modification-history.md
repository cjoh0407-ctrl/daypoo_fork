# 프로젝트 수정 이력 (Modification History)

이 문서는 프로젝트의 주요 설정, 기획 사양, 아키텍처 변경 사항을 기록하는 공식 로그입니다.

---

## [2026-03-16 18:35] README.md 및 문서 구조 최종 정제
- **README.md 정합성 확보**:
    - 백엔드 패키지 경로를 실제 경로인 `com.ddmap.backend`에 맞춰 수정.
    - 현재 존재하지 않는 `ai-service`와 `LICENSE` 파일에 대해 "구현 예정" 또는 "준비 중" 상태를 명시하여 혼선 방지.
    - 디렉토리 구조를 최신 **헥사고날 아키텍처** 패키지 구조(`adapter`, `application`, `domain`)에 맞게 업데이트.
- **문서 구조 개선**:
    - 루트 `docs/`와 `docs/onboarding/`에 분산되어 있던 `modification-history.md`를 하나로 통합(`docs/onboarding/` 위치).
    - 초기 세팅부터 현재까지의 모든 주요 변경 이력을 단일 타임라인으로 정리.

## [2026-03-16 18:25] 프로젝트 명칭 및 기술 스택 일괄 전환
- **이름 변경**: `PoopMap` -> `DayPoo (대똥여지도)`로 모든 문서 및 설정 파일(`package.json`, `build.gradle` 등) 일괄 수정.
- **DB 전환 반영**: `initial_setup_plan.md` 등 가이드 문서 내의 DB 명세를 PostgreSQL 16 + PostGIS로 업데이트.

## [2026-03-16 17:45] 프로젝트 일관성 확보 및 기술 스택 실현 (Plan 일치화)
- **인프라 교체**: MySQL을 **PostgreSQL/PostGIS** 및 **Redis**로 전면 전환 (`docker-compose.yml`, `application.yml`).
- **아키텍처 구현**: 백엔드에 **헥사고날 아키텍처** 기본 구조 도입 및 프론트엔드 **TypeScript** 전환 완료.

## [2026-03-16 17:36] 프로젝트 브랜드 아이덴티티 확정
- 루트 폴더명 및 저장소 관련 명칭을 `daypoo`로 통일.

## [2026-03-16 17:30] 프로젝트 기획 고도화 및 설계 확정 (v4.0)
- 4단계 방문 인증, AI 건강 리포트, 랭킹 시스템 등 핵심 비즈니스 로직 및 전체 아키텍처 설계 통합.

---
작성자: Antigravity (AI Assistant)
