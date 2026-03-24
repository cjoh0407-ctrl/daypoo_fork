# 화장실 리뷰 시스템 구현 계획

## Context

현재 DayPoo 프로젝트에는 화장실 리뷰/평가 시스템이 **전혀 구현되어 있지 않습니다**.
- 백엔드: Review 관련 엔티티, 컨트롤러, 서비스, 리포지토리 없음
- 프론트엔드: `ToiletReview` 타입과 `EMOJI_TAG_MAP`이 이미 정의되어 있으나, UI/API 연동 미구현
- `ToiletPopup.tsx`에 "리뷰 기능을 준비 중입니다" 플레이스홀더만 존재

따라서 **처음부터 설계 및 구현**이 필요합니다.

---

## 1단계: 현황 파악 (Analyze)

### 기존 코드베이스 분석 결과

| 영역 | 현황 | 파일 |
|------|------|------|
| Review 엔티티 | **없음** | - |
| Review API | **없음** | - |
| Review 서비스 | **없음** | - |
| Review 리포지토리 | **없음** | - |
| 프론트 타입 정의 | **있음** (ToiletReview, EmojiTag) | `frontend/src/types/toilet.ts` |
| 프론트 UI | **플레이스홀더만** | `frontend/src/components/map/ToiletPopup.tsx:100-103` |
| AI 서비스 연동 | **있음** (AiClient - 이미지 분석/리포트) | `backend/.../service/AiClient.java` |
| Mock 데이터 | **리뷰 관련 없음** | `backend/.../global/config/DataInitializer.java` |
| DB 마이그레이션 | V1, V2까지 존재 (리뷰 테이블 없음) | `backend/.../db/migration/` |

### 재사용 가능한 기존 자산
- `BaseTimeEntity` - createdAt/updatedAt 자동 관리
- `AiClient` - AI 서비스 호출 패턴 (리뷰 요약에 활용 가능)
- `GeometryUtil` - 좌표 처리
- `DataInitializer` - 시드 데이터 패턴
- 프론트엔드 `apiClient.ts` - API 호출 패턴
- 프론트엔드 `EMOJI_TAG_MAP` - 이모지 태그 매핑 이미 정의됨

---

## 2단계: 진단 및 방향 설정 (Design)

### 설계 방향: 신규 구현 (New Feature)

리뷰 관련 코드가 전혀 없으므로, 기존 프로젝트 패턴(엔티티-서비스-컨트롤러-DTO)을 따라 새로 구축합니다.

### 핵심 설계 결정

1. **Review 엔티티**: `toilet_reviews` 테이블 신설. User-Toilet 간 다대다 관계(한 유저가 같은 화장실에 여러 리뷰 가능)
2. **이모지 태그**: `emoji_tags` 컬럼에 콤마 구분 문자열로 저장 (기존 `conditionTags`, `dietTags` 패턴 따름)
3. **AI 한 줄 요약**: 리뷰 N개가 쌓이면 AI 서비스에 요약 요청 -> Toilet 엔티티에 `aiSummary`, `avgRating` 캐싱
4. **조회 분리**: 최근 5개 조회(간단 쿼리) vs 전체 페이징 조회(Pageable + 정렬)
5. **Flyway 마이그레이션**: `V3__add_toilet_reviews.sql`로 스키마 추가

---

## 3단계: 프론트엔드/백엔드 구현 계획 (Plan)

### 백엔드 구현 목록

#### 3-1. DB 스키마 (Flyway 마이그레이션)
- **파일**: `backend/src/main/resources/db/migration/V3__add_toilet_reviews.sql`
- `toilet_reviews` 테이블 생성
  - `id`, `user_id`(FK), `toilet_id`(FK), `rating`(1-5), `emoji_tags`(TEXT), `comment`(TEXT), `helpful_count`(INT), `created_at`, `updated_at`
- `toilets` 테이블에 `avg_rating`(DECIMAL), `review_count`(INT), `ai_summary`(TEXT) 컬럼 추가
- 인덱스: `idx_reviews_toilet_created`(toilet_id, created_at DESC), `idx_reviews_user`(user_id)

#### 3-2. 엔티티
- **파일**: `backend/src/main/java/com/daypoo/api/entity/ToiletReview.java` (신규)
  - `id`, `user`(ManyToOne), `toilet`(ManyToOne), `rating`, `emojiTags`, `comment`, `helpfulCount`
  - `BaseTimeEntity` 상속
- **파일**: `backend/src/main/java/com/daypoo/api/entity/Toilet.java` (수정)
  - `avgRating`(Double), `reviewCount`(Integer), `aiSummary`(String) 필드 추가
  - `updateReviewStats()` 메서드 추가

#### 3-3. DTO
- **파일**: `backend/src/main/java/com/daypoo/api/dto/` (신규 파일들)
  - `ToiletReviewCreateRequest` - rating(1-5), emojiTags(List), comment
  - `ToiletReviewResponse` - 리뷰 상세 응답 (userName, userAvatar 포함)
  - `ToiletReviewSummaryResponse` - AI 요약 + 평균별점 + 최근리뷰 5개
  - `ToiletReviewPageResponse` - 페이징 응답 래퍼

#### 3-4. 리포지토리
- **파일**: `backend/src/main/java/com/daypoo/api/repository/ToiletReviewRepository.java` (신규)
  - `findTop5ByToiletIdOrderByCreatedAtDesc(Long toiletId)` - 최근 5개
  - `findByToiletIdOrderByCreatedAtDesc(Long toiletId, Pageable pageable)` - 페이징 (최신순)
  - `findByToiletIdOrderByCreatedAtAsc(Long toiletId, Pageable pageable)` - 페이징 (오래된순)
  - `countByToiletId(Long toiletId)`
  - `calculateAvgRatingByToiletId(Long toiletId)` - @Query로 AVG 계산

#### 3-5. 서비스
- **파일**: `backend/src/main/java/com/daypoo/api/service/ToiletReviewService.java` (신규)
  - `createReview(userId, toiletId, request)` - 리뷰 생성 + Toilet 평균별점/리뷰수 업데이트
  - `getRecentReviews(toiletId)` - 최근 5개 빠른 조회
  - `getReviewsWithPaging(toiletId, page, size, sort)` - 페이징 + 정렬
  - `getReviewSummary(toiletId)` - AI 요약 + 평균별점 응답
  - `generateAiSummary(toiletId)` - AI 서비스 호출하여 리뷰 요약 생성 (리뷰 5개 이상 시)

#### 3-6. 컨트롤러
- **파일**: `backend/src/main/java/com/daypoo/api/controller/ToiletReviewController.java` (신규)
  - `POST /api/v1/toilets/{toiletId}/reviews` - 리뷰 작성
  - `GET /api/v1/toilets/{toiletId}/reviews/recent` - 최근 후기 5개
  - `GET /api/v1/toilets/{toiletId}/reviews?page=0&size=10&sort=latest|oldest` - 전체 후기 페이징
  - `GET /api/v1/toilets/{toiletId}/reviews/summary` - AI 요약 + 평균별점

#### 3-7. Mock 데이터
- **파일**: `backend/src/main/java/com/daypoo/api/global/config/DataInitializer.java` (수정)
  - 기존 화장실 3개에 대해 각 3~5개의 의미 있는 리뷰 더미 데이터 삽입
  - 다양한 rating(1~5), emojiTags 조합, 실제적인 comment 포함
  - 예시: "깔끔하고 휴지도 넉넉해요. 강남역 화장실 중 최고!" (rating: 5, tags: clean, tissue)

---

### 프론트엔드 구현 목록

#### 3-8. API 서비스 함수
- **파일**: `frontend/src/services/apiClient.ts` 또는 신규 `reviewService.ts`
  - `createReview(toiletId, data)` - POST
  - `getRecentReviews(toiletId)` - GET recent
  - `getReviews(toiletId, page, size, sort)` - GET paged
  - `getReviewSummary(toiletId)` - GET summary

#### 3-9. 리뷰 목록 컴포넌트
- **파일**: `frontend/src/components/map/ToiletPopup.tsx` (수정)
  - "리뷰 기능을 준비 중입니다" 플레이스홀더 -> 실제 최근 후기 5개 표시
  - AI 한 줄 요약 + 평균 별점 표시 영역 추가
  - 이모지 태그 뱃지 렌더링 (EMOJI_TAG_MAP 활용)
  - "전체 후기 보기" 버튼 -> 전체 리뷰 페이지/모달로 이동

#### 3-10. 리뷰 작성 컴포넌트
- **파일**: `frontend/src/components/map/ReviewModal.tsx` (신규)
  - 별점 입력 (1~5 터치/클릭)
  - 이모지 태그 선택 (다중 선택 가능)
  - 코멘트 텍스트 입력
  - 제출 버튼

#### 3-11. 전체 리뷰 목록 컴포넌트
- **파일**: `frontend/src/components/map/ReviewListModal.tsx` (신규)
  - 전체 리뷰 페이징 표시
  - 정렬 옵션 (최신순/오래된순)
  - 각 리뷰 카드: 유저명, 별점, 이모지태그, 코멘트, 작성일

---

## 검증 방법

1. **백엔드 단위 테스트**: 서버 기동 후 Swagger UI(`/swagger-ui.html`)에서 API 직접 호출
2. **Mock 데이터 확인**: 서버 시작 시 로그에 리뷰 시드 데이터 삽입 확인
3. **프론트엔드 통합 테스트**:
   - 지도에서 화장실 선택 -> ToiletPopup에 최근 후기 5개 + AI 요약 표시 확인
   - 리뷰 작성 모달 -> 별점/이모지/코멘트 입력 후 제출 -> 목록 갱신 확인
   - 전체 후기 보기 -> 페이징/정렬 동작 확인

---

## 구현 순서 (권장)

1. DB 마이그레이션 (V3) + Toilet 엔티티 수정
2. ToiletReview 엔티티 + Repository
3. DTO 클래스들
4. ToiletReviewService
5. ToiletReviewController
6. DataInitializer 리뷰 Mock 데이터 추가
7. 백엔드 검증 (Swagger)
8. 프론트 API 서비스 함수
9. ToiletPopup 리뷰 표시 수정
10. ReviewModal (리뷰 작성)
11. ReviewListModal (전체 리뷰)
12. 프론트엔드 통합 테스트
