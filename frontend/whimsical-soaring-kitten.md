# 7일/30일 분석 리포트 동일하게 표시되는 문제 - 원인 분석 및 수정

## Context

마이페이지에서 7일 리포트와 30일 리포트가 동일하게 표시되는 문제 발생. 실제로는 분석 기간이 다르지만 UI가 같아 보이는 원인을 파악하고 수정.

---

## 원인 분석

### 근본 원인 1 (주요 버그): 프론트엔드 4-stat 그리드 하드코딩

[MyPage.tsx:1366-1378](frontend/src/pages/MyPage.tsx#L1366-L1378)의 weekly/monthly 탭 통계 그리드가 **완전히 하드코딩**:

```tsx
// 현재 코드 - 항상 동일한 값 표시
<div>Best State: "바나나"</div>
<div>Alert: "매운맛"</div>
<div>Average Scale: "Step 4"</div>
<div>Achievement: "92%"</div>
```

7일/30일 탭 모두 같은 컴포넌트(`activeSubTab !== 'daily'`)를 사용하고, 이 stats 영역이 하드코딩되어 있어 **두 탭이 시각적으로 동일하게 보임**.

### 근본 원인 2: 분석 기간 미표시

`HealthReportResponse`에 `periodStart`, `periodEnd` 필드가 있지만 프론트엔드에서 표시하지 않음. 7일 = 7일 전~오늘, 30일 = 30일 전~오늘으로 기간이 다르지만 사용자가 알 수 없음.

### 근본 원인 3: 데이터가 7일치만 있을 경우 AI 동일 출력

`getStartTime(WEEKLY)` = now-7days, `getStartTime(MONTHLY)` = now-30days 이지만, 사용자가 최근 7일치 데이터만 있는 경우 두 리포트의 AI 입력이 동일 → 동일한 AI 출력.

**백엔드 로직은 정상** (cache key에 type 포함, snapshot 조회도 reportType 기준).

### 부가 문제: 탭 전환 시 stale data 플래시

탭 전환 시 `reportData`를 즉시 초기화하지 않아 이전 탭 데이터가 새 데이터 로딩 전까지 남아 있음.

---

## 수정 계획

### [수정 1] 백엔드: HealthReportResponse에 stats 필드 추가

**파일**: [HealthReportResponse.java](backend/src/main/java/com/daypoo/api/dto/HealthReportResponse.java)

현재 record에 4개 필드 추가:
```java
@Builder
public record HealthReportResponse(
    String reportType,
    int healthScore,
    String summary,
    String solution,
    List<String> insights,
    int recordCount,
    LocalDateTime periodStart,
    LocalDateTime periodEnd,
    String analyzedAt,
    // ★ 추가
    Integer mostFrequentBristol,   // 최다 bristol 단계 (1~7), null 가능
    String mostFrequentCondition,  // 최다 컨디션 태그, null 가능
    String mostFrequentDiet,       // 최다 식단 태그, null 가능
    Integer healthyRatio           // 건강 배변(bristol 3~4) 비율(%), null 가능
) {}
```

**파일**: [ReportService.java](backend/src/main/java/com/daypoo/api/service/ReportService.java)

`generateReport` 내 AI 응답 확장 시점(line 124)에 records 기반 stats 계산 추가:

```java
// stats 계산
Integer mostFrequentBristol = computeMostFrequent(
    records.stream().map(PooRecord::getBristolScale).filter(Objects::nonNull).collect(Collectors.toList())
);
String mostFrequentCondition = computeMostFrequentTag(
    records.stream().flatMap(r -> r.getConditionTags() != null ? r.getConditionTags().stream() : Stream.empty()).collect(Collectors.toList())
);
String mostFrequentDiet = computeMostFrequentTag(
    records.stream().flatMap(r -> r.getDietTags() != null ? r.getDietTags().stream() : Stream.empty()).collect(Collectors.toList())
);
long healthyCount = records.stream()
    .filter(r -> r.getBristolScale() != null && r.getBristolScale() >= 3 && r.getBristolScale() <= 4)
    .count();
Integer healthyRatio = records.isEmpty() ? null : (int) (healthyCount * 100 / records.size());

response = HealthReportResponse.builder()
    ...기존 필드...
    .mostFrequentBristol(mostFrequentBristol)
    .mostFrequentCondition(mostFrequentCondition)
    .mostFrequentDiet(mostFrequentDiet)
    .healthyRatio(healthyRatio)
    .build();
```

private 헬퍼 메서드 추가:
```java
private <T> T computeMostFrequent(List<T> items) {
    return items.stream()
        .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
        .entrySet().stream()
        .max(Map.Entry.comparingByValue())
        .map(Map.Entry::getKey)
        .orElse(null);
}

private String computeMostFrequentTag(List<String> tags) {
    return computeMostFrequent(tags) != null ? computeMostFrequent(tags).toString() : null;
}
```

DB 스냅샷에서 복원 시(line 78-88)도 같은 stats 반환 필요 → 스냅샷에 stats 저장 **또는** stats 필드를 `null`로 반환 (간단한 방법).

> **Note**: 스냅샷 복원 시 stats가 null이면 프론트에서 "-"로 표시. stats를 스냅샷에 저장하는 건 별도 개선으로 보류.

### [수정 2] 프론트엔드: 하드코딩 stats → reportData 연동

**파일**: [MyPage.tsx](frontend/src/pages/MyPage.tsx) (lines 1366-1378 부근)

```tsx
// 수정 후
<div>최다 식단: {reportData?.mostFrequentDiet ?? '-'}</div>
<div>최다 컨디션: {reportData?.mostFrequentCondition ?? '-'}</div>
<div>평균 브리스톨: {reportData?.mostFrequentBristol != null ? `Step ${reportData.mostFrequentBristol}` : '-'}</div>
<div>건강 배변 비율: {reportData?.healthyRatio != null ? `${reportData.healthyRatio}%` : '-'}</div>
```

### [수정 3] 프론트엔드: 분석 기간 표시

**파일**: [MyPage.tsx](frontend/src/pages/MyPage.tsx) weekly/monthly 탭 상단에 추가:

```tsx
{reportData?.periodStart && reportData?.periodEnd && (
  <p className="text-sm text-gray-400">
    분석 기간: {new Date(reportData.periodStart).toLocaleDateString('ko-KR')} ~ {new Date(reportData.periodEnd).toLocaleDateString('ko-KR')}
    &nbsp;({reportData.recordCount}건)
  </p>
)}
```

### [수정 4] 프론트엔드: 탭 전환 시 reportData 초기화

**파일**: [MyPage.tsx](frontend/src/pages/MyPage.tsx) `fetchReport` 함수 내:

```typescript
const fetchReport = useCallback(async (type: string) => {
  setReportData(null);  // ★ 추가: 탭 전환 시 즉시 초기화
  setIsFetchLoading(true);
  try {
    ...
```

---

## 수정 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| [HealthReportResponse.java](backend/src/main/java/com/daypoo/api/dto/HealthReportResponse.java) | stats 4개 필드 추가 |
| [ReportService.java](backend/src/main/java/com/daypoo/api/service/ReportService.java) | records 기반 stats 계산 + response 빌더에 포함 |
| [MyPage.tsx](frontend/src/pages/MyPage.tsx) | 하드코딩 stats 제거 → reportData 연동, 기간 표시, 탭 전환 시 초기화 |

---

## 검증 방법

1. 7일 리포트 클릭 → 분석 기간이 "7일 전 ~ 오늘"로 표시 확인
2. 30일 리포트 클릭 → 분석 기간이 "30일 전 ~ 오늘"로 표시 확인
3. stats 그리드가 실제 데이터 기반으로 표시 확인 (하드코딩 아님)
4. 7일/30일 데이터가 다를 경우 stats 수치가 다르게 표시 확인
5. 탭 전환 시 즉시 로딩 스피너 표시 확인 (stale data 플래시 없음)
