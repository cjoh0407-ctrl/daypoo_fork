# 🛠 어드민 페이지 빌드 오류 수정 계획

제공해주신 가이드에 따라 `AdminPage.tsx`와 `admin.ts`에서 발생하는 빌드 환경의 여러 오류(import 누락, 필드 누락, 변수 미선언 등)를 수정하겠습니다.

## 🎯 목표
- `lucide-react` 아이콘 `X` 임포트 추가
- `DailyStat` 및 `AdminStatsResponse` 인터페이스 필드 보완
- `AdminPage.tsx` 내 미선언 변수 선언 및 타입 추론 오류 해결
- 전체 빌드 오류 제거 및 어드민 대시보드 정상 작동 확인

## 🛠 분석 및 수정 제안

### 1. AdminPage.tsx (페이지 컴포넌트)
- [ ] **X 아이콘 임포트**: `lucide-react`에서 `X` 아이콘 추가
- [ ] **totalUsersCount 선언**: `DashboardView` 내에서 `stats?.totalUsers || 0` 값을 할당하여 사용
- [ ] **testItems 타입 지정**: `AdminItemCreateRequest[]`로 타입 명시하여 추론 오류 해결

### 2. admin.ts (타입 정의 파일)
- [ ] **DailyStat 수정**: `visits?: number` 필드 추가 (백엔드 데이터 대응)
- [ ] **AdminStatsResponse 수정**: `userDistribution` 인터페이스 추가 및 옵셔널 필드로 정의

## 📋 작업 단계

### Phase 1: 타입 정의 수정 (`admin.ts`)
- `DailyStat` 및 `AdminStatsResponse` 인터페이스 업데이트

### Phase 2: 페이지 컴포넌트 수정 (`AdminPage.tsx`)
- 임포트 목록 수정
- `DashboardView` 및 `AdminTestView` (또는 관련 함수) 내 변수 및 타입 수정

### Phase 3: 검증
- 수정 사항이 정상적으로 반영되었는지 파일 확인
- 가능할 경우 로컬 빌드 테스트 또는 정적 분석 체크

## ⚠️ 주의사항
- 대규모 파일이므로(143KB 이상) 수정 시 `multi_replace_file_content`를 사용하여 정확한 라인 범위를 타겟팅하겠습니다.
- 기존 로직을 해치지 않도록 주의하겠습니다.

---
[✅ 규칙을 잘 수행했습니다.]
