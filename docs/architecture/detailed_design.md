# 💩 DayPoo (대똥여지도) 상세 설계서 (v3.0 - 최종)

## 1. 프로젝트 개요
*   **서비스명:** DayPoo (당신의 '흔적'이 건강이 됩니다)
*   **핵심 가치:** 화장실 탐색(급똥 대응) + 방문 인증(기록) + AI 건강 분석 + 게이미피케이션(상점/랭킹).
*   **기본 설계 원칙:** 
    *   **사진 제외:** AI 분석 및 인증 시 사진 데이터는 활용하지 않습니다.
    *   **단순 마커:** 미방문(회색) / 방문완료(컬러) 2단계 시스템.
    *   **DB 통합:** 로컬 및 배포 환경 모두 PostgreSQL(PostGIS) + Redis 사용.

---

## 2. 기술 스택 (Updated)
*   **Backend:** Spring Boot 3.2.3 (Java 21) + Spring Data JPA
*   **Database:** 
    *   **PostgreSQL 16 + PostGIS:** GPS 거리 계산 및 위치 기반 로직 (로컬/RDS 공통).
    *   **Redis:** 실시간 전국 카운터, 실시간 랭킹(Sorted Set), 세션 관리.
*   **AI Service:** Python 3.11 + FastAPI + LangChain + LangGraph (텍스트 데이터 분석 전담).
*   **Auth:** Spring Security + JWT + OAuth2 (Kakao, Google).

---

## 3. 데이터 모델링 (Core ERD)

### 3.1 회원 및 게이미피케이션 (User & Shop)
*   **User:** `id`, `email`, `nickname`, `title_id(FK)`, `level`, `exp`, `point`, `avatar_id(FK)`.
*   **Title (칭호):** `id`, `name`, `requirement_type`, `requirement_value`.
*   **Item (상점 아이템):** `id`, `name`, `category` (아바타/마커스킨), `price`, `image_url`.

### 3.2 화장실 및 인증 (Toilet & Record)
*   **Toilet:** `id`, `name`, `address`, `location(Geography)`, `operating_hours`, `is_unisex`.
*   **PooRecord (4단계 인증):**
    1.  `bristol_scale` (1~7): 텍스트 및 일러스트 기반 선택.
    2.  `color` (String): 컬러 피커 선택값.
    3.  `condition_tags` (List): 캡슐형 칩 선택 데이터.
    4.  `diet_tags` (List): 식단 태그 데이터.
    *   `user_id`, `toilet_id`, `created_at`. (사진 필드 없음)

### 3.3 마커 상태 (Marker System)
*   **VisitStatus:** `user_id`, `toilet_id`, `status` (UNVISITED/VISITED).
*   **UX:** 유저 본인의 기록이 있는 곳만 컬러 💩 마커로 표시.

---

## 4. 핵심 기능 로직 설계

### 4.1 급똥 버튼 알고리즘 (Emergency Search)
*   **Logic:** PostGIS `ST_DWithin`과 `ST_DistanceSphere`를 사용하여 현재 위치에서 가장 가까운 화장실 검색. 24시간 여부와 현재 시간 가중치를 적용하여 TOP 3 추천.

### 4.2 방문 인증 및 보상 (Verification & Reward)
*   **GPS 검증:** 50m 반경 체크 (서버 사이드 검증 필수).
*   **Reward:** 경험치 및 포인트 지급 -> Redis '전국 카운터' 즉시 업데이트.

### 4.3 AI 주간 리포트 (Text Analysis Only)
*   **Process:** 사진 없이 7일간의 브리스톨 척도 변화, 빈도, 식단 상관관계를 LLM으로 분석하여 텍스트 및 그래프 데이터 생성.

---

## 5. 관리자 페이지 (Admin Console)
*   **Dashboard:** 실시간 인증 수, 급똥 지수, AI API(OpenAI) 비용 모니터링.
*   **Toilet/User Admin:** 화장실 정보 수정 승인, 유저 상태 제어 및 포인트 지급.
*   **System Config:** AI 프롬프트 템플릿 실시간 조정.

---

## 6. 인프라 구성 (배포 환경)
*   **RDS:** PostgreSQL 16 기반 인스턴스 (PostGIS 확장 기능 활성화).
*   **Cache:** Amazon ElastiCache for Redis.
*   **Application:** AWS EC2 (Spring Boot, FastAPI).
*   **Storage:** S3 (아이템 이미지 저장용).

---

이 최종 설계 문서를 바탕으로 개발 환경 세팅부터 진행하겠습니다.
