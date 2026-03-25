# KPI 카드 게이지 바 애니메이션 교체 계획

## 1. 개요
관리자 대시보드 상단의 4개 KPI 카드에서 기존의 스파크라인 그래프(AreaChart)를 제거하고, 시각적으로 더 직관적인 애니메이션 게이지 바로 교체합니다.

## 2. 주요 변경 사항
- **파일**: `frontend/src/pages/AdminPage.tsx`
- **컴포넌트**: `StatWidget` 수정
- **수정 내용**:
    - `sparkData` 프롭 및 관련 `recharts` 로직 제거
    - `framer-motion`을 이용한 게이지 바 애니메이션 추가
    - 게이지 진행률(`progress`) 표시 로직 추가

## 3. 상세 설계
### 3.1 StatWidget 수정
- `sparkData` 대신 `progress` (0~100) 값을 받도록 변경
- 기존 `AreaChart` 영역을 아래와 같은 구조로 교체:
    ```tsx
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-black opacity-40 uppercase tracking-wider">Performance</span>
        <span className="text-[10px] font-black" style={{ color }}>{progress}%</span>
      </div>
      <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.5, ease: "circOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
    ```

### 3.2 데이터 바인딩 (AdminPage.tsx)
- 각 `StatWidget` 호출부에서 적절한 `progress` 값 전달:
    - **현재 접속자**: `(liveUsers / 1000) * 100` (최대 1000명 기준 가정)
    - **누적 사용자**: 최근 성장률 기반 또는 임의의 활성 지수 (예: 75%)
    - **관리 화장실**: 목표 대비 등록률 (예: 62%)
    - **미답변 문의**: 해결률 또는 주의 수준 (예: 24%)

## 4. 작업 순서
1. `plan.md` 승인 후 코드 수정 시작
2. `StatWidget` 컴포넌트 정의 수정
3. `DashboardView` 내 `StatWidget` 호출부 수정
4. 애니메이션 및 레이아웃 검증
5. 수정 이력 기록 (`docs/frontend-modification-history.md`)

## 5. 기대 효과
- 대시보드의 시인성 향상
- 데이터의 현재 상태를 퍼센트 단위로 즉각 파악 가능
- 부드러운 애니메이션으로 세련된 사용자 경험 제공
