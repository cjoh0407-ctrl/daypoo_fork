# 🚽 화장실 마커 개수 불일치 진단 리포트

## 🔍 문제 원인 분석

프론트엔드에서 **여러 단계**에 걸쳐 화장실 개수를 제한하고 있습니다. 이로 인해 백엔드 DB에 있는 전체 화장실 개수와 실제 지도에 표시되는 마커 개수가 다를 수 있습니다.

---

## ⚠️ 발견된 제한 사항

### 1️⃣ API 호출 시 반경 제한 (useToilets.ts:86-87)

```typescript
// level 5: ~1km, level 6: ~2km, level 7: ~4km ... 최대 5km로 제한
const maxRadiusByLevel = level && level >= 7 ? 5000 : 3000;
fetchRadius = Math.min(dynamicRadius, maxRadiusByLevel);
```

**영향:**
- 줌 레벨 7 이상: 최대 반경 **5km**
- 줌 레벨 7 미만: 최대 반경 **3km**
- 실제 화면 영역이 이보다 넓어도 API에서 가져오는 데이터가 제한됨

---

### 2️⃣ API 응답 데이터 개수 제한 (useToilets.ts:92)

```typescript
// ★ 성능 최적화: 데이터 개수가 너무 많으면 상위 1000개만 사용
const rawData = Array.isArray(backendData) ? backendData.slice(0, 1000) : [];
```

**영향:**
- 백엔드가 1,000개 이상의 화장실을 반환해도 **상위 1,000개만** 사용
- 나머지는 버려짐

---

### 3️⃣ 렌더링 개수 제한 (MapPage.tsx:317-318)

```typescript
const maxRenderCount = level >= 7 ? 500 : 1000;
const toiletsToRender = filteredToilets.slice(0, maxRenderCount);
```

**영향:**
- 줌 레벨 7 이상: 최대 **500개** 마커만 표시
- 줌 레벨 7 미만: 최대 **1,000개** 마커만 표시
- API에서 가져온 데이터 중에서도 일부만 화면에 표시

---

### 4️⃣ 필터/검색 기능 (MapPage.tsx:240-244)

```typescript
const filteredToilets = toilets.filter((t) => {
  const matchesFilter = filter === 'all' ? true :
                        filter === 'favorite' ? t.isFavorite :
                        filter === 'visited' ? t.isVisited : true;
  const matchesSearch = searchQuery.trim() === '' ||
                       t.name.includes(searchQuery) ||
                       (t.roadAddress && t.roadAddress.includes(searchQuery));
  return matchesFilter && matchesSearch;
});
```

**영향:**
- 필터가 'favorite' 또는 'visited'로 설정되어 있으면 해당하는 것만 표시
- 검색어가 입력되어 있으면 이름/주소에 포함된 것만 표시

---

## 🎯 개수 차이가 나는 시나리오

### 시나리오 1: 백엔드 팀원이 더 많은 마커를 보는 경우
**가능한 원인:**
1. 당신의 줌 레벨이 7 이상 → 최대 500개만 표시 (vs 팀원은 줌 아웃해서 1,000개 표시)
2. 당신이 필터나 검색어를 사용 중 → 일부만 표시
3. 당신의 브라우저 콘솔에서 에러 발생 → API 호출 실패

### 시나리오 2: 당신이 더 많은 마커를 보는 경우
**가능한 원인:**
1. 팀원의 줌 레벨이 더 높음 → 500개 제한
2. 팀원의 화면 영역이 더 좁음 → 반경 제한에 걸림
3. 팀원의 API가 아직 동기화 안 됨 → DB 데이터가 적음

---

## 🔧 디버깅 방법

### 1. 브라우저 콘솔에서 확인

```javascript
// 1. 현재 상태 확인
console.log('필터 모드:', filter);  // 'all', 'favorite', 'visited'
console.log('검색어:', searchQuery);
console.log('줌 레벨:', mapRef.current?.getLevel());

// 2. 각 단계별 개수 확인
console.log('API에서 받은 개수:', toilets.length);
console.log('필터 후 개수:', filteredToilets.length);
console.log('렌더링 개수:', toiletsToRender.length);
```

### 2. Network 탭에서 API 호출 확인

1. F12 → Network 탭 열기
2. `/api/v1/toilets?latitude=...&longitude=...&radius=...` 요청 찾기
3. **Query Parameters 확인:**
   - `latitude`: 중심 좌표
   - `longitude`: 중심 좌표
   - `radius`: 검색 반경 (미터)
4. **Response 확인:**
   - 실제로 몇 개의 화장실을 반환했는지 확인
   - 예: `[{...}, {...}, ...].length`

### 3. 콘솔 로그 추가 (임시)

**useToilets.ts:90 아래에 추가:**
```typescript
const backendData = await api.get(`/toilets?latitude=${finalLat}&longitude=${finalLng}&radius=${fetchRadius}`);
console.log(`[useToilets] API 호출: radius=${Math.round(fetchRadius)}m, 응답 개수=${backendData?.length || 0}`);
```

**MapPage.tsx:318 아래에 추가:**
```typescript
const toiletsToRender = filteredToilets.slice(0, maxRenderCount);
console.log(`[MapPage] 줌레벨=${level}, 전체=${toilets.length}, 필터후=${filteredToilets.length}, 렌더=${toiletsToRender.length}`);
```

---

## ✅ 팀원과 동일한 개수를 보려면

1. **필터 초기화**: 필터를 'all'로 설정
2. **검색어 초기화**: 검색창 비우기
3. **동일한 줌 레벨**: 같은 줌 레벨(Level 4-6 권장)로 설정
4. **동일한 위치**: 같은 위치로 지도 이동
5. **새로고침**: F5 눌러서 페이지 새로고침

---

## 🚀 성능 제한을 늘리려면 (주의!)

현재 제한은 **성능 최적화**를 위해 설정된 것입니다. 무작정 늘리면 브라우저가 느려질 수 있습니다.

### 옵션 1: 렌더링 개수만 늘리기 (비교적 안전)

**MapPage.tsx:317 수정:**
```typescript
// 변경 전
const maxRenderCount = level >= 7 ? 500 : 1000;

// 변경 후 (예시)
const maxRenderCount = level >= 7 ? 1000 : 2000;
```

### 옵션 2: API 응답 제한 늘리기 (주의 필요)

**useToilets.ts:92 수정:**
```typescript
// 변경 전
const rawData = Array.isArray(backendData) ? backendData.slice(0, 1000) : [];

// 변경 후 (예시)
const rawData = Array.isArray(backendData) ? backendData.slice(0, 2000) : [];
```

### 옵션 3: 반경 제한 늘리기 (주의 필요)

**useToilets.ts:86 수정:**
```typescript
// 변경 전
const maxRadiusByLevel = level && level >= 7 ? 5000 : 3000;

// 변경 후 (예시)
const maxRadiusByLevel = level && level >= 7 ? 10000 : 5000;
```

⚠️ **주의**: 제한을 늘리면 다음 문제가 발생할 수 있습니다:
- 브라우저 렌더링 속도 저하
- API 응답 시간 증가
- 메모리 사용량 증가

---

## 📊 권장 확인 순서

1. **콘솔 로그 확인** → API 호출이 정상인지
2. **Network 탭 확인** → 백엔드가 몇 개를 반환했는지
3. **필터/검색 확인** → UI에서 필터링 중인지
4. **줌 레벨 확인** → 렌더링 제한에 걸렸는지
5. **팀원과 비교** → 같은 조건에서 테스트

---

**작성일**: 2026-03-24
**관련 파일**:
- `frontend/src/hooks/useToilets.ts`
- `frontend/src/pages/MapPage.tsx`
