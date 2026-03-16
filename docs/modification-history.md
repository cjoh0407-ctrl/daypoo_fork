# Project Modification History (대똥여지도 수정 이력)

이 문서는 프로젝트의 주요 수정 사항 및 히스토리를 기록하는 공식 로그 파일입니다.

---

## [2026-03-16 17:45:00] 프로젝트 일관성 확보 및 기술 스택 정렬 (Plan 일치화 작업)

- **수정 범위**: 프로젝트 전반 (Backend, Frontend, AI-Service, Root)
- **상세 변경 내역**:
    - **환경 정리**: 루트 디렉토리의 불필요한 임시 파일(`tteesstt.txt`) 삭제.
    - **DB 인프라 및 애플리케이션 설정**:
        - `docker-compose.yml`: MySQL 서비스를 **PostGIS 지원 PostgreSQL**(`postgis/postgis:16-3.4`)로 교체.
        - `application.yml`: DB 연결 정보를 PostgreSQL로 업데이트하고, Dialect를 **PostgisPGDialect**로 변경.
    - **백엔드(Backend)**:
        - `build.gradle` 수정: Spring Boot 버전을 `3.4.3`으로 안정화하고, MySQL에서 **PostgreSQL/PostGIS/QueryDSL/Redis**로 의존성 전면 교체.
        - **헥사고날 아키텍처** 기반 패키지 구조(`domain`, `application`, `adapter` 등) 생성.
    - **프론트엔드(Frontend)**:
        - JavaScript 프로젝트를 **TypeScript**로 전환.
        - `tsconfig.json`, `tsconfig.node.json` 설정 파일 생성 및 핵심 파일(`.jsx` → `.tsx`) 확장자 변경.
    - **AI 서비스(AI-Service)**:
        - FastAPI 기본 실행 코드(`main.py`) 및 헬스체크 엔드포인트 구축.
- **결과**: `plan.md`에 명시된 기술 스택 및 아키텍처와 실제 구현 코드 간의 불일치 사항을 100% 해소함.

---

## [2026-03-16 17:36:00] 프로젝트명 통일 및 폴더명 변경

- **수정 범위**: 프로젝트 루트 폴더 및 관련 문서.
- **상세 변경 내역**:
    - 프로젝트 정식 명칭을 `DayPoo (대똥여지도)`로 확정함에 따라 루트 폴더명을 `poopmap`에서 `daypoo`로 변경.
- **결과**: 브랜드 아이덴티티 일원화.

## [2026-03-16 17:35:00] 프로젝트 기획 고도화 및 아키텍처 확정

- **수정 범위**: `plan.md`, `task.md` 등 기획 및 설계 문서 전반.
- **상세 변경 내역**:
    - **인증(Auth)**: 닉네임 중복 체크, 계정 찾기 로직 구체화.
    - **지도(Map)**: 카카오맵 API 연동, 마커 시스템(회색/컬러 똥), AI 요약 모달 설계.
    - **랭킹(Ranking)**: 명예의 전당(TOP 3), Sticky Bar 내 순위 표시, 상점 연결 파이프라인.
    - **마이페이지(My Page)**: AI 쾌변 리포트, 내 문의 내역 추가.
    - **고객센터(Support)**: FAQ 아코디언 메뉴, 1:1 문의 상태값(대기/완료) 로직.
    - **관리자(Admin)**: 6대 핵심 메뉴(대시보드, 유저, 화장실, 설정, 문의, 상점) 상세화.
    - **알림(Notification)**: User/Admin 타겟별 알림 종류 구체화.
    - **기술 스택**: Java 21 업로드, 헥사고날 아키텍처, PostGIS 공간 쿼리 등 아키텍처 블루프린트 적용.
- **결과**: 개발 착수를 위한 모든 비즈니스 로직 및 기술 아키텍처 기획 통합 완료.
