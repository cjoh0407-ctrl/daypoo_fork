# Swagger API 문서 구축 리서치

> **작성일**: 2026-03-04
> **목적**: `plan.md`에 정의된 REST API 엔드포인트를 Swagger(OpenAPI 3.0) 문서로 구축하여 팀원과 공유하기 위한 사전 조사

---

## 1. 현재 프로젝트 상태 분석

### 백엔드 기술 스택

| 항목        | 버전/값                                 |
| ----------- | --------------------------------------- |
| Spring Boot | 3.2.3                                   |
| Java        | 21                                      |
| 빌드 도구   | Gradle                                  |
| 패키지 구조 | `com.ddmap.backend`                     |
| 의존성 관리 | `io.spring.dependency-management:1.1.4` |

### 현재 구현 현황

- `BackendApplication.java` (메인 클래스)만 존재
- **컨트롤러, 서비스, 엔티티 등 아직 미구현 상태**
- Swagger/OpenAPI 관련 의존성 **미추가**
- `application.properties`에는 `spring.application.name=backend`만 설정됨

### `plan.md` API 엔드포인트 요약 (총 30개)

| 도메인               | 엔드포인트 수 | 주요 기능                                |
| -------------------- | ------------- | ---------------------------------------- |
| 인증 (Auth)          | 5개           | 회원가입, 로그인, 소셜 로그인, 토큰 갱신 |
| 사용자 (User)        | 5개           | 프로필 조회/수정, 뱃지, 영역, 즐겨찾기   |
| 화장실/지도 (Toilet) | 6개           | 목록, 상세, 검색, 마커, 리뷰, 근처       |
| 방문/인증 (Visit)    | 3개           | 방문 인증, 리뷰 작성, 방문 기록          |
| 건강분석 (Health)    | 4개           | 배변 기록, 분석, 똥체리듬                |
| 커뮤니티 (Community) | 5개           | 게시글 CRUD, 댓글, 랭킹                  |
| AI                   | 3개           | 건강 분석, 추천, 급똥모드                |

---

## 2. Swagger 라이브러리 선택

### springdoc-openapi (선택 ✅)

- **Spring Boot 3.x 공식 지원** (springfox는 Spring Boot 3.x 미지원)
- OpenAPI 3.0 스펙 기반
- 자동으로 컨트롤러와 DTO를 스캔하여 문서 생성
- Swagger UI + ReDoc 모두 지원
- Gradle 의존성: `org.springdoc:springdoc-openapi-starter-webmvc-ui:2.3.0`

### springfox (미선택 ❌)

- Spring Boot 3.x 미지원 (2021년부터 업데이트 중단)
- 레거시 프로젝트에만 해당

---

## 3. 구현 접근 방식 비교

### 방식 A: 컨트롤러 코드 기반 자동 생성 (Code-First)

- 컨트롤러 → DTO → 애노테이션 → Swagger가 자동 스캔
- **장점**: 코드와 문서가 항상 동기화됨
- **단점**: 컨트롤러와 DTO가 먼저 존재해야 함

### 방식 B: OpenAPI YAML/JSON 직접 작성 (Design-First) ⭐ 추천

- `openapi.yaml` 파일을 직접 작성하여 Swagger UI에서 표시
- **장점**: 컨트롤러 구현 전에도 문서 공유 가능, 팀원과 API 계약 선확정
- **단점**: 코드와 수동 동기화 필요

### 방식 C: 하이브리드 (Design-First → Code-First 전환)

- 초기에는 `openapi.yaml`로 팀원과 API 스펙 공유
- 컨트롤러 구현 후에는 Code-First로 전환
- **장점**: 현재 상황(미구현)에 가장 적합하면서도 나중에 자연스럽게 전환 가능

---

## 4. 핵심 결론

- 현재 백엔드에 컨트롤러가 하나도 없으므로 **Design-First 방식**으로 `openapi.yaml`을 먼저 작성하여 팀원과 API 스펙을 공유하는 것이 가장 실용적
- springdoc-openapi 의존성을 추가하고, 커스텀 `openapi.yaml`을 Swagger UI에서 볼 수 있도록 설정
- 나중에 컨트롤러가 구현되면 Code-First 방식으로 전환 가능
