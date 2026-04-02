# DayPoo 코드베이스 분석 노트 (중간 기록)

> PROJECT_OVERVIEW.md 작성을 위한 중간 요약. 컨텍스트 윈도우 보호용.

---

## Phase 1: 프로젝트 구조 요약

### 루트 구조
```
daypoo/
├── backend/        Spring Boot 3.4 (Java 21)
├── frontend/       React 19 + Vite + TypeScript
├── ai-service/     FastAPI (Python 3.12)
├── terraform/      AWS 인프라 IaC (EC2, RDS, CloudFront, S3, OpenSearch)
├── docs/           설계문서, 온보딩, 아키텍처 캔버스
├── docker-compose.yml        개발: PostgreSQL + Redis만
├── docker-compose.prod.yml   운영: backend + ai + redis (DB는 RDS 외부)
└── .env.example
```

### 주요 환경 변수
- DB: POSTGRES_USER/PASSWORD/DB, DB_HOST/PORT
- Redis: REDIS_HOST/PORT
- Security: JWT_SECRET_KEY, FRONTEND_URL
- OAuth2: KAKAO_CLIENT_ID/SECRET, GOOGLE_CLIENT_ID/SECRET
- External: PUBLIC_DATA_API_KEY, AI_SERVICE_URL, TOSS_SECRET_KEY, VITE_TOSS_CLIENT_KEY
- Email: MAIL_USERNAME/PASSWORD (Gmail SMTP)
- OpenSearch: OPENSEARCH_URL

---

## Phase 2: 핵심 코드 요약

### Backend (Spring Boot 3.4, Java 21)

#### 의존성 핵심
- JPA (Hibernate Spatial), PostGIS, Flyway (V1~V26)
- Spring Security + OAuth2 Client
- JJWT 0.12.5
- Spring Data Redis (Lettuce)
- Spring WebFlux (WebClient), RestTemplate (외부 API)
- Spring Retry (AiClient 재시도)
- Spring AOP (RateLimit, ServiceLogging)
- MapStruct, Lombok
- QueryDSL (선언은 있으나 실제 사용은 JPA Repository 위주)
- Springdoc OpenAPI 2.8.5
- Micrometer Prometheus (모니터링)
- spring-dotenv (루트 .env 자동 로딩)
- Spring Mail (Gmail SMTP, 임시비밀번호 발송)

#### 엔티티 목록 (모두 BaseTimeEntity 상속: createdAt, updatedAt)
| 엔티티 | 테이블 | 핵심 필드 |
|--------|--------|----------|
| User | users | email(UK), nickname(UK), password, role, level, exp, points, equippedTitleId, homeRegion |
| Toilet | toilets | name, mngNo(UK), location(PostGIS Point), address, openHours, is24h, isUnisex, avgRating, reviewCount, aiSummary |
| PooRecord | poo_records | user, toilet, bristolScale(1-7), color, conditionTags, dietTags, warningTags, regionName |
| Subscription | subscriptions | user, plan(BASIC/PRO/PREMIUM), status(ACTIVE/CANCELLED/EXPIRED), billingCycle(MONTHLY/YEARLY), startDate, endDate, isAutoRenewal, lastPayment |
| Payment | payments | user, orderId, amount, paymentKey, email |
| Item | items | name, description, type(AVATAR 등 ItemType), price, discountPrice, imageUrl, published |
| Inventory | inventories | user, item, isEquipped |
| Title | titles | name, description, requiredLevel, price, condition |
| UserTitle | user_titles | user, title, acquiredAt |
| Notification | notifications | user, type, title, content, redirectUrl, isRead |
| Inquiry | inquiries | user, type, title, content, answer, status |
| VisitLog | visit_logs | user, toilet, eventType, arrivalAt, completedAt, userLat/Lon, distanceMeters, pooRecord, dwellSeconds, failureReason |
| HealthReportSnapshot | health_report_snapshots | user, healthScore, reportType, summary |
| Favorite | favorites | user, toilet |
| SystemSettings | system_settings | key-value 형태 |
| SystemLog | system_logs | level, category, message |
| Faq | faqs | question, answer |

#### Role 열거형
ROLE_USER, ROLE_PRO, ROLE_PREMIUM, ROLE_ADMIN

#### 서비스 목록
- AuthService: 로그인/회원가입/OAuth2/프로필/비밀번호/탈퇴
- ToiletService: PostGIS 반경 검색
- ToiletSearchService: OpenSearch 텍스트(초성) 검색
- PooRecordService: 체크인(150m+60초) + 기록 생성 + AI분석
- RankingService: Redis ZSET (global/region/health), 매일 04:00 재구축
- PaymentService: Toss Payments API 연동, 구독/포인트 처리
- SubscriptionService: 구독 생성/취소/갱신
- NotificationService: SSE Emitter + Redis Pub/Sub
- EmergencyService: Redis GEO (1km + 가중치 알고리즘, 상위 3개 반환)
- HealthReportService: AI 주간/월간 건강 리포트
- AiClient: Python FastAPI 호출 (이미지분석/건강리포트/리뷰요약), Spring Retry
- GeocodingService: Kakao 역지오코딩
- EmailService: Gmail SMTP
- ShopService: 아이템 구매/장착
- TitleAchievementService: 칭호 자동 부여
- AdminService, AdminManagementService, AdminSettingsService: 어드민 기능
- UserDeletionService: 회원 탈퇴 연관데이터 삭제

#### 이벤트 시스템
- PooRecordCreatedEvent: 기록 생성 후 AFTER_COMMIT에 @Async 처리
  → 경험치/포인트 추가 → 랭킹 업데이트 → 칭호 부여
- ToiletReviewCreatedEvent: 리뷰 생성 후 AI 요약 트리거

#### AOP
- @RateLimit(maxAttempts, windowSeconds): Redis INCR 기반, IP별 슬라이딩 윈도우
  - /auth/login: 10회/300초
  - /auth/signup: 10회/600초
  - /auth/check-email, /auth/check-nickname: 20회/60초
- @ServiceLoggingAspect: 서비스 메서드 로깅

#### 필터 체인
1. MDCFilter (일반 Servlet Filter): correlationId 생성/주입
2. JwtAuthenticationFilter (OncePerRequestFilter): Bearer 토큰 + Redis 블랙리스트 체크
3. MaintenanceModeFilter (OncePerRequestFilter): 점검 모드 체크 (JwtFilter 이후)

#### Redis 사용 패턴
- `blacklist:{token}` → 로그아웃 블랙리스트 (TTL=남은만료시간)
- `rate:{ip}:{method}` → Rate Limiting 카운터
- `daypoo:rankings:global` → 전체 랭킹 ZSET
- `daypoo:rankings:health` → 건강왕 랭킹 ZSET
- `daypoo:rankings:region:{regionName}` → 지역 랭킹 ZSET
- `daypoo:toilets:geo` → 긴급 화장실 GEO Index
- `notifications` → Pub/Sub 채널
- `arrival:{userId}:{toiletId}` → 체크인 시간 (60초 타이머용)
- (RateLimitAspect): `rate:{ip}:{method}`

#### 보안 설정 (SecurityConfig)
- CSRF 비활성화, STATELESS 세션
- OAuth2: HttpCookieOAuth2AuthorizationRequestRepository
- 공개 경로: OPTIONS/**, /api/v1/auth/**, /oauth2/**, /api/v1/rankings/**, /actuator/health, Swagger, SSE subscribe
- 보호 경로: /api/v1/admin/** (ROLE_ADMIN), 나머지 authenticated

---

### AI Service (FastAPI, Python 3.12)

#### 엔드포인트
- POST /api/v1/analysis/analyze → VisionService.analyze_poop_image() → OpenAI GPT-4o Vision
  - 반환: is_poop, bristol_scale, color, shape_description, health_score, ai_comment, warning_tags
- POST /api/v1/report/generate → ReportService (주간 건강리포트)
- POST /api/v1/report/generate/monthly → ReportService (월간)
- POST /api/v1/review/summarize → ReviewService (화장실 리뷰 AI 요약)

#### 특징
- In-memory pipeline: 이미지를 디스크에 저장하지 않음 (bytes → base64 → OpenAI API)
- Redis 결과 캐싱 (redis_client.py)
- OpenAI beta.chat.completions.parse (Structured Output)
- 모델: settings.MODEL_NAME (GPT-4o 계열 추정)

---

### Frontend (React 19 + TypeScript + Vite)

#### 라우팅
- / → SplashPage (랜딩)
- /main → MainPage (지도 기반 홈)
- /map → MapPage (전체 지도)
- /ranking → RankingPage
- /mypage → MyPage
- /premium → PremiumPage (구독 안내)
- /support → SupportPage (FAQ + 문의)
- /admin → AdminPage (ADMIN 역할 필요)
- /auth/callback → AuthCallback (소셜 로그인 콜백)
- /signup/social → SocialSignupPage
- /payment/success → PaymentSuccessPage
- /forgot-password → ForgotPage
- /login → LoginPage (AuthModal 열기)
- /terms, /privacy → 약관 페이지

#### 주요 컴포넌트/Context
- AuthProvider: 토큰 관리 (localStorage/sessionStorage), /auth/me 폴링
- NotificationProvider + NotificationSubscriber: SSE 실시간 알림
- TransitionProvider: 페이지 전환 애니메이션
- AuthModal: 로그인/회원가입 모달 (전역)
- MapView: KakaoMap SDK 통합
- ErrorBoundary: 전역 에러 경계

#### API 클라이언트 (apiClient.ts)
- AbortController 30초 타임아웃
- 401 시 자동 토큰 갱신 (뮤텍스 패턴)
- 5xx/네트워크/타임아웃에 지수 백오프 재시도 (최대 3회, 1s→2s→4s)
- auth 엔드포인트는 재시도 제외

#### Vite 프록시 (개발)
- /api → http://localhost:8080
- /oauth2 → http://localhost:8080
- /login/oauth2 → http://localhost:8080

---

### Infrastructure (Terraform)

#### AWS 리소스
- EC2 t3.micro (Amazon Linux 2023, Docker + Docker Compose, 2GB Swap)
- CloudFront (CDN)
- RDS (PostgreSQL, 추정)
- S3 (정적 파일)
- OpenSearch (초성 검색용)
- Lambda (bot_lambda/)
- VPC, Security Groups

#### 운영 배포
- docker-compose.prod.yml: backend + ai + redis (3 컨테이너)
- DB는 외부 RDS 사용 (prod docker에 DB 컨테이너 없음)
- backend 메모리 제한: 512MB (t2.micro/t3.micro 고려)
- redis 메모리 제한: 128MB

---

## Phase 3: 아키텍처 패턴 요약

### 백엔드
- **레이어드 아키텍처**: Controller → Service → Repository
- **이벤트 기반 비동기 처리**: ApplicationEventPublisher + @Async (TaskExecutor)
- **AOP 기반 횡단 관심사**: RateLimit, ServiceLogging
- **Repository 패턴**: Spring Data JPA + Native Query (PostGIS)
- **Mapper 패턴**: MapStruct (DTO 변환)
- **외부 API 격리**: AiClient (RestTemplate + Spring Retry)
- **도메인 메서드 풍부화**: User.addExpAndPoints(), Subscription.cancel() 등 Entity에 비즈니스 로직

### 데이터 흐름 핵심
```
사용자 체크인 → PooRecordService.checkIn() (150m + 60초 검증)
→ createRecord() → AI 분석 또는 수동 입력
→ 지역명 추출 (주소 파싱 → Kakao 역지오코딩 fallback)
→ PooRecord 저장
→ PooRecordCreatedEvent 발행 (AFTER_COMMIT, @Async)
  → 경험치/포인트 추가
  → Redis ZSET 랭킹 업데이트 (global + region)
  → 칭호 체크 및 부여
```

### 알려진 기술 부채 / 이슈
1. JwtProvider.validateToken() - 모든 예외 silent catch (보안 이슈)
2. CookieUtils 자바 직렬화 (RCE 위험)
3. Refresh Token Rotation 미구현 (재사용 공격 취약)
4. OAuth2 콜백 URL에 JWT 직접 노출 (브라우저 히스토리 노출)
5. resetPassword() 임시 비밀번호 UUID 8자리 (UUID 엔트로피 낮음)
6. GlobalExceptionHandler가 Filter 레벨 예외 미처리
7. EmergencyService Redis 키 초기화 로직 불명확 (누락 시 빈 결과)
8. RankingService N+1: reverseRank() 개별 호출 (topRankers 루프 내)
9. AdminRoute: console.log debug 로그 프로덕션 노출
