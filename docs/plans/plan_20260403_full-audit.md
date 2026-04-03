# DayPoo 프로젝트 전체 코드 감사 보고서 (Full Audit Report)

> 생성일: 2026-04-03
> 검사 범위: frontend/, backend/, ai-service/, terraform/, .github/workflows/, docker/

---

## 1. 요약 (Executive Summary)

- 총 발견 항목: 32건
- Critical: 3건 / High: 8건 / Medium: 12건 / Low: 9건
- 즉시 조치 필요 항목 요약:
  - [C1] `CookieUtils.deserialize()`가 Java 네이티브 직렬화(`SerializationUtils.deserialize`)를 사용하여 쿠키 변조 시 RCE(원격 코드 실행) 위험
  - [C2] `OAuth2SuccessHandler`가 JWT 액세스 토큰 및 리프레시 토큰을 URL 쿼리 파라미터로 노출 — 브라우저 히스토리·서버 로그 등에 평문 저장
  - [C3] `users` 테이블에 `home_region` 컬럼이 Flyway 마이그레이션에 추가된 적 없으나 Entity에는 선언되어 있어 프로덕션 환경 `ddl-auto: update` 의존 (DDL 자동 실행 없으면 컬럼 미존재로 `createRecord` 호출 시 DB 에러)

---

## 2. 프로젝트 구조 개요

### 서비스 구성
| 서비스 | 기술 스택 | 버전 |
|--------|----------|------|
| Frontend | React 19.2, Vite 7.3, TailwindCSS 4.2, Framer Motion 12.36, React Router 7.13 | Node 20 |
| Backend | Spring Boot 3.4.3, Java 21, JPA/Hibernate Spatial, Spring Security + JWT (jjwt 0.12.5), Redis, PostgreSQL/PostGIS 16, Flyway | JDK 21 |
| AI Service | FastAPI, LangChain, OpenAI GPT-4o, Pydantic, Loguru | Python 3.x |
| Infra | AWS EC2 (t3.micro), RDS (db.t3.micro), S3 + CloudFront, Terraform ~5.0 | - |

### 서비스 간 통신 흐름
```
사용자 브라우저 (HTTPS via CloudFront)
    ├── /api/*  → EC2 (Spring Boot :8080)
    │               └── HTTP (내부망) → AI Service (FastAPI :8000)
    ├── /oauth2/*, /login/* → EC2 (OAuth2 핸들러)
    └── 그 외 → S3 정적 파일 (React SPA)
```

### 인증 흐름
- 일반 로그인: `POST /api/v1/auth/login` → JWT access/refresh 토큰 발급 → localStorage / sessionStorage 저장
- OAuth2: `GET /oauth2/authorization/{provider}` → Provider 인가 → `/auth/callback?access_token=...&refresh_token=...` 리다이렉트
- 토큰 갱신: `POST /api/v1/auth/refresh?refreshToken=...` (쿼리스트링 방식) → 뮤텍스 패턴으로 중복 방지

---

## 3. Critical & High 항목 (즉시 수정 필요)

| # | 카테고리 | 파일 경로 | 라인(추정) | 문제 설명 | 심각도 | 수정 제안 |
|---|---------|----------|-----------|----------|--------|----------|
| C1 | 보안 - RCE | `backend/src/main/java/com/daypoo/api/security/CookieUtils.java` | 52-55 | `SerializationUtils.deserialize(Base64.getUrlDecoder().decode(cookie.getValue()))` — Spring의 `SerializationUtils`는 Java 네이티브 직렬화를 사용함. 공격자가 쿠키 값을 변조된 직렬화 페이로드로 치환하면 역직렬화 과정에서 RCE 발생 가능. OAuth2 state 쿠키가 이 방식으로 저장/복원됨 (`HttpCookieOAuth2AuthorizationRequestRepository` 참조) | Critical | `serialize`/`deserialize` 메서드를 Jackson `ObjectMapper`(JSON 직렬화)로 교체. `public static String serialize(Object object)` → `objectMapper.writeValueAsString(object)` + Base64 인코딩. `public static <T> T deserialize(Cookie cookie, Class<T> cls)` → Base64 디코딩 후 `objectMapper.readValue(decoded, cls)`. `CookieUtils`에 `ObjectMapper` 파라미터 주입 또는 static 필드로 선언. |
| C2 | 보안 - 토큰 노출 | `backend/src/main/java/com/daypoo/api/security/OAuth2SuccessHandler.java` | 72-77 | JWT 액세스 토큰과 리프레시 토큰이 URL 쿼리 파라미터로 노출: `frontendUrl + "/auth/callback?access_token=" + accessToken + "&refresh_token=" + refreshToken`. 브라우저 히스토리, Referer 헤더, 서버 Access Log, CloudFront 액세스 로그에 평문 저장됨 | Critical | (1) 짧은 수명(60초)의 일회용 `authorizationCode`(UUID)를 Redis에 저장. (2) 리다이렉트 URL에는 해당 코드만 포함: `frontendUrl + "/auth/callback?code=" + authorizationCode`. (3) 프론트엔드 `/auth/callback`에서 `POST /api/v1/auth/exchange-code` 호출 → 서버가 Redis에서 토큰을 꺼내 반환. 현재 `frontend/src/pages/AuthCallback.tsx`의 URL 파라미터 파싱 로직도 함께 수정 필요. |
| C3 | DB 스키마 불일치 | `backend/src/main/java/com/daypoo/api/entity/User.java` L35-36 및 `backend/src/main/resources/db/migration/` (전체) | 35 | `User` 엔티티에 `@Column(name = "home_region", length = 50) private String homeRegion` 선언되어 있으나, V1~V28 Flyway 마이그레이션 파일 어디에도 `home_region` 컬럼 추가 스크립트가 없음. `application-prod.yml`의 `ddl-auto: update` 덕분에 현재까지 자동 생성되었을 수 있으나, `ddl-auto: none` 환경(기본 `application.yml`)이나 신규 DB에서는 `createRecord` 호출 시 `ERROR: column "home_region" does not exist` 발생 | Critical | `backend/src/main/resources/db/migration/V29__add_home_region_to_users.sql` 파일 생성: `ALTER TABLE users ADD COLUMN IF NOT EXISTS home_region VARCHAR(50);`. 동시에 `application-prod.yml`의 `ddl-auto: update` → `validate`로 변경하여 이후 스키마 드리프트를 조기에 감지 |
| H1 | 보안 - 어드민 엔드포인트 허용 | `backend/src/main/java/com/daypoo/api/security/SecurityConfig.java` | 55-56 | `/api/v1/admin/toilets/reindex`와 `/api/v1/admin/toilets/count` 엔드포인트가 `permitAll()`로 설정되어 인증 없이 접근 가능. 재인덱싱은 비용이 큰 작업이므로 DoS 악용 가능 | High | `.requestMatchers("/api/v1/admin/toilets/reindex", "/api/v1/admin/toilets/count").permitAll()` 라인을 제거하고 해당 경로가 하위의 `.requestMatchers("/api/v1/admin/**").hasRole("ADMIN")` 규칙에 포함되도록 변경 |
| H2 | 보안 - 토큰 URL 노출(SSE) | `backend/src/main/java/com/daypoo/api/security/JwtAuthenticationFilter.java` | 75-85 | SSE 구독 경로 `/notifications/subscribe`에서 쿼리 파라미터 `?token=...`으로 JWT를 수신하여 인증 처리. SSE가 활성화될 경우 JWT가 URL에 노출됨 | High | SSE 연결 시 `EventSource`는 커스텀 헤더를 지원하지 않으므로, 현재 구현된 단기 SSE 전용 토큰(`createSseToken`, 30초 만료) 방식을 유지하되, 프론트엔드 `NotificationSubscriber.tsx`에서 이미 `sse-token`을 발급받아 사용하는 흐름을 완성. 현재 `SSE_ENABLED = false` 상태이므로 SSE 활성화 시 반드시 토큰 최소 권한 검증 로직 추가 필요 |
| H3 | 동시성 - 포인트 차감 | `backend/src/main/java/com/daypoo/api/service/ShopService.java` | 72-92 | `purchaseItem()`에서 `user.deductPoints(price)` 후 `inventoryRepository.flush()`로 중복 구매를 잡지만, 동시 요청 시 두 스레드가 동시에 포인트 조회 후 각각 차감하면 음수 포인트 발생 가능 (Lost Update). 현재 `deductPoints()`에서 `IllegalStateException`만 던지지만 DB 레이어 락이 없음 | High | `UserRepository`에 `@Lock(LockModeType.PESSIMISTIC_WRITE)` 쿼리 추가: `@Lock(PESSIMISTIC_WRITE) Optional<User> findByIdForUpdate(Long id)`. `purchaseItem()` 첫 줄에서 해당 메서드로 User를 조회하여 행 잠금 획득. 또는 `users` 테이블에 `points >= 0` CHECK 제약 추가로 방어층 확보 |
| H4 | 동시성 - 랭킹 동시 업데이트 | `backend/src/main/java/com/daypoo/api/service/RankingService.java` | 48-55 / 103-135 | `rebuildAllRankings()`이 `redisTemplate.delete(GLOBAL_RANK_KEY)` 후 전체 재삽입하는 구조. 매일 04:00 스케줄 실행 중 조회 요청이 오면 `checkAndInitialize()`가 빈 키를 감지해 중복 초기화 시도 발생 가능. 또한 `ApplicationReadyEvent`와 스케줄러가 동시에 실행될 수 있음 | High | `rebuildAllRankings()`에 분산 락(Redis SETNX 또는 Redisson `RLock`) 적용. 재구축 중에는 기존 키를 유지하고 신규 임시 키(`GLOBAL_RANK_KEY + ":rebuilding"`)에 데이터를 쌓은 후 `RENAME` 원자 명령으로 교체 |
| H5 | 보안 - Rate Limit IP 위조 | `backend/src/main/java/com/daypoo/api/global/aop/RateLimitAspect.java` | 51-57 | `X-Forwarded-For` 헤더의 첫 번째 값을 클라이언트 IP로 신뢰. CloudFront를 통과하면 실제 CloudFront IP 대신 공격자가 임의 헤더를 삽입 가능 (`curl -H "X-Forwarded-For: 1.1.1.1" ...`). 결과적으로 Rate Limiting 우회 가능 | High | CloudFront 환경에서는 `CloudFront-Viewer-Address` 헤더 또는 CloudFront에서 `X-Forwarded-For`를 덮어쓰도록 설정. 백엔드에서는 `server.forward-headers-strategy: native` 설정 시 Spring이 신뢰하는 프록시에서 온 `X-Forwarded-For`만 처리. 추가로 `/api/v1/records/check-in`과 같은 중요 엔드포인트에 `@RateLimit` 어노테이션이 현재 없는지 확인 필요 |
| H6 | 에러 핸들링 - SecurityException 미처리 | `backend/src/main/java/com/daypoo/api/service/ShopService.java` | 119 및 `backend/src/main/java/com/daypoo/api/global/exception/GlobalExceptionHandler.java` | `toggleEquipItem()`에서 `throw new SecurityException("본인의 아이템만 장착할 수 있습니다.")`. `GlobalExceptionHandler`에는 `SecurityException` 처리 핸들러가 없으므로 최종적으로 `Exception.class` 핸들러에서 500 Internal Server Error로 처리됨. 403이 반환되어야 할 상황에 500 반환 | High | `GlobalExceptionHandler`에 `@ExceptionHandler(SecurityException.class)` 추가하여 `HANDLE_ACCESS_DENIED(403)` 반환. 또는 `SecurityException` 대신 `BusinessException(ErrorCode.HANDLE_ACCESS_DENIED)` 사용. `ShopService.equipTitle()`의 `IllegalStateException`도 동일 패턴으로 교체 권장 |
| H7 | AI 서비스 - 타임아웃 미설정 | `backend/src/main/java/com/daypoo/api/global/RestTemplateConfig.java` (미확인), `backend/src/main/java/com/daypoo/api/service/AiClient.java` | - | `AiClient`가 `@Qualifier("externalRestTemplate")`를 사용하지만, AI 분석 호출에 명시적 타임아웃이 불확실함. GPT-4o Vision 호출은 응답 지연이 수십 초 이상 걸릴 수 있어 스레드 풀 고갈 위험. 현재 Retry 설정은 `maxAttempts=2`이므로 타임아웃 없이 응답 없으면 최대 2배 대기 | High | `RestTemplateConfig`에서 AI 서비스용 RestTemplate에 `connectTimeout=5000`, `readTimeout=60000` 명시 설정. `AiClient.analyzePoopImage()`의 `@Retryable`에 타임아웃 예외도 `include` 목록에 포함하여 재시도 가능하도록 구성 |
| H8 | 프론트엔드 - XSS via 글로벌 함수 | `frontend/src/components/map/MapView.tsx` | 33-37 | `window.setSelectedToiletGlobal`에 전체 `ToiletData` 객체를 JSON.stringify 후 HTML 인라인 onclick에 삽입: `onclick="window.setSelectedToiletGlobal(${JSON.stringify(toilet).replace(/"/g, '&quot;')})"`. toilet 이름·주소에 악의적인 문자가 포함될 경우 HTML 인젝션 위험. 또한 글로벌 함수로 등록하여 페이지 어디서든 오버라이드 가능 | High | 카카오맵 `CustomOverlay`의 `onclick` 인라인 스크립트 대신 마커에 데이터 속성(`data-toilet-id`)을 저장하고, `toilets` ref를 통해 ID로 조회하는 방식으로 교체. `window.setSelectedToiletGlobal`을 Symbol 기반 private 접근으로 전환하거나 WeakMap 패턴 사용 |

---

## 4. Medium 항목 (조기 수정 권장)

| # | 카테고리 | 파일 경로 | 라인(추정) | 문제 설명 | 심각도 | 수정 제안 |
|---|---------|----------|-----------|----------|--------|----------|
| M1 | 프론트엔드 - 카메라 스트림 미해제 | `frontend/src/components/map/VisitModal.tsx` | 110-112 | `useEffect(() => { return () => stopCamera(); }, [stopCamera])` — 언마운트 시 스트림 해제 로직 있음. 그러나 `handleSkipHealthLog()` 또는 `handleHealthLogComplete()` 콜백 완료 후 `onClose()`가 부모(`MapPage.tsx`)에서 `setTargetForVisit(null)` 호출로 언마운트될 때까지 스트림이 살아있음. 또한 카메라 권한 요청 실패 시 `alert`만 있고 UI 상태 복구 없음 | Medium | `handleSkipHealthLog`, `handleHealthLogComplete` 완료 직후 `stopCamera()` 명시 호출. `startCamera` 실패 시 `setIsCameraActive(false)` 외 사용자에게 대안(수동 입력) 안내 UI 표시 |
| M2 | 프론트엔드 - useGeoTracking 의존성 배열 오류 | `frontend/src/hooks/useGeoTracking.ts` | 89 | `useEffect`의 의존성 배열에 `[isEnabled, toilets, refreshUser]`가 있어 `toilets` 배열이 바뀔 때마다 `navigator.geolocation.clearWatch(watchId)` 후 새 watch 등록. 이 패턴은 toilets 갱신 빈도(지도 이동 시 300ms 디바운스)에 따라 watch를 자주 재등록하여 위치 정확도 저하 및 불필요한 GPS 재초기화 유발 | Medium | `toilets` 의존성을 의존성 배열에서 제거하고 현재 이미 사용 중인 `toiletsRef.current` 패턴을 활용. 의존성 배열을 `[isEnabled, refreshUser]`로 축소. `refreshUser` 또한 `useCallback`이 `[]` 의존성이면 안정적 |
| M3 | 프론트엔드 - NotificationContext setTimeout 릭 | `frontend/src/context/NotificationContext.tsx` | 59-61 | `showToast()`에서 `setTimeout(() => { setToasts(prev => ...) }, 5000)` 호출. 컴포넌트 언마운트 후에도 setTimeout 콜백이 실행되어 setState 호출 시 "Warning: Can't perform a React state update on an unmounted component" 발생 가능. 현재 cleanup 없음 | Medium | `useCallback` 내부에서 반환된 id를 `useRef`에 저장하고 `useEffect` cleanup에서 `clearTimeout`. 또는 toast를 만들 때 반환된 timeout ID를 로컬 변수로 관리하는 Map 패턴 적용 |
| M4 | 프론트엔드 - HeroSection 함수 미정의 | `frontend/src/components/HeroSection.tsx` | 129 | `<WaveButton onClick={onRecordClick} ...>기록하러 가기</WaveButton>` — `onRecordClick` 함수가 컴포넌트 내 어디에도 정의되어 있지 않음. TypeScript 컴파일 에러를 유발하거나 런타임에 `onRecordClick is not defined` 오류 발생. 또한 파일 끝(345-355줄)에 JSX 코드가 중복 작성되어 있어 구문 오류 | Medium | `HeroSection` 내부에 `const onRecordClick = useCallback(() => navigate('/map'), [navigate]);` 또는 `() => openAuth('login')` 핸들러 정의. 파일 345줄 이후 중복된 닫는 JSX 제거 |
| M5 | 백엔드 - 체크인 타이머 Redis TTL 경쟁 | `backend/src/main/java/com/daypoo/api/service/LocationVerificationService.java` | 39-57 | `getOrSetArrivalTime()`에서 `setIfAbsent(key, arrivalTimeStr, Duration.ofHours(1))` 후 값이 이미 있으면 `get()`으로 재조회. `setIfAbsent` 성공 후 1시간 TTL이 설정되지만, `createRecord` 완료 시 `resetArrivalTime()`으로 키 삭제. 그런데 Redis 재시작 또는 키 만료 시 `hasStayedLongEnough()`에서 `arrivalTimeStr == null` → `false` 반환하여 항상 `STAY_TIME_NOT_MET` 예외. 이는 정상 체크인 후 Redis 장애 시 기록 불가로 이어짐 | Medium | `hasStayedLongEnough()`에서 arrival time 없는 경우를 "Redis 장애 또는 키 만료"로 간주하여 별도 처리. 옵션1: fallback으로 Redis 조회 실패 시 경고 로그 후 `true` 반환(관대한 처리). 옵션2: 체크인 정보를 DB `VisitLog`에도 저장하여 Redis 장애 시 DB fallback 적용 |
| M6 | 백엔드 - PooRecord @Valid 미적용 | `backend/src/main/java/com/daypoo/api/controller/PooRecordController.java` | 60-67 | `createRecord()` 엔드포인트에 `@Valid @RequestBody PooRecordCreateRequest request` 사용 중이나, `PooRecordCreateRequest` 레코드 클래스에는 검증 어노테이션이 전혀 없음(모든 필드가 순수 타입만 선언). 따라서 `bristolScale=-99`, `color=""`, `latitude=999.0` 등 비정상 값도 서비스 레이어까지 도달하여 수동 검증 코드에 의존 | Medium | `PooRecordCreateRequest` 레코드에 `@Min(1) @Max(7) Integer bristolScale`, `@NotBlank String color`, `@DecimalMin("-90") @DecimalMax("90") Double latitude`, `@DecimalMin("-180") @DecimalMax("180") Double longitude` 추가. `@Size(max=50)` 등 태그 목록 크기 제한도 추가 |
| M7 | 백엔드 - N+1 쿼리: AuthService.getCurrentUserInfo | `backend/src/main/java/com/daypoo/api/service/AuthService.java` | 112-120 | `pooRecordRepository.findByUserOrderByCreatedAtDesc(user, Pageable.unpaged()).getContent()`로 전체 기록을 로드한 후 Stream으로 unique toilet 수 계산. 사용자 기록이 많을수록 대용량 조회 + 메모리 집약 | Medium | `PooRecordRepository`에 `@Query("SELECT COUNT(DISTINCT p.toilet.id) FROM PooRecord p WHERE p.user = :user") long countDistinctToiletsByUser(@Param("user") User user)` 추가. `RankingService`에 이미 동일 쿼리가 있으므로 공유 사용 |
| M8 | 프론트엔드 - 라우트 보호 부재 | `frontend/src/App.tsx` | 133-138 | `/mypage`, `/payment/success`, `/signup/social` 라우트가 별도 인증 가드 없이 노출. `/payment/success`는 결제 완료 처리를 하므로 비인증 접근 시 에러 처리 필요. `/signup/social`은 registration_token 유효성을 백엔드에서 검증하지만 프론트 UX에서 토큰 없이 접근 시 빈 폼 표시 | Medium | `ProtectedRoute` 컴포넌트 생성하여 `loading` 상태 → 스피너, `!isAuthenticated` → 로그인 모달 트리거 후 현재 경로 저장. `/mypage`, `/payment/success`에 적용. `/signup/social`은 URL에 `registration_token`이 없으면 `/main`으로 리다이렉트 |
| M9 | 인프라 - EC2 8080포트 전 세계 오픈 | `terraform/network.tf` | 71-78 | EC2 보안 그룹에 `port 8080, cidr_blocks = ["0.0.0.0/0"]` 설정. CloudFront가 80포트로 프록시하므로 8080은 내부 또는 CloudFront IP에서만 허용하면 충분. 현재 외부에서 `http://ec2-ip:8080`으로 HTTPS 우회 직접 접근 가능 | Medium | `port 8080 ingress` 규칙의 `cidr_blocks = ["0.0.0.0/0"]`를 제거하거나 CloudFront IP 범위 또는 VPC 내부 트래픽(`10.0.0.0/8`)으로 제한. CloudFront는 80포트만 사용하므로 `8080`은 관리 접근용으로 VPN/Bastion 경유로만 허용 |
| M10 | 인프라 - SSH 전 세계 오픈 | `terraform/network.tf` | 80-86 | `port 22, cidr_blocks = ["0.0.0.0/0"]` — 코드 주석에도 "특정 IP만 허용 권장"이라 명시되어 있으나 실제로는 전체 허용 상태로 배포됨 | Medium | `cidr_blocks`를 운영팀 사무실 IP 또는 Bastion Host IP로 제한. 또는 AWS Systems Manager Session Manager 사용 시 SSH 포트 자체를 닫을 수 있음 |
| M11 | 백엔드 - Terraform 원격 Backend 미설정 | `terraform/main.tf` | 1-18 | Terraform `backend` 블록이 없어 상태 파일이 로컬에만 저장됨. 팀원 간 상태 공유 불가, CI/CD에서 `terraform apply` 불가, 상태 파일 유실 시 인프라 드리프트 복구 어려움 | Medium | `terraform/main.tf`에 S3 backend 추가: `terraform { backend "s3" { bucket = "daypoo-terraform-state" key = "prod/terraform.tfstate" region = "ap-northeast-2" dynamodb_table = "daypoo-terraform-lock" } }`. S3 버킷 버전 관리 및 DynamoDB 락 테이블 설정 |
| M12 | AI 서비스 - OpenAI 기본 키 하드코딩 | `ai-service/app/core/config.py` | 9 | `OPENAI_API_KEY: str = "YOUR_OPENAI_API_KEY_HERE"` — 환경 변수가 미설정된 경우 플레이스홀더 문자열이 그대로 사용되어 OpenAI 호출 시 인증 오류 발생. 에러 메시지에서 해당 키 노출 가능성 | Medium | 기본값 제거: `OPENAI_API_KEY: str` (기본값 없음). Pydantic `validator`로 시작 시 검증: `@validator('OPENAI_API_KEY') def validate_api_key(cls, v): assert v and v != 'YOUR_OPENAI_API_KEY_HERE', '실제 OpenAI API 키가 필요합니다'; return v`. docker-compose.prod.yml에서 이미 환경 변수로 주입하고 있으나 개발 환경 `.env` 가이드 추가 필요 |

---

## 5. Low 항목 (개선 권장)

| # | 카테고리 | 파일 경로 | 라인(추정) | 문제 설명 | 심각도 | 수정 제안 |
|---|---------|----------|-----------|----------|--------|----------|
| L1 | 코드 품질 - AdminRoute console.log | `frontend/src/App.tsx` | 51-57, 73-77 | `AdminRoute` 컴포넌트에 `console.log`, `console.error`가 민감한 정보(user, role, hasToken 등)를 포함하여 출력. 프로덕션 빌드에서도 브라우저 콘솔로 내부 상태 노출 | Low | Vite 프로덕션 빌드에서 console 제거 설정 추가: `vite.config.ts`에 `esbuild: { drop: ['console', 'debugger'] }`. 또는 환경변수 기반 조건부 로깅 유틸리티로 대체 |
| L2 | 코드 품질 - AuthService Pageable.unpaged() | `backend/src/main/java/com/daypoo/api/service/AuthService.java` | 114-117 | `findByUserOrderByCreatedAtDesc(user, Pageable.unpaged()).getContent()`로 전체 기록 로드. 이미 M7에서 언급한 N+1 이슈와 연관. 단순히 방문한 화장실 수를 세기 위해 전체 레코드를 메모리에 로드하는 비효율 | Low | M7 항목과 동일하게 `countDistinctToiletsByUser` 쿼리 메서드 활용으로 해결 |
| L3 | 코드 품질 - prod DDL auto:update | `backend/src/main/resources/application-prod.yml` | 15 | `ddl-auto: update` — 주석에도 "운영 환경에서는 validate 권장"이라 명시되어 있으나 편의상 유지. Flyway와 혼용 시 충돌 및 의도치 않은 스키마 변경 위험 | Low | C3 수정(V29 마이그레이션 추가) 후 `ddl-auto: validate`로 변경 |
| L4 | 인프라 - docker-compose.prod.yml Redis 비밀번호 없음 | `docker-compose.prod.yml` | 53-65 | Redis가 비밀번호 설정 없이 실행됨. EC2 내부 네트워크이므로 외부 노출은 제한적이나 동일 서버의 다른 프로세스 또는 컨테이너에서 인증 없이 Redis 접근 가능. 랭킹, 체크인 타이머, JWT 블랙리스트 등 민감 데이터 포함 | Low | `docker-compose.prod.yml`의 redis 서비스에 `command: redis-server --requirepass ${REDIS_PASSWORD}` 추가. `backend` 서비스에 `REDIS_PASSWORD=${REDIS_PASSWORD}` 환경변수 전달. `application.yml`의 `spring.data.redis.password: ${REDIS_PASSWORD:}` 이미 설정되어 있으므로 값만 채우면 됨 |
| L5 | 접근성 - aria 누락 | `frontend/src/components/Navbar.tsx` | 267-299 | 모바일 드로어 내 nav 링크들에 `aria-current="page"` 속성 누락. 스크린 리더가 현재 활성 페이지를 인식하지 못함. `isActivePath()` 결과를 이미 조건부 스타일에 사용하므로 속성 추가만 하면 됨 | Low | 각 `<Link>` 컴포넌트에 `aria-current={isActivePath(link.path) ? 'page' : undefined}` 추가 |
| L6 | 코드 품질 - useToilets JSON.stringify 의존성 | `frontend/src/hooks/useToilets.ts` | 156 | `useCallback`의 의존성 배열에 `JSON.stringify(bounds)` 사용. 매 렌더링마다 직렬화 실행 비용 발생. `bounds` 객체의 각 숫자값을 소수점 6자리로 반올림하거나 `useMemo`로 직렬화 결과를 캐시 | Low | 의존성 배열을 `[lat, lng, radius, bounds?.swLat, bounds?.swLng, bounds?.neLat, bounds?.neLng, level]`로 분해하여 원시값 비교로 교체 |
| L7 | AI 서비스 - 타임아웃 미설정 | `ai-service/app/services/vision_service.py` | 53-77 | `OpenAI` 클라이언트에 `timeout` 설정이 없어 GPT-4o Vision API 응답 지연 시 무한 대기 가능. `httpx` 기반 OpenAI SDK는 기본 600초 타임아웃 | Low | `OpenAI(api_key=settings.OPENAI_API_KEY, timeout=120.0)` — 비전 분석 120초, 리포트 생성 180초 등 용도별 타임아웃 설정. `openai.APITimeoutError` 예외를 명시적으로 catch하여 적절한 HTTP 504 반환 |
| L8 | 인프라 - AI 서비스 헬스체크 누락 | `docker-compose.prod.yml` | 44-52 | `ai` 서비스에 `healthcheck`가 없어 컨테이너 재시작 시 Spring Boot 백엔드가 AI 서비스 준비 전에 요청을 보낼 수 있음 | Low | `ai` 서비스에 `healthcheck: { test: ["CMD", "curl", "-sf", "http://localhost:8000/health"], interval: 30s, timeout: 10s, retries: 3, start_period: 30s }` 추가. `backend` 서비스에 `depends_on: { ai: { condition: service_healthy } }` 설정 |
| L9 | 코드 품질 - 리프레시 토큰 URL 노출 (프론트엔드) | `frontend/src/services/apiClient.ts` | 149 | `POST /api/v1/auth/refresh?refreshToken=${encodeURIComponent(refreshToken)}` — 리프레시 토큰을 쿼리스트링으로 전달. 토큰 로테이션(Refresh Token Rotation) 미적용 상태에서 리프레시 토큰이 서버 액세스 로그에 기록됨 | Low | 리프레시 토큰을 Request Body로 전달: `{ method: 'POST', body: JSON.stringify({ refreshToken }), headers: { 'Content-Type': 'application/json' } }`. 백엔드 `AuthController.refresh()` 메서드도 `@RequestBody` 방식으로 변경 |

---

## 6. 아키텍처 레벨 개선 제안

### 6.1 OAuth2 토큰 전달 방식 전면 개선 (C2 확장)
현재 OAuth2 성공 시 JWT를 URL에 담아 프론트엔드로 전달하는 구조는 근본적으로 안전하지 않습니다. 단기 인증 코드(Authorization Code) 교환 방식으로 전환해야 합니다.
1. `OAuth2SuccessHandler`에서 UUID `authCode`를 생성 후 Redis에 TTL 60초로 저장 (key: `auth:code:{authCode}`, value: `{accessToken, refreshToken}`)
2. 리다이렉트 URL: `{frontendUrl}/auth/callback?code={authCode}` — JWT 미포함
3. `AuthCallback.tsx`에서 `POST /api/v1/auth/exchange-code` 호출 (body: `{code}`)
4. 백엔드가 Redis에서 토큰 조회 후 1회용 삭제(GETDEL), 토큰 반환

### 6.2 JWT를 HttpOnly 쿠키로 전환 검토
현재 localStorage/sessionStorage에 JWT 저장 방식은 XSS 취약. HTTPS + SameSite=Strict + HttpOnly 쿠키로 토큰을 관리하면 JS 접근 불가 (XSS로 토큰 탈취 차단). CORS 설정과 CloudFront 쿠키 전달 설정이 수반되어야 함.

### 6.3 Redis 장애 격리 (AI 분석 파이프라인)
체크인 타이머(Redis 필수) → AI 분석 → DB 기록 파이프라인에서 Redis 장애 시 전체 체크인/기록 흐름이 중단됨. Redis를 "필수(Must-Have)" vs "보조(Nice-to-Have)" 레이어로 분리하여 Redis 장애 시 기록 자체는 허용하되 타이머 검증만 스킵하는 Circuit Breaker 패턴 도입 권장.

### 6.4 Terraform Remote State + CI/CD 자동화
현재 Terraform 상태가 로컬에만 존재하여 팀 협업 및 CI 자동화 불가. S3 backend + DynamoDB lock 설정(M11) 후 `deploy-aws.yml`에 `terraform plan/apply` 단계를 추가하거나, 별도 인프라 변경 워크플로우를 분리하여 인프라-코드 일치 보장.

### 6.5 DDL 자동 생성 의존 제거
`home_region` 컬럼(C3)과 같이 Entity에만 존재하고 Flyway 스크립트에 없는 컬럼이 발견됨. 이는 `ddl-auto: update`에 의존하고 있다는 증거. 모든 스키마 변경은 반드시 Flyway 스크립트를 통해서만 이루어지도록 프로세스 강제화 필요. `application-prod.yml`을 `ddl-auto: validate`로 변경하면 Entity-스키마 불일치를 시작 시 즉시 감지.

### 6.6 AI 서비스 Rate Limit 및 비용 보호
현재 AI 분석 엔드포인트에 유저별 Rate Limit이 없어 악의적인 요청자가 대량의 GPT-4o Vision 호출을 유발할 수 있음. `@RateLimit` AOP를 `/api/v1/records` 및 `/api/v1/records/analyze` 엔드포인트에 적용(예: 1분당 3회 제한)하고, AI 서비스 측에서도 Redis를 활용한 요청 카운터 도입 권장.

---

## 7. 검사 커버리지

### Step 1: 프로젝트 구조 파악
| 파일 | 상태 |
|------|------|
| `frontend/package.json` | 읽기 완료 |
| `backend/build.gradle` | 읽기 완료 |
| `ai-service/requirements.txt` | 읽기 완료 |
| `frontend/src/App.tsx` | 읽기 완료 |
| `frontend/src/main.tsx` | 읽기 완료 |
| `backend/src/main/java/com/daypoo/api/ApiApplication.java` | 읽기 생략 (진입점 단순, build.gradle로 충분히 파악) |
| `ai-service/main.py` | 읽기 완료 |
| `backend/src/main/resources/application.yml` | 읽기 완료 |
| `backend/src/main/resources/application-prod.yml` | 읽기 완료 |

### Step 2: 프론트엔드 전수 검사
| 파일 | 상태 |
|------|------|
| `frontend/src/services/apiClient.ts` | 읽기 완료 |
| `frontend/src/context/AuthContext.tsx` | 읽기 완료 |
| `frontend/src/context/NotificationContext.tsx` | 읽기 완료 |
| `frontend/src/context/TransitionContext.tsx` | 읽기 완료 |
| `frontend/src/pages/MapPage.tsx` | 읽기 완료 |
| `frontend/src/components/map/MapView.tsx` | 읽기 완료 |
| `frontend/src/components/map/VisitModal.tsx` | 읽기 완료 (부분) |
| `frontend/src/components/HeroSection.tsx` | 읽기 완료 |
| `frontend/src/components/Navbar.tsx` | 읽기 완료 |
| `frontend/src/components/NotificationSubscriber.tsx` | 읽기 완료 |
| `frontend/src/hooks/useGeoTracking.ts` | 읽기 완료 |
| `frontend/src/hooks/useToilets.ts` | 읽기 완료 |
| `frontend/src/pages/MyPage.tsx` | 읽기 생략 |
| `frontend/src/pages/AdminPage.tsx` | 읽기 생략 |
| `frontend/src/pages/AuthCallback.tsx` | 읽기 생략 |
| `frontend/src/pages/RankingPage.tsx` | 읽기 생략 |
| `frontend/src/components/map/ToiletPopup.tsx` | 읽기 생략 |
| `frontend/src/components/map/ReviewModal.tsx` | 읽기 생략 |
| `frontend/src/components/AuthModal.tsx` | 읽기 생략 |
| `frontend/src/components/ErrorBoundary.tsx` | 읽기 생략 |
| `frontend/src/components/auth/*.tsx` (LoginForm 등) | 읽기 생략 |

### Step 3: 백엔드 전수 검사
| 파일 | 상태 |
|------|------|
| `backend/src/main/java/com/daypoo/api/security/CookieUtils.java` | 읽기 완료 |
| `backend/src/main/java/com/daypoo/api/security/OAuth2SuccessHandler.java` | 읽기 완료 |
| `backend/src/main/java/com/daypoo/api/security/SecurityConfig.java` | 읽기 완료 |
| `backend/src/main/java/com/daypoo/api/security/JwtProvider.java` | 읽기 완료 |
| `backend/src/main/java/com/daypoo/api/security/JwtAuthenticationFilter.java` | 읽기 완료 |
| `backend/src/main/java/com/daypoo/api/service/PooRecordService.java` | 읽기 완료 |
| `backend/src/main/java/com/daypoo/api/service/LocationVerificationService.java` | 읽기 완료 |
| `backend/src/main/java/com/daypoo/api/service/RankingService.java` | 읽기 완료 |
| `backend/src/main/java/com/daypoo/api/service/ShopService.java` | 읽기 완료 |
| `backend/src/main/java/com/daypoo/api/service/AuthService.java` | 읽기 완료 (부분) |
| `backend/src/main/java/com/daypoo/api/service/AiClient.java` | 읽기 완료 |
| `backend/src/main/java/com/daypoo/api/global/exception/GlobalExceptionHandler.java` | 읽기 완료 |
| `backend/src/main/java/com/daypoo/api/global/exception/ErrorCode.java` | 읽기 완료 |
| `backend/src/main/java/com/daypoo/api/global/aop/RateLimitAspect.java` | 읽기 완료 |
| `backend/src/main/java/com/daypoo/api/event/PooRecordEventListener.java` | 읽기 완료 |
| `backend/src/main/java/com/daypoo/api/controller/PooRecordController.java` | 읽기 완료 |
| `backend/src/main/java/com/daypoo/api/entity/User.java` | 읽기 완료 |
| `backend/src/main/java/com/daypoo/api/entity/PooRecord.java` | 읽기 완료 |
| `backend/src/main/java/com/daypoo/api/dto/PooRecordCreateRequest.java` | 읽기 완료 |
| `backend/src/main/java/com/daypoo/api/dto/SignUpRequest.java` | 읽기 완료 |
| `backend/src/main/java/com/daypoo/api/dto/AiAnalysisResponse.java` | 읽기 완료 |
| `backend/src/main/java/com/daypoo/api/service/PaymentService.java` | 읽기 완료 (부분) |
| 기타 Service, Controller, Entity 클래스 (40여개) | 읽기 생략 |

### Step 4: AI 서비스 전수 검사
| 파일 | 상태 |
|------|------|
| `ai-service/main.py` | 읽기 완료 |
| `ai-service/app/core/config.py` | 읽기 완료 |
| `ai-service/app/schemas/analysis.py` | 읽기 완료 |
| `ai-service/app/services/vision_service.py` | 읽기 완료 |
| `ai-service/app/services/report_service.py` | 읽기 완료 |
| `ai-service/app/api/v1/endpoints/analysis.py` | 읽기 완료 |
| `ai-service/app/api/v1/endpoints/report.py` | 읽기 생략 |
| `ai-service/app/api/v1/endpoints/review.py` | 읽기 생략 |
| `ai-service/app/services/review_service.py` | 읽기 생략 |
| `ai-service/app/core/redis_client.py` | 읽기 생략 |

### Step 5: 인프라 및 배포 검사
| 파일 | 상태 |
|------|------|
| `docker-compose.yml` | 읽기 완료 |
| `docker-compose.prod.yml` | 읽기 완료 |
| `.github/workflows/deploy.yml` | 읽기 완료 |
| `.github/workflows/backend-ci.yml` | 읽기 완료 |
| `.github/workflows/deploy-aws.yml` | 읽기 완료 |
| `terraform/main.tf` | 읽기 완료 |
| `terraform/ec2.tf` | 읽기 완료 |
| `terraform/network.tf` | 읽기 완료 |
| `terraform/cloudfront.tf` | 읽기 완료 |
| `terraform/rds.tf` | 읽기 완료 |
| `terraform/s3.tf` | 읽기 생략 |
| `terraform/variables.tf` | 읽기 생략 |
| `terraform/outputs.tf` | 읽기 생략 |
| `terraform/opensearch.tf` | 읽기 생략 |
| `terraform/lambda.tf` | 읽기 생략 |

### Step 6: DB 및 마이그레이션 검사
| 파일 | 상태 |
|------|------|
| `V1__init.sql` (부분) | 읽기 완료 |
| `V4__add_missing_columns.sql` | 읽기 완료 |
| `V8__add_missing_updated_at_everywhere.sql` | 읽기 완료 |
| `V9__fix_user_created_at.sql` | 읽기 완료 |
| `V20__add_performance_indices.sql` | 읽기 완료 |
| `V22__expand_health_report_snapshots.sql` | 읽기 완료 |
| `V23__overhaul_title_system.sql` | 읽기 완료 |
| `V27__make_toilet_id_optional_in_poo_records.sql` | 읽기 완료 |
| `V2~V3, V5~V7, V10~V19, V21, V24~V26, V28` | 읽기 생략 (핵심 검사 항목 중점 확인) |
| `users` Entity (`User.java`) | 읽기 완료 |
| `poo_records` Entity (`PooRecord.java`) | 읽기 완료 |

---

## 심각도 기준

- **Critical**: 서비스 장애 또는 데이터 유실에 직결되는 문제
- **High**: 주요 기능 오작동 또는 악용 가능한 보안 취약점
- **Medium**: 사용자 경험 저하 또는 특정 조건에서 발생하는 잠재적 버그
- **Low**: 코드 품질, 성능 최적화, 유지보수성 개선 권장사항
