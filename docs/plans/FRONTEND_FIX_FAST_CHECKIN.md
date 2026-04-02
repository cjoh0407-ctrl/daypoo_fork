# 🛠️ 스마트 방문 인증(Fast Check-in) 프론트엔드 수정 가이드

현재 백엔드 업데이트를 통해 `POST /api/v1/records/check-in` API 호출 시 서버에서 계산된 **남은 시간(`remainedSeconds`)** 정보가 응답으로 오고 있습니다. 
하지만 프론트엔드에서 이 정보를 활용하지 않아 방문 인증 클릭 시 무조건 60초부터 시작되는 문제가 있습니다. 아래 내용을 참고하여 프론트엔드 수정을 요청합니다.

---

## 1. `src/hooks/useGeoTracking.ts` 수정
자동 체크인 성공 시 서버의 응답을 외부로 전달할 수 있도록 콜백을 추가해야 합니다.

```typescript
// 수정 전
export function useGeoTracking(toilets: ToiletData[], isEnabled: boolean = true)

// 수정 후 (onAutoCheckIn 콜백 추가)
export function useGeoTracking(
  toilets: ToiletData[], 
  onAutoCheckIn?: (remainedSeconds: number) => void,
  isEnabled: boolean = true
) {
  // ... 내부 watchPosition 로직
  if (dist <= 150) {
    api.post('/api/v1/records/check-in', { /* ... */ })
      .then((res: any) => {
        // 서버에서 준 남은 시간 정보를 콜백으로 전달
        if (onAutoCheckIn && res && typeof res.remainedSeconds === 'number') {
          onAutoCheckIn(res.remainedSeconds);
        }
      });
  }
}
```

---

## 2. `src/pages/MapPage.tsx` 수정
`useGeoTracking`에서 받은 정보를 `checkInTime` 상태에 업데이트하여 모달과 동기화합니다.

```typescript
// handleAutoCheckIn 콜백 구현
const handleAutoCheckIn = useCallback((remainedSeconds: number) => {
  // 서버 기준 남은 시간을 바탕으로 클라이언트 시작 시간을 역산하여 저장
  const startTime = Date.now() - (60 - remainedSeconds) * 1000;
  setCheckInTime(startTime);
}, []);

// 훅 호출 시 콜백 전달
const { position: pos } = useGeoTracking(toilets, handleAutoCheckIn);
```

---

## 3. `src/components/map/VisitModal.tsx` 수정
타이머 초기값이 무조건 60으로 시작하지 않도록 수정합니다.

```typescript
// 수정 전
const [remainingSeconds, setRemainingSeconds] = useState(60);

// 수정 후
const [remainingSeconds, setRemainingSeconds] = useState(() => {
  if (!checkInTime) return 60;
  const elapsed = Math.floor((Date.now() - checkInTime) / 1000);
  return Math.max(0, 60 - elapsed);
});
```

---

### 💡 기대 효과
- 사용자가 앱을 켠 상태로 화장실 반경 150m 내에 머물렀다면, 실제 '방문인증' 버튼을 눌렀을 때 이미 지나간 시간만큼 차감된 타이머를 보게 됩니다.
- 1분이 이미 지났다면 즉시 사진 촬영 단계로 진입할 수 있습니다.
