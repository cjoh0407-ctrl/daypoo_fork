# DayPoo 아키텍처 및 성능 진단 보고서 작성 계획

## Context

DayPoo 프로젝트(React 프론트엔드 + Spring Boot 백엔드 + Python AI 서비스)에서 **서버 구동 지연** 및 **데이터 파이프라인 연동 불안정성** 문제가 발생 중. 프로젝트 전체를 분석하여 발견된 오류/병목을 프론트엔드와 백엔드로 구분한 진단 보고서를 `docs/diagnosis-report.md`에 작성한다.

---

## 작업 내용

`docs/diagnosis-report.md` 파일 1개를 생성한다. (docs/ 디렉토리는 이미 존재)

### 보고서 구조

#### 1. 프로젝트 개요
- 3-tier 아키텍처 설명 (React + Spring Boot + FastAPI)
- 기술 스택 요약

#### 2. 오류 및 병목 체크리스트 (Checklist)

**백엔드 (10항목):**

| # | 이슈 | 파일 | 심각도 |
|---|------|------|--------|
| B1 | `createRecord()` 동기 병목 - AI 분석, Geocoding, 랭킹, 칭호 처리가 모두 동기적 | `PooRecordService.java:87-134` | 높음 |
| B2 | `purchaseItem()` Race Condition - exists 체크 후 save 사이 경합 | `ShopService.java:48-63` | 높음 |
| B3 | `toggleEquipItem()` 메모리 필터링 - `findAllByUser()` 후 stream filter | `ShopService.java:83-106` | 중간 |
| B4 | 리뷰 통계 이중 쿼리 - COUNT + AVG 별도 실행 | `ToiletReviewService.java` | 중간 |
| B5 | AI 요약 동기 호출 - 리뷰 5개 이상 시 동기적 AI API 호출 | `ToiletReviewService.java` | 중간 |
| B6 | SSE 단일 인스턴스 - ConcurrentHashMap 기반, 분산 환경 미지원 | `NotificationService.java` | 중간 |
| B7 | `@EnableAsync` 스레드풀 미설정 - SimpleAsyncTaskExecutor 기본 사용 | `ApiApplication.java` | 중간 |
| B8 | ServiceLoggingAspect 전체 추적 - 모든 Service 메서드 INFO 로깅 | `ServiceLoggingAspect.java` | 낮음 |
| B9 | AI 서비스 CORS `allow_origins=["*"]` | `ai-service/main.py` | 보안 |
| B10 | DB 인덱스 부족 - toilet_reviews, inventories 복합 인덱스 없음 | 마이그레이션 | 중간 |

**프론트엔드 (7항목):**

| # | 이슈 | 파일 | 심각도 |
|---|------|------|--------|
| F1 | fetch 타임아웃 미설정 - AbortController 미사용, 무한 대기 가능 | `apiClient.ts:24-28` | 높음 |
| F2 | 재시도 로직 부재 - 5xx/네트워크 에러 시 자동 재시도 없음 | `apiClient.ts` | 높음 |
| F3 | 토큰 리프레시 경쟁 상태 - 다수 401 동시 발생 시 중복 리프레시 | `apiClient.ts:30-45` | 높음 |
| F4 | SSE 재연결 무한 루프 - 최대 재시도 횟수 없음, 고정 5초 간격 | `NotificationSubscriber.tsx:56-64` | 중간 |
| F5 | 캐싱 메커니즘 부재 - React Query/SWR 미도입 | `package.json` | 중간 |
| F6 | `VITE_API_URL` 미정의 - .env에 없으나 SSE 코드에서 참조 | `.env`, `NotificationSubscriber.tsx:23` | 낮음 |
| F7 | 에러 추적 서비스 부재 - console.error만 사용 | 전체 | 낮음 |

**인프라 (3항목):**

| # | 이슈 | 심각도 |
|---|------|--------|
| I1 | 백엔드 CI/CD 파이프라인 없음 | 중간 |
| I2 | Redis 단일 인스턴스, 비밀번호/영속성 미설정 | 중간 |
| I3 | APM/모니터링 부재 | 낮음 |

#### 3. 단계별 개선 계획 (Action Plan)

**Phase 1: 긴급 버그 수정 (1~2주)**
- F1: `apiClient.ts`에 AbortController 기반 타임아웃 추가 (코드 예시 포함)
- F3: 토큰 리프레시 뮤텍스 패턴 구현 (코드 예시 포함)
- F4: SSE 지수 백오프 + 최대 재시도 10회 (코드 예시 포함)
- B2: Flyway 마이그레이션으로 `inventories(user_id, item_id)` UNIQUE 제약 추가 + DataIntegrityViolationException 처리 (코드 예시 포함)
- F6: `.env`에 `VITE_API_URL` 추가

**Phase 2: 성능 최적화 (2~3주)**
- B1: `AsyncConfig.java` 생성 + `applyPostSaveEffects()` 비동기화 (코드 예시 포함)
- B7: ThreadPoolTaskExecutor 빈 정의 (core=5, max=20, queue=100)
- B3: SQL 쿼리로 필터링 이동 (코드 예시 포함)
- B4: COUNT + AVG 단일 쿼리로 통합 (코드 예시 포함)
- B5: AI 요약 `@Async` 전환
- B10: 성능 인덱스 마이그레이션 SQL (코드 포함)
- B8: 로그 레벨 DEBUG 전환 또는 조건부 로깅

**Phase 3: 프론트엔드 아키텍처 개선 (2~3주)**
- F2: apiClient에 지수 백오프 재시도 래퍼 추가 (코드 예시 포함)
- F5: TanStack Query 도입 + useQuery/useMutation 리팩토링
- F7: Sentry 도입

**Phase 4: 인프라 강화 (3~4주)**
- B9: AI 서비스 CORS 제한
- I1: GitHub Actions 백엔드 CI/CD 워크플로우
- I2: Redis 보안/영속성 설정
- I3: Spring Boot Actuator + Prometheus 설정

#### 4. 예상 성능 개선 효과
- 개선 전/후 비교 테이블

### 핵심 수정 대상 파일

- `backend/src/main/java/com/daypoo/api/service/PooRecordService.java` - 비동기 리팩토링
- `frontend/src/services/apiClient.ts` - 타임아웃, 재시도, 토큰 뮤텍스
- `backend/src/main/java/com/daypoo/api/service/ShopService.java` - Race Condition 수정
- `frontend/src/components/NotificationSubscriber.tsx` - SSE 백오프
- `backend/src/main/java/com/daypoo/api/service/ToiletReviewService.java` - 쿼리 최적화
- `backend/src/main/java/com/daypoo/api/global/config/AsyncConfig.java` - 새로 생성
- `backend/src/main/resources/db/migration/` - 인덱스/제약 마이그레이션

### 검증 방법

1. 보고서 마크다운 렌더링 확인 (GitHub Preview)
2. 코드 예시가 실제 프로젝트 파일 경로/라인과 일치하는지 확인
3. 체크리스트 체크박스가 GitHub-compatible인지 확인
