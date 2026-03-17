# 💩 DayPoo (대똥여지도) 프로젝트 상세 설계 및 구현 계획서 (v4.2)

> **상태**: 최종 기획 통합 완료 (v4.2 - MVC 전환 적용)
> **핵심 원칙**: Layered MVC Architecture, Privacy-First AI (No-Save & No-Sound), PostgreSQL/PostGIS/Redis, MCP 연동

---

## 1. 아키텍처 및 기술 스택 블루프린트 (Architecture & Tech Stack Blueprint)

본 프로젝트는 대규모 트래픽 처리와 위치 기반 데이터의 실시간 렌더링, 그리고 AI 서비스의 효율적 연동을 위해 **계층형 MVC (Layered MVC) 아키텍처** 및 **MSA(Microservices Architecture) 지향**으로 설계되었습니다.

### 1.1 시스템 전체 아키텍처 다이어그램 (C4 Model - Container Level)

```mermaid
graph TB
    subgraph Client["🖥️ 프론트엔드 (React + Vite)"]
        UI[React SPA]
        KakaoMap[카카오맵 SDK]
    end

    subgraph Backend["⚙️ Spring Boot 핵심 백엔드"]
        API[REST Controller /api/v1]
        Auth[Security/JWT]
        Domain[Service / Repository / Entity]
        Admin[Admin Service]
    end

    subgraph AI["🤖 Python AI 서비스 (Microservice)"]
        FastAPI[FastAPI Server]
        LC[LangChain / LangGraph]
        MCPServer[MCP Server]
    end

    subgraph Data["💾 데이터 레이어"]
        PG[(PostgreSQL 16 \n+ PostGIS)]
        Redis[(Redis \nCache/Rank/Counter)]
    end

    subgraph External["🌐 외부 의존성"]
        OAI[OpenAI API]
        OAuth[Kakao/Google OAuth]
    end

    UI -->|HTTPS/REST| API
    API --> Domain
    Domain -->|JPA/JDBC| PG
    Domain -->|Lettuce| Redis
    API -->|gRPC/REST| FastAPI
    FastAPI --> LC
    LC --> OAI

    %% NotebookLM 및 외부 AI 연동을 위한 MCP 서버
    ExternalAI[Claude/Cursor] -->|MCP Protocol| MCPServer
    MCPServer --> PG
    Auth --> OAuth

    subgraph Security["🛡️ 멀티 레이어 보안 체계"]
        Spoofing[GPS 스푸핑 방지 알고리즘]
        Abuse[어뷰징 탐지 (Rate Limit)]
    end
    API -.-> Security
```

### 1.2 기술 스택 블루프린트 (Technology Stack)

#### 🎨 프론트엔드 (Frontend) - 다이내믹 & 프리미엄 UI/UX

- **Core**: React.js 18+ (함수형 컴포넌트 & Custom Hooks 패턴), Vite (초고속 빌드 툴).
- **Language**: TypeScript (엄격한 타입 시스템을 통한 런타임 에러 방지).
- **State Management**: Zustand (전역 상태 관리 - 유저 세션, 다크모드, 맵 필터 상태 등).
- **Styling**: Vanilla CSS / CSS Modules (외부 디자인 프레임워크에 의존하지 않고 커스텀 유연성 및 프리미엄 글래스모피즘, 마이크로 애니메이션 등 Rich UI 독자 구현).
- **Map Integration**: Kakao Maps API (마커 클러스터링, 다이나믹 커스텀 오버레이 처리).

#### ⚙️ 백엔드 (Backend) - 헥사고날 아키텍처 & 고가용성

- **Core Framework**: Spring Boot 3.x (Java 21).
- **Architecture Pattern**: 계층형 MVC 아키텍처 (Controller - Service - Repository). JPA 엔티티 안에 핵심 비즈니스 로직을 포함하는 풍부한 도메인 모델 중심으로 빠르고 직관적인 생산성 지향. 데이터 전송 객체(DTO)와 Entity 분리 및 `MapStruct`를 통한 자동화된 객체 매핑(Mapper) 구현.
- **Security**: Spring Security + JWT. Access/Refresh Token을 활용한 Stateless 인증.
- **API Design**: RESTful API 구현 및 Swagger/Spring REST Docs를 통한 명세 자동화.
- **Dependency Injection**: Spring IoC Container를 활용한 약결합 구조.

#### 🤖 AI 및 데이터 파이프라인 (AI & Data Pipeline) - 비동기 & 최적화

- **Core Framework**: Python 3.10+, FastAPI (고성능 비동기 API 서버).
- **AI Orchestration**: LangChain / LangGraph (LLM 파이프라인, 프롬프트 체이닝, 페르소나 관리).
- **Model**: OpenAI GPT-4o / Claude 3 (정밀 분석 및 데일리 리포트 자동 파싱 생성).
- **Integration**: Model Context Protocol (MCP) 서버를 구축하여 NotebookLM 및 Claude Code와 데이터를 직접 연동하는 RAG 아키텍처 고도화.

#### 💾 데이터 레이어 (Data Architecture) - 확장성 & 공간 쿼리

- **Primary RDBMS**: PostgreSQL 16. (ACID 트랜잭션 및 안정성 1순위)
- **Spatial Extension**: PostGIS. (반경 50m 거리 검증, 우리 동네 랭킹, 역지오코딩 등 공간 쿼리 최적화)
- **In-Memory DB**: Redis. (실시간 '급똥 지수' 카운터, 전국/동네 랭킹 ZSET, 세션 캐싱, Rate Limiting 적용)
- **Data Access Pattern**: Spring Data JPA (Entity 매핑) + QueryDSL (복잡한 동적 쿼리 및 통계 추출 쿼리).

#### 🚀 인프라 및 데브옵스 (Infrastructure & DevOps)

- **Containerization**: Docker & Docker Compose (개발-런타임-프로덕션 환경 완벽 통일).
  - `dpage/pgadmin4`를 포함하여 데이터베이스 및 PostGIS 공간 데이터 시각화 GUI 관리 환경 동시 구성.
- **CI/CD**: GitHub Actions (자동화된 빌드, 단위/통합 테스트, 무중단 배포 파이프라인).
- **Observability**: Prometheus (시스템 메트릭 수집) + Grafana (실시간 대시보드 직관적 시각화).

### 1.3 시스템 아키텍처 주요 결정 사항 (ADR: Architecture Decision Records)

- **AI 마이크로서비스 영구 분리**: AI 서비스 로직을 Spring Boot 하위 모듈이 아닌 Python(FastAPI) 독립 서버로 완전 분리. LangChain 등 최신 AI 생태계의 풍부한 오픈소스를 직접 활용하고 리소스 스케일아웃을 분리하기 위함.
- **계층형 MVC 아키텍처 및 DTO/MapStruct 적용**: 헥사고날 아키텍처의 보일러플레이트 코드로 인한 복잡성을 제거하고 스타트업의 빠른 프로토타이핑을 위해 스프링 부트의 표준이자 실무형 패턴인 '계층형 MVC + JPA'를 선택. Entity와 DTO 간의 데이터 유출 방지 및 API 스펙 강제화를 위해 `MapStruct` 자동 매핑을 도입.
- **공공데이터 API 연동 및 공간 데이터 GUI**: 약 7만 건 이상의 전국 화장실 공공데이터(`전국공중화장실표준데이터` API 연동)를 PostGIS `Point` 타입으로 인덱싱. 이를 시각적으로 교차 검증하고 데이터베이스를 손쉽게 관리할 수 있도록 `pgAdmin4` GUI 도구를 Docker Compose 구성에 포함.
- **디자인 시스템 독립성 (CSS)**: Tailwind 등에 종속되지 않고 Vanilla CSS 기반으로 구축. 사용자에게 WOU(Wow) 모먼트를 주어야 하는 프리미엄 급의 마이크로 애니메이션과 독자적인 다이내믹 UI(Aesthetics)를 타협 없이 완성.
- **소프트웨어 기반 GPS 검증**: 하드웨어적(NFC/QR) 한계를 인지하고 100% 소프트웨어 검증(가변 반경 체크 + 체류 시간)으로 선회하되, Redis의 Rate Limiter 알고리즘을 추가하여 어뷰징(매크로 및 GPS 스푸핑 기기)을 방어하는 다중 보안 채택.

---

## 2. 도메인별 상세 설계 (Bound Context)

### 2.1 인증 및 회원 (Auth & User)

- **회원가입**: 아이디/닉네임 중복 체크 필수, 비밀번호 2차 확인 필수.
- **계정 관리**: 아이디 찾기 및 비밀번호 찾기(이메일/SMS 본인인증 기반) 로직.
- **소셜 로그인**: 카카오, 구글 (3초 만에 시작하기).
- **게이미피케이션**: 레벨 바, 경험치(EXP), 포인트(Gold) 관리.
- **테이블**: `USERS`, `TITLES`, `USER_TITLES`.

### 2.2 지도 및 급똥 대응 (Map & Emergency)

- **알고리즘 (급똥 버튼)**:
  - `Weight = (Distance * 0.7) + (OpeningHours_Weight * 0.3)`
  - PostGIS의 `ST_DistanceSphere` 및 Redis `GEOSEARCH` 활용.
  - **고도화**: 대규모 트래픽 대응을 위해 화장실 혼잡도 및 실시간 가용성을 Redis에 캐싱하여 조회 성능 극대화.
- **보보안 및 검증**:
  - **GPS 스푸핑 방지**: 모의 위치(Mock Location) 차단 및 이동 속도(Velocity) 검증.
  - **유연한 오차 대응 (Indoor/Shadow)**: 
    - 건물 내부 또는 지하 화장실에서의 GPS 수신 불안정을 고려하여 **Wi-Fi/Network 기반 위치 보정** 및 유동적 반경 로직 적용.
    - GPS 수신 불가 시 '근처 화장실 수동 선택' 기능을 제공하되, 최종 인증 시 해당 위치 체류 여부(Network ID 등) 추가 검증.
  - **오차 반경**: 지역 및 환경에 따라 동적 반경(50m~150m) 및 최소 체류 시간(1분) 조건.
- **마커 시스템**:
  - **Gray 💩**: 방문하지 않은 공용 화장실.
  - **Colored 💩**: 본인의 방문 인증 기록이 있는 화장실.
- **테이블**: `TOILETS`, `VISIT_LOGS`.

### 2.3 방문 인증 4단계 로직 (The Core)

사용자가 화장실 위치에 도달했을 때(GPS 반경 50m 이내 권장) 활성화되는 기록 프로세스입니다. **AI 간편 촬영(추천)** 또는 **직접 입력** 중 선택할 수 있습니다.

#### [NEW] AI 간편 촬영 인증 (추천)

- **개요**: 카메라스킨(WebRTC Canvas)을 통해 촬영된 이미지로 AI가 배변 상태를 즉시 분석하여 아래 4단계를 자동 완성합니다.
- **개인정보 보호 정책 (Strict Privacy)**: 
  - **무음 촬영(Fallback 포함)**: WebRTC 미디어 스트림에서 직접 Canvas 프레임을 추출하는 방식을 기본으로 하여 시스템 셔터음 발생을 원천 차단합니다. 브라우저 정책상 셔터음 강제 시 "무음 비디오 캡처" 방식으로 우회합니다.
  - **In-Memory Pipeline (No-Save)**: 촬영된 데이터는 클라이언트 ➔ 백엔드 ➔ AI 서버 ➔ OpenAI API로 이어지는 전 과정에서 물리 디스크에 저장되지 않고 휘발성 메모리(Byte Array) 상태로만 전송 및 폐기됩니다.
  - **친절한 고지**: 촬영 화면 진입 시 *"사진은 소리 없이 촬영되며, 분석에만 사용된 후 즉시 삭제되니 안심하세요!"* 라는 안내 팝업 및 '보안 전송 중' 인디케이터를 강조 표출합니다.
- **AI 어뷰징 방지**: 배변과 관련 없는 이미지(셀카, 실내 내부 등)가 입력될 경우 AI가 이를 감지하여 반려(`Invalid`) 처리하고 사용자에게 재촬영을 안내합니다.

#### 직접 입력 및 AI 분석 수정 (4단계)

1. **Step 1 (형태)**: 브리스톨 7척도 선택. 의학 용어 대신 "딱딱한 알맹이", "부드러운 바나나" 등 직관적 텍스트와 일러스트 병기.
2. **Step 2 (색상)**: 5~6종 컬러 피커.
3. **Step 3 (컨디션)**: 캡슐형 칩 선택 (#쾌적함, #복통, #가스 등).
4. **Step 4 (식단)**: 최근 입력 음식 태그 + 직접 입력 (#매운음식, #술 등).

- **완료 보상**: 기록 완료 시 경험치(Level Up) 및 마커 색상 변화.

* **검증**: 서버사이드 거리 및 체류 시간 검증.
* **지역 정보**: 역지오코딩을 통한 행정동 정보 실시간 기록.
* **테이블**: `POO_RECORDS`.

### 2.4 상점 및 인벤토리 (Shop & Inventory)

- **기능**: 아바타/마커 스킨 구매, 포인트 결제, 즉시 착용(Preview).
- **테이블**: `ITEMS`, `INVENTORIES`.

### 2.5 AI 건강 리포트 (Health Analysis)

- **비용 모델**:
  - **FREE**: 데일리 한 줄 평.
  - **PREMIUM (Point)**: 7일 정밀 분석 리포트.
  - **VIP (Paid)**: 30일 추세 분석 및 AI 상담.
- **기술**: LangChain/LangGraph, 모델별 비용 최적화(Haiku/Sonnet/GPT4o), 분석 결과 캐싱.

### 2.6 고객센터 및 관리자 (Support & Admin)

- **FAQ**: 카테고리별(전체, 건강, 결제, 이용방법, 계정/보안) 상시 제공.
- **1:1 문의**: 양식 기반 문의 등록.
  - **문의 종류**: 화장실 정보 오류, 결제/아이템 문의, 건강 분석 오류, 기타.
  - **내 문의 내역**: 유저별 문의 상태(대기/완료) 및 답변 조회.
- **관리자 페이지**:
  - **메뉴**: 대시보드, 화장실 관리, 유저 관리, 시스템 설정, 문의&FAQ, 상점 관리.
- **테이블**: `INQUIRIES`, `FAQ`, `SYSTEM_LOGS`.

---

## 3. 데이터베이스 스키마 (ERD 상세)

```mermaid
erDiagram
    USER ||--o{ POO_RECORD : "records"
    USER ||--o{ INVENTORY : "owns"
    USER ||--o{ INQUIRY : "asks"
    TOILET ||--o{ POO_RECORD : "logged_at"
    ITEM ||--o{ INVENTORY : "stored_in"
    TITLE ||--o{ USER : "equipped_by"

    USER {
        bigint id PK
        varchar username
        varchar nickname
        bigint equipped_title_id FK
        int level
        long exp
        long points
    }

    TOILET {
        bigint id PK
        geography location # PostGIS Point
        varchar name
        varchar open_hours
        boolean is_24h
    }

    POO_RECORD {
        bigint id PK
        bigint user_id FK
        bigint toilet_id FK
        int bristol_scale
        varchar color
        text condition_tags
        text diet_tags
        varchar region_code # 행정동 코드/이름
        datetime created_at
    }

    INQUIRY {
        bigint id PK
        bigint user_id FK
        varchar type # 화장실 오류/결제/건강분석/기타
        text content
        text answer
        varchar status # PENDING/COMPLETED
        datetime created_at
    }
```

---

## 4. 페이지별 상세 기능 요구사항 (Feature Specification)

### 4.1 인증 (Auth: Login & Signup)

- **자체 회원가입**:
  - 아이디 중복 체크 & 닉네임 중복 체크.
  - 비밀번호 및 비밀번호 2차 확인 필수 입력.
- **계정 찾기**:
  - 아이디 찾기 (가입 이메일 기반).
  - 비밀번호 재설정 (임시 비밀번호 발급 또는 이메일 링크).
- **소셜 로그인**: 카카오, 구글 OAuth2 연동.
- **보안**: JWT 기반 토큰 인증, Access/Refresh Token 기반 세션 유지.

### 4.2 지도 페이지 (Explore & Action)

- **실감형 지도 서비스**: 카카오맵 API를 활용한 실시간 탐색.
- **마커 시스템**:
  - **미방문**: 회색 똥 마커 (공공데이터 기반).
  - **방문 완료**: 컬러 똥 마커 (내 인증 기록이 있는 곳).
  - **캐릭터**: 내 현재 위치를 나타내는 귀여운 커스텀 아바타 아이콘.
- **검색 및 필터**: 키워드 검색, 즐겨찾기, '내 기록만 보기' 토글 스위치, 24시간/남녀공용/평점 필터.
- **급똥 추천(TOP 3)**: 공간 쿼리 알고리즘에 따른 최적 화장실 강조 표시.
- **정보 팝업 (모달)**:
  - **기본 정보**: 화장실명, 주소, 상세 개방 시간, 남녀공용 여부, 카카오맵/네이버지도 길찾기 바로가기, 신고하기 버튼.
  - **평가 요약**: 이모지 기반 간편 평가(😄🤢🧻), 별점 통계, 최근 후기 리스트(최대 5개).
  - **전체 후기**: 중앙 대형 모달에서 무한 스크롤로 전체 목록 제공 및 상단에 **AI 요약 정보** 노출.
- **인증 UI**: 화장실 반경 진입 시 '기록하기' 버튼 활성화. ('AI 간편 촬영' vs '수동 입력' 옵션 제공 및 사진 미저장/무음 고지 모달 포함)

### 4.3 마이페이지 (My Page: Profile & Activities)

사용자의 성취감을 자극하고 수익을 창출하는 구간입니다.

- **프로필 섹션**: 아바타, 닉네임, 레벨 바, 장착 칭호 표출 및 회원정보 수정 기능.
- **인벤토리/상점**:
  - 보유 아이템 리스트 및 즉시 착용(Preview) 기능.
  - 신규 아이템 구매 및 포인트/유료 결제 연동.
- **내 활동**:
  - 방문 기록 (총 횟수 / 내 영역).
  - 내 문의 내역 (답변 상태 확인 가능).
- **AI 리포트 (이번 주 쾌변 리포트 & 그래프)**:
  - **데일리**: 자동 분석 한 줄 평.
  - **7일 정밀 분석**: 쾌변 점수(원형 차트), 척도 변화 그래프, AI 맞춤 솔루션(음식 매칭 분석).
  - **공유 기능**: 인스타그램 스토리용 이미지 저장 버튼.

### 4.4 랭킹 페이지 (Ranking: Competition)

- **명예의 전당 (TOP 3)**: 상단에 아바타 시상대 연출 (예: 1위 유저에게 황금 오라 특수 효과 부여).
- **랭킹 리스트**: 1~10위 유저의 상세 정보 표출 및 순위 변화(▲/▼/-) 표시.
  - 화면 하단에 **내 순위 고정(Sticky Bar)** UI를 적용하여 본인 순위 상시 확인.
- **카테고리 (멀티 탭)**:
  - **전체**: 포인트/연속 방문 인증 기준 전국 랭킹.
  - **우리 동네 왕**: 역지오코딩 기반 현재 내 위치(행정동) 기준 지역 랭킹.
  - **건강왕**: 쾌변 점수(브리스톨 척도 등)가 가장 높은 유저 랭킹.
- **상호작용 및 수익화**: 타 유저 리스트 클릭 시, 해당 유저가 장착 중인 **[칭호] 및 아바타 아이템 정보 팝업** 표출 ➔ 상점 구매로 즉시 연결(수익화 파이프라인).
- **닉네임 노출 규칙**: 랭킹을 비롯한 모든 유저 노출 화면에서 **[장착 칭호] + 닉네임** 조합으로 표시 필수.

### 4.5 고객센터 & 게시판 (Support)

커뮤니티 기능을 배제하고 정보 전달과 문의에 집중합니다.

- **FAQ**: 카테고리별(건강, 결제, 이용방법, 계정/보안, 전체 등) 아코디언 메뉴 구성.
- **1:1 문의**: 양식 페이지로, 문의 종류(화장실 정보 오류, 결제/아이템 문의, 건강 분석 오류, 기타) 리스트 중 선택하여 등록 ➔ 관리자 답변 시 알림 발송 ➔ [내 문의 내역]에서 확인.
- **내 문의 내역**:
  - 문의 접수 시 상태값이 '답변 대기'로 생성.
  - 리스트 목록에 페이징(Pagination) 처리 적용.
  - 관리자 답변 완료 시 상태값이 '답변 완료'로 변경되며, 문의 내용 바로 아래에 답변 내용이 표출됨.

### 4.6 알림 기능 (Notification)

- **사용자 서비스 알림 (User Side)**: '새로운 정보'와 '보상' 중심.
  - **건강/분석**: "7일간의 쾌변 리포트가 도착했습니다! 분석 결과를 확인해보세요."
  - **소셜**: "'황금바나나'님이 당신의 흔적에 💩 리액션을 남겼습니다."
  - **시스템/보상**: "문의하신 내용에 답변이 등록되었습니다.", "새로운 아바타 아이템이 출시되었습니다!"
- **관리자 페이지 알림 (Admin Side)**: '운영 액션이 필요한 정보' 중심 실시간 알림.
  - **긴급**: "특정 지역(강남역)의 급똥 지수가 급격히 상승 중입니다! (모니터링 권장)"
  - **운영**: "새로운 1:1 문의가 등록되었습니다.", "화장실 정보 수정 신고가 5건 쌓여있습니다."
  - **보안**: "관리자 계정에 새로운 IP로 로그인이 감지되었습니다."

### 4.7 관리자 페이지 (Admin: Operations)

- **대시보드**: 실시간 유저 수, 당일 생성된 인증(똥 마커) 총수, 급똥 지수 모니터링, OpenAI API 비용 통계, 일간/주간/월간 매출 현황 요약.
- **화장실 관리**: 유저 신고 기반 정보 수정(기존 핀 vs 신고 핀 대조 후 원클릭 승인/반려), 전체 화장실 DB 검색 및 주소/개방 시간 직권 수정, 방문 통계(최다 이용, 최저 평점 화장실 리스트업).
- **유저 관리**:
  - 조회 및 검색(닉네임, 이메일, 가입일).
  - 상태 제어: 일시 정지 및 탈퇴 처리 (정지 사유 기록 필수).
  - 슈퍼 어드민 권한: 특정 유저에게 포인트/칭호 강제 부여.
  - 데이터 요약: 해당 유저가 남긴 최근 7일간의 기록 및 건강 데이터 요약 조회.
- **시스템 설정**:
  - AI 프롬프트 템플릿 관리(LLM 페르소나 및 조언 톤 실시간 조정).
  - 관리자 권한 설정: 부관리자 계정 생성, 메뉴별 접근 권한(읽기/쓰기) 개별 부여.
  - 보안: 관리자 작업 로그 시스템.
- **문의 & FAQ**:
  - 1:1 문의 답변 로직: 미답변/답변완료 필터링, 자주 쓰는 답변 템플릿 저장 기능.
  - FAQ 편집기: 카테고리별 자주 묻는 질문 추가/수정/삭제 및 노출 순서 드래그 앤 드롭 변경.
  - 공지사항 등록: 메인 페이지 배너 또는 PUSH 알림용 공지글 작성 및 **예약 게시** 기능.
- **상점 관리**:
  - 아이템 카탈로그: 아바타 의상, 똥 마커 스킨 등의 이미지 파일 업로드 및 가격 책정.
  - 칭호/업적 로직 관리: 칭호 이름 설정, 획득 조건(예: 인증 50회 이상) 자동화 로직 세팅.
  - 재고/판매 컨트롤: 특정 아이템의 한정 판매 스위치 설정 및 판매 중단 기능.

---

| 페이지       | Method | Endpoint                    | 설명                            |
| :----------- | :----- | :-------------------------- | :------------------------------ |
| **메인**     | GET    | `/api/v1/main/stats`        | 실시간 전국 카운터 (Redis)      |
| **인증**     | POST   | `/api/v1/auth/signup`       | 회원가입 (아이디, 닉네임, 비번) |
| **인증**     | POST   | `/api/v1/auth/login`        | 로그인 및 유지 설정             |
| **지도**     | GET    | `/api/v1/toilets/emergency` | 급똥 버튼 전용 알고리즘 TOP 3   |
| **인증로직** | POST   | `/api/v1/records`           | 4단계 배변 기록 저장 및 보상    |
| **상점**     | GET    | `/api/v1/shop/items`        | 아이템 리스트 및 미리보기       |
| **랭킹**     | GET    | `/api/v1/rankings`          | 전체/동네/건강왕 리스트 (Redis) |
| **고객센터** | POST   | `/api/v1/inquiries`         | 1:1 문의 등록                   |
| **관리자**   | GET    | `/api/v2/admin/dashboard`   | 운영 핵심 통계 데이터           |

---

## 5. 사용자 스토리 및 백로그 상세 (Agile Planning)

### 5.1 [Epic] 지도 및 급똥 대응 (Emergency Map)

#### User Story 1: 초고속 인근 화장실 조회

**As a** 급똥이 마려운 유저
**I want** 현재 위치에서 가장 가깝고 바로 사용 가능한 화장실 TOP 3를 즉시 확인하고 싶다
**So that** 당황하지 않고 가장 빠르게 문제를 해결할 수 있다

- **Acceptance Criteria**
  - [ ] `GET /api/v1/toilets/emergency` 호출 시 1초 이내에 TOP 3 결과 반환.
  - [ ] 결과는 거리(70%) + 운영시간 가중치(30%) 알고리즘으로 정렬됨.
  - [ ] 24시간 운영 화장실에 가중치 부여 확인.
  - [ ] Redis `GEOSEARCH`를 통해 DB 부하 없이 조회됨을 확인.
- **Tasks** (5h)
  - [ ] Redis Geospatial Index 구성 및 공공데이터 연동.
  - [ ] 가중치 기반 정렬 알고리즘 서버 구현.
  - [ ] 프론트엔드 '급똥 버튼' UI 및 결과 마커 표시 구현.

---

### 5.2 [Epic] 방문 인증 및 건강 기록 (Verification & Report)

#### User Story 2: 무음/미저장 AI 스마트 인증

**As a** 건강 기록을 편하게 남기고 싶은 유저
**I want** 화장실에서 소리 없이 사진을 찍어 AI가 자동으로 내 상태를 분석해 주길 바란다
**So that** 일일이 입력할 필요 없이 빠르게 기록을 마칠 수 있고, 내 사진이 어디에도 저장되지 않아 안심할 수 있다

- **Acceptance Criteria**
  - [ ] 유저 위치가 화장실 반경 50m~100m 이내일 때 활성화.
  - [ ] 촬영 화면 진입 시 "무음 촬영 & 사진 미저장" 안내 UI의 명확한 노출 및 동의 확인.
  - [ ] 촬영 시 무음 처리 지원 (기기별 Camera API 셔터음 제어).
  - [ ] 촬영된 이미지는 서버 스토리지에 저장 없이, in-memory로 AI 모델(GPT-4o Vision 등) API 전송 후 즉시 객체 소멸 확인.
  - [ ] AI 분석 결과가 4단계(형태, 색상 등) 폼에 자동 매핑되고, 수동 수정이 가능함.
  - [ ] 직접 입력(수동) 옵션도 상시 제공.
  - [ ] 저장 성공 시 실시간 포인트(Gold) 및 경험치 지급 확인.
- **Tasks** (12h)
  - [ ] Client-side WebRTC/Camera API 기반 커스텀 무음 촬영 모듈 구현.
  - [ ] 사진 미저장 등 프라이버시 보호를 위한 안내 팝업 및 UI 컴포넌트 개발.
  - [ ] Vision AI API 연동 및 결과 파싱(JSON 매핑) 파이프라인 개발.
  - [ ] Server-side 체류 시간 및 이동 경로 타당성 API 검증.

#### User Story 3: AI 건강 리포트 수익화

**As a** 건강 관리에 관심이 있는 유저
**I want** 내 배변 데이터를 분석하여 개인화된 정밀 리포트를 받고 싶다
**So that** 내 장 건강 상태를 개선할 실질적인 조언을 얻을 수 있다

- **Acceptance Criteria**
  - [ ] 무료 유저는 데일리 한 줄 평만 확인 가능.
  - [ ] 프리미엄 리포트(7일) 요청 시 보유 포인트(Gold) 차감 유효성 검사.
  - [ ] AI 분석 결과가 Redis에 캐싱되어 동일 데이터에 대한 중복 과금 방지.
- **Tasks** (12h)
  - [ ] FastAPI-LangChain 연동 및 리포트 생성 프롬프트 엔지니어링.
  - [ ] 리포트 등급별(Standard/Premium/VIP) 권한 체크 및 결제 로직.
  - [ ] 분석 결과 저장용 Redis Cache 레이어 구축.

---

### 5.3 [Epic] 동네 랭킹 및 커뮤니티 (Ranking)

#### User Story 4: 우리 동네 건강왕 랭킹

**As a** 경쟁심과 소속감이 있는 유저
**I want** 내가 사는 동네(행정동) 안에서 나의 건강 순위를 확인하고 싶다
**So that** 서비스 이용 동기부여를 얻고 지역 사회와의 연결을 느낀다

- **Acceptance Criteria**
  - [ ] 인증 시 역지오코딩을 통해 행정동 정보가 자동 저장됨.
  - [ ] `GET /api/v1/rankings` 호출 시 전체/지역별 랭킹 분리 확인.
  - [ ] 상위 랭커에게 전용 '칭호'가 실시간으로 장착 가능하게 업데이트됨.
- **Tasks** (6h)
  - [ ] 카카오맵 API 기반 Reverse Geocoding 유틸리티 개발.
  - [ ] Redis Sorted Set 기반 지역별 랭킹 인덱스 관리.

---

## 6. 구현 로드맵 (Detailed Roadmap)

### Phase 1: 기반 구축 (Must Have)

1. **DB/Infra**: PostgreSQL PostGIS 및 `pgAdmin4` GUI 연동 설정, Redis Cluster Docker 구축.
2. **Architecture**: 계층형 MVC 구조 디렉터리 세팅 및 `MapStruct`, `QueryDSL` 등 핵심 라이브러리 초기화.
3. **Auth**: Spring Security + OAuth2 + JWT (3초 가입) 초기 프레임워크 구현.
4. **Common**: 외부 API(`전국공중화장실표준데이터`) 연동을 통한 공공데이터(화장실 7만건) 벌크 인서트 모듈 및 PostGIS 공간 인덱싱 적용.

### Phase 2: 핵심 비즈니스 로직 (Must Have)

1. **Emergency**: 고성능 공간 쿼리 API 설계.
2. **Verification**: 보안 3종 세트(GPS 스푸핑 차단, 체류시간, 이동속도) 구현.
3. **Reward**: 포인트/경험치 지급 및 Redis 실시간 카운터 연동.

### Phase 3: AI 분석 & 고도화 (Should Have)

1. **AI Service**: FastAPI + LangGraph 비동기 분석 파이프라인.
2. **Monetization**: 등급별 리포트 및 상점/인벤토리 연동.
3. **Deep Ranking**: 역지오코딩 기반 행정동 랭킹 시스템.

### Phase 4: 관리 및 관측 (Should Have)

1. **Observability**: Prometheus/Grafana 지표 수집 및 AI Feedback 큐 구축.
2. **Admin**: 실시간 이상 징후 감지 대시보드 및 시스템 설정 실시간 반영.

---

## 7. Definition of Done (DoD)

- [ ] 모든 API는 유닛 테스트 및 통합 테스트 통과 (H2/PostGIS 활용).
- [ ] 프론트엔드-백엔드 간 타입 정의(Typescript) 공유 및 API 문서화 완료.
- [ ] 대규모 트래픽 시나리오(부하 테스트) 하에 응답 시간 1.5s 이내 유지.
- [ ] AI 비용 모니터링 및 어뷰징 감지 알림 정상 작동.
