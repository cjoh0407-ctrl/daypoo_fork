# DayPoo 프로젝트 종합 리팩토링 실행 계획

## Context
Spring Boot 3.4 + React 19 기반의 배변 기록/건강 관리 앱. 전체 아키텍처는 양호하나, 보안 취약점(CORS 와일드카드, 토큰 관리 미흡, .env 노출), Controller 계층 오염, API 통신 레이어 부실, 거대 컴포넌트 문제 등이 발견됨. 프로덕션 배포 전 단계별 리팩토링이 필요.

---

# 단기 (즉시 수정) — 보안 취약점 및 치명적 로직 오류

---

## [백엔드 1] CORS 와일드카드 제거

**파일**: `backend/src/main/java/com/daypoo/api/security/SecurityConfig.java`

**AS-IS** (93-104번 줄):
```java
config.setAllowedOriginPatterns(List.of("*"));
config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
config.setAllowedHeaders(List.of("*"));
config.setAllowCredentials(true);
```

**TO-BE**:
```java
@Value("${app.cors.allowed-origins}")
private List<String> allowedOrigins;

// corsConfigurationSource() 내부
config.setAllowedOrigins(allowedOrigins);
config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Correlation-Id"));
config.setExposedHeaders(List.of("Authorization"));
config.setAllowCredentials(true);
```

`application.yml`에 추가:
```yaml
app:
  cors:
    allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:5173}
```

---

## [백엔드 2] Controller에서 Repository 직접 접근 제거

**문제**: NotificationController, ShopController, SupportController, ReportController, HealthReportController에서 `getUserByEmail()` 헬퍼가 UserRepository를 직접 호출.

**AS-IS** (`NotificationController.java` 72-76번 줄):
```java
// Controller 내부
@Autowired private UserRepository userRepository;

private User getUserByEmail(String email) {
    return userRepository.findByEmail(email)
        .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
}
```

**TO-BE**: 공통 UserService 메서드로 위임
```java
// UserService.java (신규 또는 AuthService에 추가)
@Transactional(readOnly = true)
public User getByEmail(String email) {
    return userRepository.findByEmail(email)
        .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
}

// Controller에서는 해당 Service만 주입
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;
    private final UserService userService; // Repository 대신 Service
}
```

**대상 파일** (5개 Controller 모두 동일 패턴 적용):
- `NotificationController.java`
- `ShopController.java`
- `SupportController.java`
- `ReportController.java`
- `HealthReportController.java`

---

## [백엔드 3] 예외 타입 통일

**문제**: 일부 Service/Controller에서 `IllegalArgumentException`을 사용하여 GlobalExceptionHandler의 `BusinessException` 체계를 우회.

**AS-IS** (`NotificationService.java` 109번 줄):
```java
throw new IllegalArgumentException("존재하지 않는 알림입니다.");
```

**TO-BE**:
```java
throw new BusinessException(ErrorCode.ENTITY_NOT_FOUND);
```

**대상 파일**:
- `NotificationService.java` (109, 130번 줄)
- `HealthReportController.java` (28번 줄)

추가로 `GlobalExceptionHandler.java`에 누락된 예외 핸들러 보강:
```java
@ExceptionHandler(DataIntegrityViolationException.class)
protected ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException e) {
    log.error("DB constraint violation", e);
    return new ResponseEntity<>(ErrorResponse.of(ErrorCode.DUPLICATE_KEY), HttpStatus.CONFLICT);
}

@ExceptionHandler(HttpMessageNotReadableException.class)
protected ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException e) {
    log.error("Malformed request body", e);
    return new ResponseEntity<>(ErrorResponse.of(ErrorCode.INVALID_INPUT_VALUE), HttpStatus.BAD_REQUEST);
}
```

---

## [백엔드 4] PooRecordController 경로 오타 수정

**파일**: `PooRecordController.java` (26번 줄)

**AS-IS**:
```java
@RequestMapping({"/api/v1/records", "/api/v1/api/v1/records"})
```

**TO-BE**:
```java
@RequestMapping("/api/v1/records")
```

---

## [백엔드 5] 위치 검증 dev mode 제거

**파일**: `PooRecordService.java` (99-122번 줄)

**AS-IS**:
```java
if (!isNear) {
    log.warn("User {} is outside radius for toilet {}. Proceeding anyway (dev mode).", email, request.toiletId());
    // 실제 거부 없이 통과
}
```

**TO-BE**:
```java
if (!isNear) {
    throw new BusinessException(ErrorCode.OUT_OF_RANGE);
}
```

---

## [백엔드 6] JWT 쿼리 파라미터 토큰 제거

**파일**: `JwtAuthenticationFilter.java` (54-57번 줄)

**AS-IS**:
```java
String tokenParam = request.getParameter("token");
if (StringUtils.hasText(tokenParam)) {
    return tokenParam;
}
```

**TO-BE**: SSE 엔드포인트만 예외적 허용, 나머지는 Header만 사용
```java
// SSE 엔드포인트만 query param 허용
String path = request.getRequestURI();
if (path.contains("/notifications/subscribe")) {
    String tokenParam = request.getParameter("token");
    if (StringUtils.hasText(tokenParam)) {
        return tokenParam;
    }
}
// 그 외는 Authorization 헤더만 사용
```

---

## [프론트엔드 1] 카메라 타이밍 버그 수정

**파일**: `frontend/src/components/map/VisitModal.tsx`

**AS-IS** (56-67번 줄): `videoRef.current`가 null이라 스트림 할당 불가
```typescript
const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({...});
    if (videoRef.current) {       // ← null! video 요소가 아직 DOM에 없음
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);  // ← 호출 안 됨
    }
};
```

**TO-BE**:
```typescript
const streamRef = useRef<MediaStream | null>(null);

const startCamera = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }, audio: false,
        });
        streamRef.current = stream;
        setIsCameraActive(true);  // 먼저 DOM에 video 마운트
    } catch (err) {
        console.error('카메라 시작 실패:', err);
        alert('카메라 권한이 필요합니다.');
    }
};

// video 마운트 후 스트림 연결
useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
    }
}, [isCameraActive]);

const stopCamera = useCallback(() => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
}, []);
```

---

## [프론트엔드 2] 에러 처리 — 한글 텍스트 매칭 제거

**파일**: `frontend/src/pages/MapPage.tsx` (171-212번 줄)

**AS-IS**:
```typescript
if (msg.includes('1분') || msg.includes('체류')) {
    alert('⏳ 아직 1분이 지나지 않았습니다...');
} else if (msg.includes('반경') || msg.includes('거리')) {
    alert('📍 화장실 근처에서만 인증이 가능합니다...');
}
```

**TO-BE**: 백엔드 ErrorCode 기반 처리
```typescript
// 백엔드 ErrorResponse에 code 필드 활용
} catch (err: any) {
    const code = err?.code || 'UNKNOWN';
    switch (code) {
        case 'STAY_TIME_NOT_MET':
            alert('⏳ 아직 1분이 지나지 않았습니다.');
            break;
        case 'OUT_OF_RANGE':
            alert('📍 화장실 근처(150m 이내)에서만 인증이 가능합니다.');
            break;
        default:
            alert(err?.message || '오류가 발생했습니다.');
    }
}
```

백엔드 `ErrorResponse`에 `code` 필드가 이미 있으므로, `apiClient.ts`에서 error 객체에 code를 포함시킴:
```typescript
// apiClient.ts throw 부분
const error = new Error(data.message || '요청 처리에 실패했습니다.');
(error as any).code = data.code;
throw error;
```

---

## [프론트엔드 3] SSE 토큰 URL 노출 개선

**파일**: `frontend/src/components/NotificationSubscriber.tsx`

**AS-IS** (14번 줄):
```typescript
const eventSource = new EventSource(
    `${BASE_URL}/api/v1/notifications/subscribe?token=${token}`
);
```

현재 EventSource API는 커스텀 헤더를 지원하지 않으므로 query param은 불가피하지만, SSE 전용 단기 토큰을 사용하도록 개선:
```typescript
// 1단계: SSE 전용 단기 토큰 발급
const { sseToken } = await api.post('/notifications/sse-token');
const eventSource = new EventSource(
    `${BASE_URL}/api/v1/notifications/subscribe?token=${sseToken}`
);
```

백엔드에서 SSE 전용 토큰 (유효기간 30초)을 발급하는 엔드포인트 추가.

추가로, **자동 재연결** 로직 추가:
```typescript
eventSource.onerror = () => {
    eventSource.close();
    setTimeout(() => {
        // 재연결 로직
    }, 3000);
};
```

---

# 중기 (구조 개선) — 계층 분리, 코드 중복 제거, API 연동 구조화

---

## [백엔드 7] 외부 API 클라이언트 추상화

**문제**: AiClient, GeocodingService, PaymentService, PublicDataSyncService 모두 RestTemplate을 직접 사용. 재시도/타임아웃/서킷브레이커 일관성 없음.

**AS-IS** (`AiClient.java`):
```java
return restTemplate.postForObject(url, entity, AiAnalysisResponse.class);
// 타임아웃 없음, 재시도 없음
```

**TO-BE**: 공통 외부 API 호출 인프라 구성
```java
// 1. 외부 API 전용 RestTemplate 빈 (타임아웃 설정)
@Configuration
public class ExternalApiConfig {
    @Bean("externalRestTemplate")
    public RestTemplate externalRestTemplate() {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(30));
        return new RestTemplate(factory);
    }
}

// 2. AiClient에 재시도 + 타임아웃 적용
@Retryable(maxAttempts = 2, backoff = @Backoff(delay = 1000))
public AiAnalysisResponse analyzePoopImage(String base64Image) {
    // ...
}
```

**대상 파일**:
- `AiClient.java` — 타임아웃 + @Retryable 추가
- `GeocodingService.java` — 동일 RestTemplate 빈 사용
- `PaymentService.java` — 결제는 재시도 불가, 타임아웃만 적용

---

## [백엔드 8] 토큰 블랙리스트 구현 (로그아웃)

**파일**: `AuthService.java` (215-217번 줄)

**AS-IS**:
```java
@Transactional
public void logout(String email) {
    // 빈 구현
}
```

**TO-BE**:
```java
@Transactional
public void logout(String email, String accessToken) {
    // Access Token의 남은 유효 시간 계산
    long expiration = jwtProvider.getExpiration(accessToken);
    // Redis에 블랙리스트 등록 (TTL = 남은 만료 시간)
    redisTemplate.opsForValue().set(
        "blacklist:" + accessToken, "logout",
        expiration, TimeUnit.MILLISECONDS
    );
}
```

`JwtAuthenticationFilter`에 블랙리스트 검사 추가:
```java
if (token != null && jwtProvider.validateToken(token)) {
    // 블랙리스트 확인
    Boolean isBlacklisted = redisTemplate.hasKey("blacklist:" + token);
    if (Boolean.TRUE.equals(isBlacklisted)) {
        filterChain.doFilter(request, response);
        return;
    }
    // ... 기존 인증 로직
}
```

---

## [백엔드 9] DB 인덱스 추가

**파일**: `backend/src/main/resources/schema.sql`

현재 PostGIS GIST 인덱스만 존재. 아래 인덱스 추가:
```sql
-- 로그인 쿼리 최적화 (가장 빈번한 쿼리)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);

-- 사용자별 기록 페이지네이션
CREATE INDEX IF NOT EXISTS idx_poo_records_user_created ON poo_records(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_poo_records_toilet ON poo_records(toilet_id);

-- 미읽음 알림 조회
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- 결제 내역
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);

-- 인벤토리 조회
CREATE INDEX IF NOT EXISTS idx_inventories_user ON inventories(user_id, item_id);
```

---

## [백엔드 10] N+1 쿼리 방지 — Fetch Join 적용

**파일들**: 각 Repository

**AS-IS** (`NotificationRepository.java`):
```java
List<Notification> findAllByUserOrderByCreatedAtDesc(User user);
```

**TO-BE**:
```java
@Query("SELECT n FROM Notification n JOIN FETCH n.user WHERE n.user = :user ORDER BY n.createdAt DESC")
List<Notification> findAllByUserOrderByCreatedAtDesc(@Param("user") User user);
```

동일 패턴 적용 대상:
- `PooRecordRepository` — record 조회 시 toilet JOIN FETCH
- `InventoryRepository` — inventory 조회 시 item JOIN FETCH

---

## [프론트엔드 4] API 클라이언트 타입 안전성 확보

**파일**: `frontend/src/services/apiClient.ts`

**AS-IS**:
```typescript
const BASE_URL = '/api/v1';

const getHeaders = () => {
    const token = localStorage.getItem('accessToken');
    // ... any 타입 반환
};

export const api = {
    get: async (url: string) => { /* returns any */ },
    post: async (url: string, body: any) => { /* returns any */ },
};
```

**TO-BE**: 제네릭 기반 + 에러코드 전파 + 토큰 리프레시
```typescript
interface ApiError extends Error {
    code: string;
    status: number;
}

class ApiClient {
    private baseUrl = '/api/v1';

    private async request<T>(method: string, url: string, body?: unknown): Promise<T> {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${this.baseUrl}${url}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            ...(body && { body: JSON.stringify(body) }),
        });

        if (res.status === 401) {
            const refreshed = await this.tryRefreshToken();
            if (refreshed) return this.request<T>(method, url, body);
            window.location.href = '/';
            throw new Error('인증이 만료되었습니다.');
        }

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            const error = new Error(data.message || '요청 실패') as ApiError;
            error.code = data.code || 'UNKNOWN';
            error.status = res.status;
            throw error;
        }

        const text = await res.text();
        return text ? JSON.parse(text) : ({} as T);
    }

    get<T>(url: string) { return this.request<T>('GET', url); }
    post<T>(url: string, body?: unknown) { return this.request<T>('POST', url, body); }
    put<T>(url: string, body?: unknown) { return this.request<T>('PUT', url, body); }
    delete<T>(url: string) { return this.request<T>('DELETE', url); }

    private async tryRefreshToken(): Promise<boolean> {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) return false;
        try {
            const res = await fetch(`${this.baseUrl}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });
            if (!res.ok) return false;
            const data = await res.json();
            localStorage.setItem('accessToken', data.accessToken);
            return true;
        } catch {
            return false;
        }
    }
}

export const api = new ApiClient();
```

---

## [프론트엔드 5] 거대 컴포넌트 분리

### MapPage.tsx (437줄) → 3개 컴포넌트로 분리

```
MapPage.tsx (메인 오케스트레이터, ~150줄)
├── components/map/MapView.tsx (카카오맵 초기화 + 마커 관리, ~150줄)
├── components/map/ToiletSearchBar.tsx (검색 + 필터, ~80줄)
└── components/map/VisitModal.tsx (기존 유지)
```

### AuthModal.tsx (877줄) → 4개 컴포넌트로 분리

```
AuthModal.tsx (모달 셸 + 상태 관리, ~150줄)
├── components/auth/LoginForm.tsx (~120줄)
├── components/auth/SignupForm.tsx (~200줄)
├── components/auth/SocialLoginButtons.tsx (~80줄)
└── components/auth/TermsAgreement.tsx (~100줄)
```

---

## [프론트엔드 6] 불필요한 의존성 제거

```bash
npm uninstall axios zustand  # 설치되어 있으나 미사용
```

---

# 장기 (기능 확장 및 안정화) — 성능 최적화, AOP 도입, 유지보수성 확보

---

## [백엔드 11] AOP 기반 공통 관심사 분리

### 로깅 AOP
```java
@Aspect
@Component
@Slf4j
public class ServiceLoggingAspect {

    @Around("execution(* com.daypoo.api.service.*.*(..))")
    public Object logServiceMethod(ProceedingJoinPoint joinPoint) throws Throwable {
        String method = joinPoint.getSignature().toShortString();
        log.info("[SERVICE] Start: {}", method);
        long start = System.currentTimeMillis();
        try {
            Object result = joinPoint.proceed();
            log.info("[SERVICE] End: {} ({}ms)", method, System.currentTimeMillis() - start);
            return result;
        } catch (Exception e) {
            log.error("[SERVICE] Error: {} - {}", method, e.getMessage());
            throw e;
        }
    }
}
```

### Rate Limiting AOP (로그인/회원가입)
```java
@Aspect
@Component
public class RateLimitAspect {

    @Around("@annotation(rateLimit)")
    public Object checkRateLimit(ProceedingJoinPoint joinPoint, RateLimit rateLimit)
            throws Throwable {
        String key = resolveKey(joinPoint, rateLimit);
        Long count = redisTemplate.opsForValue().increment("rate:" + key);
        if (count != null && count > rateLimit.maxAttempts()) {
            throw new BusinessException(ErrorCode.TOO_MANY_REQUESTS);
        }
        if (count != null && count == 1) {
            redisTemplate.expire("rate:" + key, rateLimit.windowSeconds(), TimeUnit.SECONDS);
        }
        return joinPoint.proceed();
    }
}

// 사용 예시
@RateLimit(maxAttempts = 5, windowSeconds = 300)
public LoginResponse login(LoginRequest request) { ... }
```

---

## [백엔드 12] SSE 분산 환경 대응 (Redis Pub/Sub)

**AS-IS** (`NotificationService.java` 27번 줄):
```java
private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();
```

**TO-BE**: Redis Pub/Sub으로 인스턴스 간 알림 전파
```java
@Service
public class NotificationService {
    private final Map<Long, SseEmitter> localEmitters = new ConcurrentHashMap<>();
    private final RedisMessageListenerContainer listenerContainer;
    private final RedisTemplate<String, String> redisTemplate;

    public void send(Long userId, NotificationDto dto) {
        // 1. DB 저장
        notificationRepository.save(notification);
        // 2. Redis 채널로 발행 (모든 인스턴스가 수신)
        redisTemplate.convertAndSend("notifications:" + userId, objectMapper.writeValueAsString(dto));
    }

    // Redis 메시지 수신 → 로컬 SSE emitter로 전달
    @PostConstruct
    public void subscribeToRedis() {
        // MessageListener 등록
    }
}
```

---

## [백엔드 13] ddl-auto 제거 + Flyway 마이그레이션 도입

**AS-IS** (`application.yml`):
```yaml
jpa:
  hibernate:
    ddl-auto: update
```

**TO-BE**:
```yaml
jpa:
  hibernate:
    ddl-auto: validate  # 스키마 검증만

spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
```

`backend/src/main/resources/db/migration/V1__init.sql`에 현재 schema.sql 내용 이관.

---

## [프론트엔드 7] 성능 최적화

### 마커 렌더링 최적화 (MapPage)
```typescript
// AS-IS: filteredToilets 변경 시 전체 마커 재계산
useEffect(() => {
    // 모든 마커 순회...
}, [filteredToilets, mapLoaded]);

// TO-BE: diff 기반 업데이트
useEffect(() => {
    const prev = prevToiletsRef.current;
    const next = new Map(filteredToilets.map(t => [t.id, t]));
    // 추가된 것만 마커 생성
    // 제거된 것만 마커 삭제
    // 유지되는 것은 건드리지 않음
    prevToiletsRef.current = next;
}, [filteredToilets]);
```

### Vite 빌드 최적화 (`vite.config.js`)
```javascript
build: {
    rollupOptions: {
        output: {
            manualChunks: {
                vendor: ['react', 'react-dom', 'react-router-dom'],
                ui: ['framer-motion', 'lucide-react'],
                chart: ['recharts'],
            },
        },
    },
},
```

---

## [프론트엔드 8] API 응답 타입 정의

**파일**: `frontend/src/types/api.ts` (신규)
```typescript
// 공통 응답
interface ApiResponse<T> {
    data: T;
    message?: string;
    code?: string;
}

// 각 엔드포인트별 타입
interface LoginResponse { accessToken: string; refreshToken: string; }
interface UserResponse { email: string; nickname: string; role: string; points: number; level: number; exp: number; }
interface ToiletSearchResponse { toilets: ToiletData[]; }
interface PooRecordResponse { id: number; bristolType: number; color: string; /* ... */ }

// 사용 예시
const user = await api.get<UserResponse>('/auth/me');
```

---

# 검증 방법

## 단기 수정 검증
1. CORS: 브라우저 DevTools Network 탭에서 preflight 요청의 `Access-Control-Allow-Origin` 헤더가 특정 도메인인지 확인
2. 카메라: 모바일 브라우저에서 방문인증 모달 → "카메라 실행하기" → 카메라 화면 표시 확인
3. 예외 통일: 존재하지 않는 알림 ID로 API 호출 → `BusinessException` 형태의 JSON 응답 확인
4. 경로 오타: `/api/v1/api/v1/records` 요청 시 404 반환 확인

## 중기 수정 검증
5. 토큰 블랙리스트: 로그아웃 후 기존 accessToken으로 API 호출 → 401 반환
6. API 클라이언트: 401 발생 시 자동 토큰 리프레시 → 재요청 성공
7. DB 인덱스: `EXPLAIN ANALYZE`로 findByEmail 쿼리 플랜 확인 (Seq Scan → Index Scan)

## 장기 수정 검증
8. AOP 로깅: Service 메서드 호출 시 로그 출력 확인
9. Rate Limiting: 로그인 5회 실패 후 6회째 → 429 Too Many Requests
10. Flyway: `./gradlew bootRun` 시 마이그레이션 자동 적용 확인

---

# 수정 대상 파일 요약

| 우선순위 | 영역 | 파일 |
|---------|------|------|
| 단기 | BE | `SecurityConfig.java`, `application.yml` |
| 단기 | BE | `NotificationController.java`, `ShopController.java`, `SupportController.java`, `ReportController.java`, `HealthReportController.java` |
| 단기 | BE | `NotificationService.java`, `GlobalExceptionHandler.java` |
| 단기 | BE | `PooRecordController.java`, `PooRecordService.java` |
| 단기 | BE | `JwtAuthenticationFilter.java` |
| 단기 | FE | `VisitModal.tsx` |
| 단기 | FE | `MapPage.tsx`, `apiClient.ts` |
| 단기 | FE | `NotificationSubscriber.tsx` |
| 중기 | BE | `AiClient.java`, `AuthService.java`, `JwtAuthenticationFilter.java` |
| 중기 | BE | `schema.sql` |
| 중기 | BE | `NotificationRepository.java`, `PooRecordRepository.java` |
| 중기 | FE | `apiClient.ts` (전면 리팩토링) |
| 중기 | FE | `MapPage.tsx`, `AuthModal.tsx` (분리) |
| 장기 | BE | 신규: `ServiceLoggingAspect.java`, `RateLimitAspect.java` |
| 장기 | BE | `NotificationService.java` (Redis Pub/Sub) |
| 장기 | BE | `application.yml` (Flyway) |
| 장기 | FE | `vite.config.js`, 신규: `types/api.ts` |
