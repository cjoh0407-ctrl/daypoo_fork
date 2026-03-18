# ⚙️ DayPoo Backend Detailed Architecture Design (v1.2)

이 문서는 DayPoo 프로젝트 백엔드의 기술적 구조, 데이터 흐름, 보안 체계 및 구현 규칙을 상세히 정의합니다.

---

## 1. 프로젝트 구조 (Package Structure)

표준 Spring Boot 계층형 아키텍처를 기반으로 기능별 모듈화가 되어 있습니다.

```text
com.daypoo.api
├── controller           # API 엔드포인트 (REST API)
├── service              # 비즈니스 로직 및 외부 연동 (AI, Public Data)
├── repository           # 데이터 액세스 (JPA, QueryDSL)
├── entity               # JPA 도메인 모델
├── dto                  # 계층 간 데이터 전송 객체 (Request/Response)
├── security             # JWT, OAuth2 (Kakao, Google) 인증 및 인가
├── mapper               # Entity <-> DTO 변환 (MapStruct)
└── global               # 공통 설정, 예외 처리, 유틸리티
    ├── config           # Redis, RestTemplate, App 설정
    ├── exception        # 전역 예외 처리 (GlobalExceptionHandler)
    └── filter           # MDC 로깅 필터 등 공통 필터
```

---

## 2. 핵심 비즈니스 로직 (Core Business Logic)

### 2.1 위치 인증 시스템 (`LocationVerificationService`)
사용자가 화장실 이용 기록을 남길 때, 실제 화장실 근처에 있는지 검증합니다.
- **반경 검증**: PostGIS의 `ST_DistanceSphere`를 활용하여 유저 좌표와 화장실 좌표 간의 거리를 계산 (허용 범위: **50m**).
- **어뷰징 방지**: Redis를 활용하여 동일 사용자가 동일 화장실에 대해 **3시간** 내 중복 인증을 시도하는 것을 차단 (`setIfAbsent` 활용).

### 2.2 AI 서비스 연동 (`AiClient`)
Python FastAPI 기반의 AI 서비스와 긴밀하게 연동됩니다.
- **이미지 분석**: 배변 이미지(Base64)를 전송하여 Bristol Stool Scale 기반 분석 결과를 수신.
- **건강 리포트**: 사용자의 주간/월간 데이터를 분석하여 개인화된 리포트 생성.
- **추적성 (Traceability)**: `MDCFilter`를 통해 생성된 `correlationId`를 HTTP 헤더(`X-Correlation-Id`)에 포함하여 마이크로서비스 간 로그 추적 가능.

### 2.3 게이미피케이션 및 랭킹 (`RankingService`)
사용자 참여를 유도하기 위한 보상 및 경쟁 시스템입니다.
- **글로벌 랭킹**: Redis **Sorted Set (ZSET)**을 사용하여 전체 사용자 포인트를 실시간으로 관리 (`daypoo:rankings:global`).
- **지역 랭킹**: 특정 행정 구역별 랭킹을 별도의 ZSET으로 관리하여 동네 기반 경쟁 유도.
- **업적 시스템**: `AchievementService`를 통해 특정 조건(예: 누적 10회 기록) 달성 시 칭호 및 보상 부여.

---

## 3. 보안 아키텍처 (Security Architecture)

### 3.1 인증 및 인가 흐름
1. **Social Login**: Kakao/Google OAuth2 인증 수행.
2. **JWT Issuance**: 인증 성공 시 `JwtProvider`에서 Access Token(Short-lived) 및 Refresh Token(Long-lived) 발급.
3. **State Management**: Redis에 Refresh Token을 저장하여 보안성 강화 및 로그아웃 처리 지원.
4. **Security Filter**: `JwtAuthenticationFilter`에서 요청마다 토큰 유효성 검사 및 SecurityContext 설정.

### 3.2 관리자 보안
- `/api/v1/toilets/sync` 등 민감한 데이터 관리 API는 `@PreAuthorize("hasRole('ADMIN')")`를 통해 엄격히 보호.

---

## 4. 데이터 전략 (Data Strategy)

### 4.1 PostgreSQL & PostGIS
- **Spatial Index**: `GEOGRAPHY(Point, 4326)` 타입을 사용하여 대규모 화장실 위치 검색 성능 최적화.
- **Deduplication**: 공공데이터 동기화 시 `MNG_NO`(고유 번호)를 기준으로 중복 적재 방지.

### 4.2 Redis 활용
- **Caching**: 화장실 상세 정보 및 평점 등 빈번한 조회의 부하 경감.
- **Locking/Cooldown**: 인증 제한 시간 관리 및 실시간 랭킹 데이터 저장.

---

## 5. 공통 처리 (Global Strategy)

### 5.1 통합 예외 처리
- `BusinessException`을 상속받아 세분화된 에러 처리 수행.
- `ErrorCode` 인터페이스를 통해 일관된 에러 메시지 및 HTTP 상태 코드 반환.

### 5.2 모니터링 및 로깅
- **MDC (Mapped Diagnostic Context)**: 모든 요청에 고유 ID를 부여하여 로그 추적 용이성 확보.
- **BaseTimeEntity**: 생성/수정 시간 자동 관리를 통한 데이터 이력 추적.

---
> **마지막 업데이트**: 2026-03-18
