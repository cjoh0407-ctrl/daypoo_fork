# 프론트엔드 수정 가이드 — 랭킹 페이지 아바타 미반영 버그

## 배경

마이페이지에서 장착한 아바타가 랭킹 페이지에서는 항상 기본 아바타로 표시되는 버그.  
백엔드 수정은 완료되었으며, 프론트엔드 쪽에 3개의 수정이 필요합니다.

---

## 수정 1 (필수) — `useRankings.ts` 타입 동기화

**파일:** `frontend/src/hooks/useRankings.ts`

백엔드 `EquippedItemResponse`에 `iconType` 필드가 추가되었는데 프론트 타입에 반영이 안 되어 있습니다.

```typescript
// 현재
interface EquippedItemResponse {
  icon: string | null;
  name: string;
  type: 'AVATAR' | 'EFFECT';
}

// 수정 후
interface EquippedItemResponse {
  icon: string;          // 백엔드에서 null 방지 처리됨 (imageUrl이 없으면 dicebear seed 자동 생성)
  name: string;
  type: 'AVATAR' | 'EFFECT';
  iconType: 'URL' | 'DICEBEAR' | 'EMOJI';  // 추가
}
```

---

## 수정 2 (필수) — `RankingPage.tsx` effectEmoji 필드명 오류

**파일:** `frontend/src/pages/RankingPage.tsx`  
**위치:** 685번째 줄

`EquippedItemResponse`의 이미지 필드명은 `icon`인데 `imageUrl`로 잘못 접근하고 있습니다.  
`as any`로 타입 에러를 우회하고 있어서 런타임에서 `undefined`가 되어 효과 이모지가 항상 안 나옵니다.

```typescript
// 현재 (685번째 줄)
effectEmoji: (r.equippedItems || []).find((item) => item.type === 'EFFECT')
  ? ((r.equippedItems || []).find((item) => item.type === 'EFFECT') as any).imageUrl
    || ((r.equippedItems || []).find((item) => item.type === 'EFFECT') as any).icon
  : undefined,

// 수정 후
effectEmoji: (r.equippedItems || []).find((item) => item.type === 'EFFECT')?.icon ?? undefined,
```

---

## 수정 3 (필수) — `avatar.ts` generateRankingAvatar null 폴백 통일

**파일:** `frontend/src/utils/avatar.ts`  
**위치:** `generateRankingAvatar` 함수 (74~79번째 줄)

### 문제 원인

마이페이지와 랭킹 페이지가 `equippedAvatarUrl`이 없을 때 서로 다른 폴백 로직을 사용했습니다.

| 위치 | null 폴백 | 결과 |
|------|---------|------|
| **마이페이지** (`parseDicebearUrl(null, itemId, 'AVATAR')`) | `generateItemAvatar(itemId)` → itemId 기반 고유 아바타 생성 | 아바타처럼 보임 |
| **랭킹 페이지** (`generateRankingAvatar(userId, rank, null)`) | `DEFAULT_AVATAR_URL` 반환 | 기본 아바타 표시 |

즉, 동일한 사용자인데 마이페이지에서는 고유한 아바타처럼 보이고, 랭킹에서는 기본 아바타가 나왔습니다.

### 백엔드 수정 내용 (이미 완료)

백엔드에서 `item.imageUrl`이 null인 경우, 아이템 ID 기반으로 dicebear seed를 자동 생성해서 내려줍니다.

```
item.imageUrl = null  →  icon = "dicebear:funEmoji:item-{itemId}"
```

따라서 `equippedAvatarUrl`이 null로 내려오는 케이스는 이제 "장착된 AVATAR 아이템 자체가 없는 경우"만 남습니다.

### 프론트 수정

`equippedAvatarUrl`이 null인 경우(= 아바타 아이템 미장착)의 폴백을 `userId` 기반 고유 아바타로 통일합니다.

```typescript
// 현재 (74~79번째 줄)
export const generateRankingAvatar = (
  userId: string | number,
  rank: number,
  equippedAvatarUrl?: string | null
): string => {
  if (equippedAvatarUrl) {
    return parseDicebearUrl(equippedAvatarUrl, userId, 'AVATAR', 128);
  }
  return DEFAULT_AVATAR_URL;  // ← 기본 아바타 (모든 사람이 같은 이미지)
};

// 수정 후
export const generateRankingAvatar = (
  userId: string | number,
  rank: number,
  equippedAvatarUrl?: string | null
): string => {
  if (equippedAvatarUrl) {
    return parseDicebearUrl(equippedAvatarUrl, userId, 'AVATAR', 128);
  }
  return generateAvatar(userId, 'funEmoji', 128);  // ← userId 기반 고유 아바타
};
```

`generateAvatar`는 같은 파일에 이미 있는 함수입니다 (42번째 줄). import 추가 없이 바로 사용 가능합니다.

---

## 수정 후 예상 동작

| 케이스 | 수정 전 | 수정 후 |
|--------|--------|--------|
| 아바타 아이템 장착 + imageUrl 있음 | imageUrl 기반 렌더링 ✅ | imageUrl 기반 렌더링 ✅ |
| 아바타 아이템 장착 + imageUrl null | DEFAULT_AVATAR_URL ❌ | dicebear seed 자동 생성 → 고유 아바타 ✅ |
| 아바타 아이템 미장착 | DEFAULT_AVATAR_URL ❌ | userId 기반 고유 아바타 ✅ |
| effectEmoji 표시 | undefined (항상 안 나옴) ❌ | item.icon 값 정상 표시 ✅ |

---

## 수정 파일 요약

| 파일 | 수정 내용 | 우선순위 |
|------|---------|--------|
| `frontend/src/hooks/useRankings.ts` | `EquippedItemResponse`에 `iconType` 필드 추가, `icon` null 제거 | 필수 |
| `frontend/src/pages/RankingPage.tsx` | 685번째 줄 `.imageUrl` → `.icon` 수정 | 필수 |
| `frontend/src/utils/avatar.ts` | `generateRankingAvatar` null 폴백을 `generateAvatar(userId)` 로 변경 | 필수 |
