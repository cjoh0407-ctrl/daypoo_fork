# Project Overview: DayPoo

> 이 문서는 코드베이스를 직접 읽지 않은 AI가 프로젝트 구조, 목적, 동작 방식, 기술적 결정 사항을
> 완전히 이해하고 기능을 추가할 수 있을 수준으로 작성되었습니다.
>
> 확인된 사실만 기재하며, 추론이 필요한 경우 `[추론]`으로 명시합니다.

---

## 1. 프로젝트 요약 (Executive Summary)

DayPoo는 **대한민국 전국 공중화장실 위치 정보를 지도 위에 시각화**하고, 사용자의 배변 기록을 **OpenAI Vision AI로 분석**하여 건강 솔루션을 제공하는 위치 기반 헬스케어 서비스입니다.

핵심 문제: 한국에는 약 50만 개의 공중화장실 데이터(공공 API)가 있으나 이를 건강 관리와 연결하는 서비스가 없습니다. DayPoo는 화장실 체크인 기반 배변 기록 → AI 분석 → 건강 리포트 → 지역별 랭킹의 gamification 루프를 제공합니다.

주요 사용자: 건강에 관심 있는 한국 일반 사용자, 구독 기반 프리미엄 기능을 사용하는 PRO/PREMIUM 회원.

---

## 2. 기술 스택 (Tech Stack)

### 언어 및 런타임
| 파트 | 기술 | 버전 |
|------|------|------|
| Backend | Java | 21 (Virtual Threads 활용) |
| Backend Framework | Spring Boot | 3.4.3 |
| Frontend | TypeScript | 5.8.2 |
| Frontend Framework | React | 19.2.0 |
| Frontend Build | Vite | 7.3.1 |
| AI Service | Python | 3.12 |
| AI Service Framework | FastAPI | (pyproject.toml 기준) |

### 주요 백엔드 라이브러리
| 라이브러리 | 용도 |
|-----------|------|
| Spring Data JPA + Hibernate Spatial | ORM + PostGIS 공간 데이터 |
| Flyway | DB 마이그레이션 (V1~V26) |
| Spring Security + OAuth2 Client | 인증/인가, Kakao/Google 소셜 로그인 |
| JJWT 0.12.5 | JWT Access/Refresh/SSE/Registration 토큰 |
| Spring Data Redis (Lettuce) | 랭킹, 블랙리스트, Rate Limit, GEO, Pub/Sub |
| Spring WebFlux | 공공데이터 동기화용 WebClient |
| Spring Retry | AI 서비스 호출 재시도 |
| Spring AOP | Rate Limiting, 서비스 로깅 횡단 관심사 |
| MapStruct 1.5.5 | Entity↔DTO 변환 |
| Springdoc OpenAPI 2.8.5 | Swagger UI (`/docs`) |
| Micrometer Prometheus | 메트릭 수집 (`/actuator/metrics,prometheus`) |
| Spring Mail | Gmail SMTP 임시 비밀번호 발송 |
| spring-dotenv 4.0.0 | 루트 `.env` 파일 자동 로딩 |

### 주요 프론트엔드 라이브러리
| 라이브러리 | 용도 |
|-----------|------|
| React Router DOM 7 | SPA 라우팅 |
| Framer Motion 12 | 페이지 전환 및 UI 애니메이션 |
| TailwindCSS 4 | 유틸리티 퍼스트 스타일링 |
| Recharts 3 | 건강 리포트 차트 시각화 |
| Lucide React | 아이콘 |
| @dicebear/core, @dicebear/collection | 아바타 생성 |
| @tosspayments/payment-sdk | 토스페이먼츠 결제 UI |
| react-markdown + remark-gfm | AI 리포트 마크다운 렌더링 |
| Swiper | 모바일 스와이프 UI |

### 데이터 레이어
| 기술 | 버전 | 용도 |
|------|------|------|
| PostgreSQL | 16 | 주 데이터베이스 |
| PostGIS | 3.4 | 공간 쿼리 (화장실 위치 검색, GIST 인덱스) |
| Redis | 7-alpine | 랭킹 ZSET, GEO, Pub/Sub, 캐시, Rate Limit |
| OpenSearch | - | 화장실 이름 초성/텍스트 검색 |

### 인프라/배포
| 기술 | 용도 |
|------|------|
| AWS EC2 (t3.micro) | 애플리케이션 서버 |
| AWS CloudFront | CDN |
| AWS RDS | 운영 PostgreSQL |
| AWS S3 | 정적 파일 |
| AWS Lambda | 봇/자동화 작업 (`terraform/bot_lambda/`) |
| AWS OpenSearch | 텍스트 검색 |
| Terraform | 인프라 IaC |
| Docker / Docker Compose | 컨테이너화 |
| GitHub Actions | CI/CD |
| Husky + commitlint | Git 훅 (커밋 메시지 규칙 강제) |
| Spotless (Google Java Format) | 백엔드 코드 포맷 자동화 |

---

## 3. 프로젝트 구조 (Project Structure)

```
daypoo/
├── backend/                         # Spring Boot 핵심 백엔드
│   ├── build.gradle                 # 의존성 및 빌드 설정
│   ├── Dockerfile                   # 백엔드 컨테이너 이미지
│   └── src/main/java/com/daypoo/api/
│       ├── ApiApplication.java      # 엔트리포인트 (@SpringBootApplication)
│       ├── controller/              # REST 컨트롤러 (HTTP 진입점)
│       ├── service/                 # 비즈니스 로직 계층
│       ├── repository/              # Spring Data JPA 리포지토리
│       ├── entity/                  # JPA 도메인 엔티티
│       │   └── enums/               # Role, ItemType, SubscriptionPlan 등
│       ├── dto/                     # Request/Response DTO
│       ├── mapper/                  # MapStruct 매퍼 (Entity↔DTO)
│       ├── event/                   # 스프링 이벤트 (비동기 후처리)
│       ├── security/                # Spring Security, JWT, OAuth2
│       └── global/
│           ├── aop/                 # RateLimit, ServiceLogging AOP
│           ├── config/              # Redis, Async, DataInitializer 등
│           ├── exception/           # ErrorCode, GlobalExceptionHandler
│           ├── filter/              # MDCFilter, MaintenanceModeFilter
│           └── BaseTimeEntity.java  # createdAt/updatedAt 공통 상속
│   └── src/main/resources/
│       ├── application.yml          # 주 설정
│       ├── application-prod.yml     # 운영 프로파일
│       ├── db/migration/            # Flyway V1~V26 마이그레이션
│       └── static/openapi.yaml      # OpenAPI 스펙
│
├── frontend/                        # React SPA
│   ├── package.json
│   ├── vite.config.js               # 빌드 설정 + 개발 프록시
│   └── src/
│       ├── main.tsx                 # 진입점
│       ├── App.tsx                  # 라우팅 + 전역 프로바이더
│       ├── pages/                   # 페이지 컴포넌트 (lazy-loaded)
│       ├── components/              # 재사용 컴포넌트
│       │   ├── auth/                # 로그인/회원가입 폼
│       │   └── map/                 # 지도 관련 (MapView, ToiletPopup 등)
│       ├── context/                 # React Context (Auth, Notification, Transition)
│       ├── services/                # API 클라이언트 (apiClient.ts)
│       ├── hooks/                   # 커스텀 훅
│       ├── types/                   # TypeScript 타입 정의
│       └── utils/                   # 유틸리티 함수
│
├── ai-service/                      # Python FastAPI AI 마이크로서비스
│   ├── main.py                      # FastAPI 앱 진입점
│   ├── Dockerfile
│   └── app/
│       ├── api/v1/endpoints/        # analysis, report, review 라우터
│       ├── services/                # vision_service, report_service, review_service
│       ├── schemas/                 # Pydantic 스키마
│       └── core/                   # config, redis_client
│
├── terraform/                       # AWS 인프라 IaC
│   ├── main.tf                      # Provider 설정
│   ├── ec2.tf                       # EC2 인스턴스 (t3.micro + Docker)
│   ├── cloudfront.tf                # CDN
│   ├── rds.tf                       # PostgreSQL RDS
│   ├── s3.tf                        # 정적 파일 버킷
│   ├── opensearch.tf                # 텍스트 검색
│   ├── lambda.tf                    # 자동화 Lambda
│   ├── network.tf                   # VPC, Subnet, Security Group
│   └── variables.tf / outputs.tf
│
├── docs/                            # 설계/운영 문서 (마크다운, Obsidian Canvas)
├── docker-compose.yml               # 로컬 개발: PostgreSQL + Redis
├── docker-compose.prod.yml          # 운영: backend + ai + redis
└── .env.example                     # 환경 변수 템플릿
```

---

## 4. 아키텍처 (Architecture)

### 전체 시스템 구성

```
[사용자 브라우저]
      |
      | HTTPS
      v
[AWS CloudFront (CDN)]
      |
      |--- /static → S3 (React 빌드 결과물) [추론]
      |--- /api/v1, /oauth2, /login/oauth2 → EC2 (Nginx) → Spring Boot :8080
      |
      v
[EC2 t3.micro]
  ├── [Spring Boot :8080] ← 핵심 백엔드
  │     ├── → [PostgreSQL/RDS :5432] (JPA, Native PostGIS SQL)
  │     ├── → [Redis :6379] (랭킹, 블랙리스트, GEO, Pub/Sub)
  │     ├── → [FastAPI AI :8000] (RestTemplate, Multipart)
  │     ├── → [Kakao/Google OAuth2 API] (소셜 로그인)
  │     ├── → [공공데이터 API] (50만 건 화장실 동기화)
  │     └── → [Toss Payments API] (결제 confirm)
  └── [FastAPI AI :8000]
        ├── → [OpenAI API] (GPT-4o Vision)
        └── → [Redis] (분석 결과 캐싱)

[개발 환경]
  Frontend (Vite :5173) → proxy → Backend (Spring Boot :8080)
  docker-compose: PostgreSQL + Redis (앱은 로컬 실행)
```

### 컴포넌트 간 데이터 흐름

```
[프론트엔드] → REST API → [Spring Boot] → [DB / Redis / AI]
                                |
                                → SSE (알림 실시간 스트리밍)
                                  (Redis Pub/Sub로 분산 인스턴스 대응)
```

### 사용된 아키텍처/디자인 패턴

| 패턴 | 적용 위치 | 이유 |
|------|----------|------|
| Layered Architecture | Controller→Service→Repository | 표준적 Spring 관례 |
| Event-Driven (비동기) | PooRecordEventListener, ToiletReviewEventListener | 기록 저장과 후처리(랭킹/칭호/포인트)를 분리하여 응답 시간 최소화 |
| Repository Pattern | Spring Data JPA Repositories | DB 접근 추상화 |
| AOP | RateLimit, ServiceLogging | 횡단 관심사 분리 |
| Mapper Pattern | MapStruct | 컴파일 타임 DTO 변환, 리플렉션 오버헤드 제거 |
| Facade Pattern | AiClient | Python AI 서비스 호출 복잡도 은닉 |
| Observer (Pub/Sub) | Redis Pub/Sub + SSE | 실시간 알림, 멀티 인스턴스 대응 |
| Strategy | VisionService 프롬프트 설계 | AI 응답 스키마 고정 (Structured Output) |
| Domain Model 풍부화 | User.addExpAndPoints(), Subscription.cancel() | 엔티티 내 비즈니스 로직, 빈약한 모델 방지 |
| Virtual Thread | Spring Boot 3.4 기본 설정 | [추론] Java 21 Virtual Thread를 활성화하여 공공데이터 병렬 동기화 극대화 |

---

## 5. 핵심 데이터 모델 (Core Data Models)

### 엔티티 관계도 (텍스트)

```
User (1) ──────────────────── (N) PooRecord ─── (N:1) Toilet
 │                                    │
 │ (1:N) Subscription               (via event)
 │ (1:N) Payment                      ↓
 │ (1:N) Notification           RankingService (Redis ZSET)
 │ (1:N) Inventory ── (N:1) Item
 │ (1:N) UserTitle ── (N:1) Title
 │ (1:N) Favorite ── (N:1) Toilet
 │ (1:N) Inquiry
 │ (1:N) VisitLog ── (N:1) Toilet
 └──────(1:N) HealthReportSnapshot
```

### 핵심 엔티티 상세

#### User (users)
```sql
id, password(BCrypt), email(UK, 100), nickname(UK, 50),
equipped_title_id(FK titles), home_region(50),
level(1~30), exp(BIGINT), points(BIGINT), role(VARCHAR 20),
created_at, updated_at
```
- `role`: `ROLE_USER` | `ROLE_PRO` | `ROLE_PREMIUM` | `ROLE_ADMIN`
- `level` 공식: `while exp >= level * 100 → exp -= level*100, level++` (max 30)
- 소셜 가입 시 `password = BCrypt(UUID.randomUUID().toString())`

#### Toilet (toilets)
```sql
id, name, mng_no(UK, 100), location(geometry Point 4326),
address(255), open_hours(100), is_24h, is_unisex,
avg_rating(DOUBLE), review_count(INT), ai_summary(TEXT),
created_at, updated_at
```
- `location`에 **GIST 인덱스** → `ST_DistanceSphere` 기반 반경 검색
- `mng_no`: 공공데이터 관리번호 (중복 방지용 유니크 키)
- `ai_summary`: 리뷰 5개 이상 시 AI가 자동 생성 (ToiletReviewCreatedEvent)

#### PooRecord (poo_records)
```sql
id, user_id, toilet_id,
bristol_scale(1-7), color(VARCHAR 50),
condition_tags(TEXT, comma-separated), diet_tags(TEXT),
warning_tags(TEXT), region_name(VARCHAR 50),
created_at
```
- `bristol_scale`: 브리스톨 대변 척도 (1=변비, 7=심한 설사)
- `region_name`: 화장실 주소 파싱 결과 (구/군/시 단위). 주소 없으면 Kakao 역지오코딩 fallback

#### Subscription (subscriptions)
```sql
id, user_id, plan(BASIC/PRO/PREMIUM), billing_cycle(MONTHLY/YEARLY),
status(ACTIVE/CANCELLED/EXPIRED), start_date, end_date,
is_auto_renewal(BOOL), last_payment_id
```
- `isActive()`: `status=ACTIVE && endDate > now()`

#### VisitLog (visit_logs)
- `event_type`: `CHECK_IN` | `RECORD_CREATED` | `VERIFICATION_FAILED`
- 위치 검증 실패 시에도 로그 기록 (failure_reason 포함)
- 분석/통계 목적의 감사 로그

### Flyway 마이그레이션 히스토리 (V1~V26)
| 버전 | 주요 내용 |
|------|----------|
| V1 | 초기 스키마 (users, items, inventories, titles, user_titles, toilets, poo_records, payments, notifications, inquiries) |
| V2 | 어드민 기능 (system_settings, system_logs) |
| V3 | toilet_reviews 테이블 |
| V14 | subscriptions 테이블 |
| V15 | visit_logs 테이블 |
| V16 | health_report_snapshots 테이블 |
| V21 | favorites 테이블 |
| V23 | 칭호 시스템 개편 (title.condition 컬럼) |
| V25 | items.discount_price |
| V26 | items.published (숨김/공개 제어) |

---

## 6. 핵심 비즈니스 로직 (Core Business Logic)

### 6-1. 화장실 체크인 → 기록 생성 플로우

```
POST /api/v1/poo-records/checkin
  └── PooRecordService.checkIn()
      ├── [검증] ST_DistanceSphere(user_location, toilet_location) <= 150m
      │         실패 → VisitLog(VERIFICATION_FAILED, OUT_OF_RANGE) + 403 예외
      ├── [기록] Redis "arrival:{userId}:{toiletId}" = currentTimeMillis
      └── 반환: PooCheckInResponse(toiletId, firstArrivalTime, elapsedSeconds, remainedSeconds)

POST /api/v1/poo-records (60초 후)
  └── PooRecordService.createRecord()
      ├── [검증] 거리 150m 이내 재확인
      ├── [검증] Redis arrivalTime + 60초 경과 여부 (STAY_TIME_NOT_MET)
      ├── [AI 분석] imageBase64 있으면 → AiClient.analyzePoopImage()
      │             없으면 → 수동 입력값 사용 (bristolScale, color, tags 필수)
      ├── [지역명] toilet.address 파싱 → 구/군/시 추출
      │           "기타" 이면 → GeocodingService.reverseGeocode() (Kakao API)
      ├── [저장] PooRecord 저장
      ├── [포인트] 같은 화장실 하루 3회 초과 시 0포인트 (DAILY_POINT_LIMIT_PER_TOILET=3)
      ├── [이벤트] PooRecordCreatedEvent(email, regionName, exp=5, points=10) 발행
      │   └── @Async AFTER_COMMIT → PooRecordEventListener
      │       ├── User.addExpAndPoints(5, 10)
      │       ├── RankingService.updateGlobalRank(user) → Redis ZSET
      │       ├── RankingService.updateRegionRank(user, region) → Redis ZSET
      │       └── TitleAchievementService.checkAndGrantTitles(user)
      └── 반환: PooRecordResponse
```

### 6-2. 랭킹 시스템

```
Redis ZSET 구조:
  - "daypoo:rankings:global" → score = recordCount + uniqueToilets * 3.0
  - "daypoo:rankings:health" → score = healthScore (AI 건강 리포트 기반)
  - "daypoo:rankings:region:{regionName}" → score = 해당 지역 내 기록 수 + 독립화장실 * 3.0

초기화:
  - ApplicationReadyEvent → rebuildAllRankings() (서버 시작 시)
  - @Scheduled(cron="0 0 4 * * *") → 매일 04:00 재구축

조회:
  - reverseRangeWithScores(key, 0, 9) → Top 10
  - 배치 조회: 유저 목록, 칭호 목록, 장착 아이템 목록을 각각 한 번씩 일괄 조회 (N+1 방지)
```

### 6-3. 긴급 화장실 찾기 (Emergency)

```
GET /api/v1/emergency?latitude=&longitude=
  └── EmergencyService.findEmergencyToilets()
      ├── Redis GEO Search: "daypoo:toilets:geo" 키에서 1km 반경, 최대 50개
      ├── 각 화장실에 가중치 계산:
      │   finalWeight = (distance * 0.7) + (is24h ? 0 : 500) * 0.3
      └── 가중치 기준 정렬 후 상위 3개 반환
```

### 6-4. AI 이미지 분석 파이프라인

```
[Frontend]
  WebRTC Canvas → Base64 인코딩 → POST /api/v1/poo-records (imageBase64 필드)

[Spring Boot - AiClient.analyzePoopImage()]
  Base64 → byte[] 변환
  → Multipart POST → FastAPI :8000/api/v1/analysis/analyze

[FastAPI - VisionService.analyze_poop_image()]
  bytes → Base64 (OpenAI용)
  → openai.beta.chat.completions.parse(model=GPT-4o, response_format=PoopAnalysisResult)
  → 반환: {is_poop, bristol_scale, color, shape_description, health_score, ai_comment, warning_tags}

[검증]
  is_poop=false → BusinessException(NOT_POOP_IMAGE, 400)
  is_poop=true → PooRecord에 AI 결과 저장
```

### 6-5. 결제 및 구독 처리

```
[프론트엔드]
  TossPayments SDK → 결제 창 → orderId, paymentKey, amount 반환

[Spring Boot - PaymentService.confirmPayment()]
  POST https://api.tosspayments.com/v1/payments/confirm (Basic Auth: secretKey:)
  → 성공 시 Payment 저장
  → orderId 또는 amount로 플랜 판별:
    - orderId에 "PRO" 포함 → SubscriptionPlan.PRO
    - orderId에 "PREMIUM" 포함 → SubscriptionPlan.PREMIUM
    - 그 외 amount → SubscriptionPlan.fromAmount(amount) (포인트 충전)
  → PRO/PREMIUM: Subscription 생성 + User.role 업데이트
  → BASIC: User.addExpAndPoints(0, amount) (포인트 추가)
```

### 6-6. 실시간 알림 (SSE + Redis Pub/Sub)

```
[구독]
GET /api/v1/notifications/subscribe (SSE, SSE 토큰으로 인증)
→ SseEmitter 생성 → localEmitters Map에 userId로 저장
→ "connect" 이벤트 즉시 전송

[발송]
NotificationService.send(user, type, title, content, redirectUrl)
→ notifications 테이블에 저장
→ Redis Pub/Sub "notifications" 채널에 publish
→ 모든 인스턴스의 리스너가 수신
→ sendToLocal(userId, response) → 해당 유저 SseEmitter로 이벤트 전송

분산 대응: 다른 인스턴스에 유저가 연결되어 있어도 Redis Pub/Sub으로 전달
단점: localEmitters는 인메모리 → 인스턴스 재시작 시 연결 끊김
```

### 6-7. 공공데이터 동기화 엔진

- 전국 화장실 공공 API (data.go.kr) → 약 50만 건
- Java 21 Virtual Threads 기반 병렬 페칭 (1,000+ 페이지 동시)
- `reWriteBatchedInserts=true` JDBC 옵션 + `batchUpdate`로 대량 삽입
- 시작 시 전체 `mng_no` 목록을 `ConcurrentHashMap`에 사전 로딩 → DB I/O 90% 절감 (중복 체크용)
- [추론] 별도 Admin 엔드포인트 또는 스케줄러로 트리거

---

## 7. API / 인터페이스 (API / Interfaces)

### 백엔드 REST API (모든 엔드포인트 prefix: `/api/v1`)

#### 인증 (`/auth`)
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /auth/me | O | 내 정보 조회 (통계 포함) |
| PATCH | /auth/me | O | 닉네임 수정 |
| PATCH | /auth/password | O | 비밀번호 변경 |
| DELETE | /auth/me | O | 회원 탈퇴 |
| POST | /auth/login | X | 로그인 (Rate: 10/300s) |
| POST | /auth/signup | X | 회원가입 (Rate: 10/600s) |
| POST | /auth/social/signup | X | 소셜 회원가입 완료 (닉네임 설정) |
| POST | /auth/logout | O | 로그아웃 (블랙리스트 등록) |
| POST | /auth/refresh | X | 액세스 토큰 재발급 |
| POST | /auth/password/reset | X | 임시 비밀번호 발송 (이메일) |
| GET | /auth/check-email | X | 이메일 중복 확인 (Rate: 20/60s) |
| GET | /auth/check-nickname | X | 닉네임 중복 확인 (Rate: 20/60s) |
| GET | /auth/find-id | X | 아이디(이메일) 찾기 (마스킹) |

#### 화장실 (`/toilets`)
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /toilets | O | 반경 내 화장실 목록 (lat, lon, radius=1000m, limit=300) |
| GET | /toilets/search | O | OpenSearch 텍스트/초성 검색 |

#### 배변 기록 (`/poo-records`)
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /poo-records/checkin | O | 화장실 체크인 (위치 검증) |
| POST | /poo-records | O | 배변 기록 생성 (이미지 또는 수동) |
| POST | /poo-records/analyze | O | AI 이미지 분석만 (저장 없음) |
| GET | /poo-records | O | 내 기록 목록 (페이지네이션) |
| GET | /poo-records/{id} | O | 개별 기록 조회 |
| GET | /poo-records/visit-counts | O | 화장실별 방문 횟수 |

#### 랭킹 (`/rankings`)
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /rankings/global | X | 전체 랭킹 Top 10 + 내 순위 |
| GET | /rankings/region | X | 지역별 랭킹 |
| GET | /rankings/health | X | 건강왕 랭킹 |

#### 알림 (`/notifications`)
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /notifications/subscribe | SSE 토큰 | SSE 연결 수립 |
| GET | /notifications | O | 알림 목록 |
| PATCH | /notifications/{id}/read | O | 읽음 처리 |
| PATCH | /notifications/read-all | O | 전체 읽음 |
| DELETE | /notifications/{id} | O | 알림 삭제 |

#### 결제/구독 (`/payments`, `/subscriptions`)
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /payments/confirm | O | 토스 결제 승인 |
| GET | /subscriptions/my | O | 내 구독 정보 |
| POST | /subscriptions/cancel | O | 구독 취소 |

#### 기타
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /emergency | O | 긴급 화장실 Top 3 (Redis GEO) |
| GET, POST | /favorites/** | O | 즐겨찾기 CRUD |
| GET, POST | /reviews/** | O | 화장실 리뷰 CRUD |
| GET, POST | /health-reports/** | O | 건강 리포트 조회/생성 |
| GET, POST | /support/** | O | FAQ, 문의 |
| GET, POST | /shop/** | O | 상점 아이템 목록/구매/장착 |
| GET, POST | /admin/** | ADMIN | 어드민 관리 |

#### OAuth2 (Spring Security 자동 처리)
| Path | 설명 |
|------|------|
| GET /oauth2/authorization/{provider} | 소셜 로그인 시작 (`kakao`, `google`) |
| GET /login/oauth2/code/{provider} | OAuth2 콜백 수신 (자동 처리) |

### AI Service REST API (`/api/v1`)
| Method | Path | 설명 |
|--------|------|------|
| POST | /analysis/analyze | 이미지 분석 (Multipart) |
| POST | /report/generate | 주간 건강 리포트 |
| POST | /report/generate/monthly | 월간 건강 리포트 |
| POST | /review/summarize | 화장실 리뷰 AI 요약 |

### 비동기 통신
- **Spring Application Events**: `PooRecordCreatedEvent`, `ToiletReviewCreatedEvent` (인스턴스 내부)
- **Redis Pub/Sub**: 채널 `notifications` (분산 알림)

---

## 8. 설정 및 환경 (Configuration & Environment)

### 환경 변수 전체 목록

| 변수명 | 용도 | 필수 |
|--------|------|------|
| POSTGRES_USER/PASSWORD/DB | DB 접속 | O |
| DB_HOST/PORT | DB 호스트 | O |
| REDIS_HOST/PORT | Redis 접속 | O |
| REDIS_PASSWORD | Redis 비밀번호 (없으면 빈 값) | - |
| JWT_SECRET_KEY | JWT 서명 키 (Base64, 256비트 이상) | O |
| FRONTEND_URL | OAuth2 redirect URI 기반, CORS | O |
| CORS_ALLOWED_ORIGINS | CORS 허용 도메인 (기본값: FRONTEND_URL) | - |
| KAKAO_CLIENT_ID/SECRET | 카카오 OAuth2 | O |
| GOOGLE_CLIENT_ID/SECRET | 구글 OAuth2 | O |
| PUBLIC_DATA_API_KEY | 공공데이터 화장실 API | O |
| AI_SERVICE_URL | FastAPI 서비스 URL | O |
| OPENAI_API_KEY | GPT-4o Vision API | O |
| TOSS_SECRET_KEY | 토스 결제 서버 시크릿 | O |
| VITE_TOSS_CLIENT_KEY | 토스 결제 클라이언트 키 (프론트) | O |
| MAIL_USERNAME/PASSWORD | Gmail SMTP | O |
| OPENSEARCH_URL | OpenSearch 엔드포인트 (기본: localhost:9200) | - |
| FLYWAY_REPAIR_ON_START | Flyway repair 자동 실행 여부 | - |
| SELF_CHECK_MAIL_ENABLED | 자체 점검 메일 여부 | - |

### 주요 설정값 (application.yml)
```yaml
# JWT 유효 기간
access-token-validity-in-seconds: 3600     # 1시간
refresh-token-validity-in-seconds: 1209600  # 14일

# HikariCP 커넥션 풀
maximum-pool-size: 40
minimum-idle: 10

# 공공데이터 API
public-data:
  url: https://apis.data.go.kr/1741000/public_restroom_info/info

# 모니터링
management.endpoints: health, info, metrics, prometheus

# Swagger
springdoc.swagger-ui.path: /docs
```

### 환경별 차이점
| 항목 | 개발 (로컬) | 운영 (prod) |
|------|-----------|------------|
| 프로파일 | 기본 | `prod,simulation` |
| DB | docker-compose PostgreSQL | 외부 RDS |
| Redis | docker-compose Redis | EC2 내 Redis 컨테이너 |
| 프론트엔드 | Vite dev server `:5173` (proxy) | CloudFront (Nginx 추정) |
| AI Service | 로컬 Python | EC2 내 Docker 컨테이너 |
| 백엔드 메모리 | 제한 없음 | 512MB |

---

## 9. 인증/인가 및 보안 (Auth & Security)

### JWT 토큰 체계
| 토큰 | TTL | 용도 | 핵심 Claim |
|------|-----|------|-----------|
| Access Token | 1시간 | API 인증 | sub=email, role |
| Refresh Token | 14일 | Access Token 재발급 | sub=email (role 없음, DB에서 조회) |
| SSE Token | 30초 | SSE 구독 인증 | sub, role, type="sse" |
| Registration Token | 5분 | 소셜 신규 가입 임시 인증 | sub, email, role, type="registration" |

### 인증 흐름
```
[일반 로그인]
POST /auth/login → BCrypt 검증 → Access + Refresh Token 반환
→ 프론트: stayLoggedIn ? localStorage : sessionStorage

[소셜 로그인 (카카오/구글)]
/oauth2/authorization/{provider}
→ Spring Security OAuth2: 인가 코드 → Provider Access Token → Provider API 유저 정보
→ CustomOAuth2UserService.loadUser() (정보 파싱만)
→ OAuth2SuccessHandler.onAuthenticationSuccess():
  - 기존 유저: JWT Access+Refresh → /auth/callback?access_token=...&refresh_token=...
  - 신규 유저: Registration Token → /signup/social?registration_token=...

[토큰 갱신]
POST /auth/refresh?refreshToken={token}
→ DB에서 최신 role 조회 → 새 Access Token (Refresh Token은 그대로 반환)

[로그아웃]
POST /auth/logout
→ Redis "blacklist:{accessToken}" 설정 (TTL = 남은 만료 시간)
→ JwtAuthenticationFilter에서 블랙리스트 체크
```

### 권한 체계
- `ROLE_USER`: 기본 회원
- `ROLE_PRO`: PRO 구독 (결제로 업그레이드)
- `ROLE_PREMIUM`: PREMIUM 구독
- `ROLE_ADMIN`: 어드민 (수동 DB 업데이트 또는 Admin API)

### Rate Limiting
- Redis INCR 기반, IP별 슬라이딩 윈도우
- `X-Forwarded-For` → `X-Real-IP` → `remoteAddr` 순서로 실제 IP 추출 (CloudFront/Nginx 대응)

### 점검 모드 (MaintenanceModeFilter)
- `AdminSettingsService.isMaintenanceMode()` = true → 503 반환
- ROLE_ADMIN 인증된 사용자 및 어드민/Swagger 경로는 통과

---

## 10. 테스트 (Testing)

- `src/test/` 디렉토리 존재 (빌드 설정에 `spring-boot-starter-test`, `spring-security-test` 의존성 선언)
- 직접 읽은 테스트 파일 없음
- [추론] 실질적인 테스트 코드는 거의 없거나 초기 단계일 가능성이 높음 (빠른 개발 스타일, 실 코드 분량 대비 테스트 파일 미확인)
- Flyway 마이그레이션 기반으로 스키마 변경을 관리하는 것이 주요 품질 관리 수단으로 보임

---

## 11. 주요 기술적 결정 사항 (Key Technical Decisions)

### 결정 1: Java 21 Virtual Threads 채택
**이유**: 전국 50만 건 공공데이터를 1,000+ 페이지 병렬 HTTP 요청으로 동기화할 때 스레드 풀 고갈 없이 처리하기 위함. Virtual Thread는 I/O 대기 동안 OS 스레드를 점유하지 않아 대규모 병렬 HTTP 클라이언트에 최적.
**트레이드오프**: Spring Boot 3.4에서 Tomcat Virtual Thread 지원이 기본 활성화됨. 추가 설정 불필요. [추론]

### 결정 2: PostgreSQL + PostGIS, Redis GEO 이중화
**이유**: 반경 검색(`findToiletsWithinRadius`)은 GIST 인덱스를 활용한 PostGIS Native Query. 긴급 검색(`EmergencyService`)은 Redis GEO로 속도 우선 처리 (서로 다른 성능/정확도 트레이드오프 선택).

### 결정 3: Python FastAPI AI 서비스 분리
**이유**: OpenAI SDK, numpy, 비전 처리 라이브러리는 JVM 생태계보다 Python 생태계가 성숙함. 백엔드(Java)와 AI(Python)을 독립 컨테이너로 분리하여 각각 독립 배포/스케일링 가능.
**트레이드오프**: 서비스 간 네트워크 호출 추가. Spring Retry로 실패 시 1초 후 1회 재시도.

### 결정 4: 이미지 In-Memory 처리 (무저장)
**이유**: 사용자 배변 이미지는 민감한 개인 정보. 서버 디스크에 저장하지 않고 byte[] → Base64 → OpenAI API 직접 전달 후 메모리에서 소멸. WebRTC Canvas 기반으로 셔터음도 없음.

### 결정 5: Redis ZSET 랭킹 (실시간)
**이유**: DB 집계 쿼리(GROUP BY + COUNT DISTINCT)는 50만 건 환경에서 느림. Redis ZSET의 `ZADD`/`ZREVRANK`는 O(log N) 보장. 기록 생성 이벤트마다 ZSET 점수를 업데이트하여 항상 최신 상태 유지. 매일 04:00 전체 재구축으로 데이터 정합성 보장.

### 결정 6: SSE + Redis Pub/Sub 조합
**이유**: SSE는 단방향 실시간 스트리밍에 적합하고 WebSocket보다 단순. Redis Pub/Sub으로 멀티 인스턴스 환경(EC2 스케일아웃)에서도 알림 전달 보장. 단, localEmitters는 인메모리라 인스턴스 재시작 시 재연결 필요.

### 결정 7: Toss Payments 서버사이드 confirm
**이유**: 결제 금액 위변조 방지. 프론트에서 결제 완료 후 받은 `paymentKey`, `orderId`, `amount`를 백엔드에서 Toss API에 재검증하여 서버가 최종 승인.

### 결정 8: 소셜 로그인 Registration Token
**이유**: 신규 소셜 사용자는 DB에 아직 없으므로 AccessToken 발급 불가. 5분짜리 단기 JWT(`type="registration"` claim)로 임시 신원을 증명하고 닉네임 설정 완료 시 정식 가입 처리.

---

## 12. 현재 상태 및 알려진 이슈 (Current State & Known Issues)

### 보안 이슈
1. **CookieUtils 자바 직렬화 (RCE 위험)**: `SerializationUtils.serialize/deserialize`로 OAuth2AuthorizationRequest를 쿠키에 저장. Gadget Chain 공격으로 RCE 가능. Jackson JSON 직렬화로 교체 필요.
2. **OAuth2 콜백 URL에 JWT 직접 노출**: `?access_token=...&refresh_token=...` → 브라우저 히스토리, Referer 헤더 노출. One-Time Code 방식(Redis 임시 코드)으로 교체 권장.
3. **validateToken() 무조건 예외 은닉**: 모든 JwtException을 catch해서 false 반환. 만료된 토큰과 위조된 토큰을 구분 불가.
4. **Refresh Token Rotation 미구현**: 리프레시 시 동일한 refreshToken 반환. 탈취된 refresh token 재사용 공격에 취약.
5. **임시 비밀번호 생성**: `UUID.randomUUID().toString().substring(0, 8)` → UUID 앞 8자리는 타임스탬프 기반으로 엔트로피가 낮음.

### 구현 이슈
6. **GlobalExceptionHandler가 Filter 예외 미처리**: Filter에서 발생하는 `AuthenticationException`, `AccessDeniedException`은 `@RestControllerAdvice`가 잡지 못함. `AuthenticationEntryPoint`/`AccessDeniedHandler` 미등록.
7. **EmergencyService Redis GEO 키 초기화 로직 누락**: `daypoo:toilets:geo` 키가 비어있으면 빈 배열 반환. 화장실 동기화 후 GEO 키 재구축 로직이 확인되지 않음.
8. **RankingService 부분 N+1**: `getRankingFromRedis()`의 `topRankers` 루프 내 `reverseRank()` 호출이 개별 Redis 요청. 배치 조회로 개선 가능.
9. **AdminRoute console.log 프로덕션 노출**: `[AdminRoute] Debug:` 콘솔 로그가 프로덕션 코드에 남아있음.
10. **이메일 기반 소셜 계정 연동**: provider + providerId 없이 email만으로 기존 유저 판별 → 이메일 변경 시 계정 추적 불가.

### 미완성/TODO로 추정되는 기능
- `[추론]` OpenSearch 초성 검색: `ToiletSearchService` 클래스가 존재하나 내부 구현 미확인
- `[추론]` 공공데이터 동기화 트리거: 별도 Admin 엔드포인트 또는 스케줄러로 동작하는 것으로 보이나 실제 트리거 코드 미확인
- `simulation` 스프링 프로파일: `application.yml`에 설정 존재 (bot 유형 포함). 부하 테스트/시뮬레이션용으로 추정

---

## 13. 용어집 (Glossary)

| 용어 | 정의 |
|------|------|
| Bristol Scale (브리스톨 척도) | 대변 형태를 1(딱딱한 변비)~7(심한 설사)로 분류하는 의학적 척도. DayPoo의 핵심 데이터 지표. |
| mng_no (관리번호) | 공공데이터 포털의 화장실 고유 관리번호. 중복 동기화 방지용 자연키. |
| Check-in | 사용자가 화장실 150m 이내에 위치할 때 '체크인'하여 도착 시간을 기록. 이후 60초 체류 후 배변 기록 생성 가능. |
| Registration Token | 소셜 신규 가입자의 5분짜리 임시 JWT. `type="registration"` claim으로 일반 Access Token과 구분. |
| SSE Token | SSE 구독 전용 30초 JWT. URL 쿼리 파라미터로 전달 (`?sseToken=...`). Bearer 헤더가 SSE 연결에서 불편하기 때문. |
| homeRegion | 유저의 마지막 배변 기록 지역명 (구/군/시 단위). 지역 랭킹에서 "내 지역" 기본값으로 사용. |
| PRO / PREMIUM | 유료 구독 플랜. Toss 결제 후 user.role이 ROLE_PRO / ROLE_PREMIUM으로 업데이트됨. |
| Poo Record | 배변 기록. 화장실 체크인 + 60초 체류 후 AI 분석 또는 수동 입력으로 생성. |
| aiSummary | 리뷰 5개 이상인 화장실에 AI가 자동 생성한 한 줄 요약. 화장실 팝업에 표시. |
| ZSET | Redis Sorted Set. 랭킹 순위 저장에 사용 (score 기반 자동 정렬). |
| GEO Key | Redis GEO 데이터 타입. 화장실 좌표를 Redis에 저장하여 긴급 반경 검색에 사용. |
| Virtual Thread | Java 21 신기능. OS 스레드보다 훨씬 가볍고 I/O 대기 중 OS 스레드를 블록하지 않음. 공공데이터 대량 병렬 처리에 활용. |
| Flyway | DB 마이그레이션 도구. V1~V26 순서대로 적용. 새 컬럼/테이블 추가 시 반드시 새 버전 파일 생성 필요. |
| MapStruct | 컴파일 타임 코드 생성 기반 DTO 변환기. `ToiletMapper`, `PooRecordMapper`가 핵심. |
| PostGIS | PostgreSQL 공간 데이터 확장. `geometry(Point, 4326)` 타입, GIST 인덱스, `ST_DistanceSphere` 함수 사용. |
| DAILY_POINT_LIMIT_PER_TOILET | 같은 화장실 하루 3회 초과 시 포인트 미지급 (어뷰징 방지). 경험치는 항상 지급. |
| Blacklist | Redis에 저장된 로그아웃된 토큰 목록. TTL=토큰 남은 만료 시간. JwtAuthenticationFilter가 매 요청마다 체크. |
| Correlation ID | MDCFilter가 생성하는 UUID. 요청-응답-AI 서비스 호출을 하나의 로그로 추적하는 데 사용. |

---

*최초 작성: 2026-04-02*
*기준 코드 버전: main 브랜치 (commit fad34bf 이후)*
