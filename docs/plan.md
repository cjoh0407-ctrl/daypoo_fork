# RankingService 랭킹 조회 시 로그인 유저 아바타 표시 오류 수정 계획

## 1. 문제 현상 및 원인 파악
- **현상:** 랭킹 페이지의 '내 랭킹' 섹션에서 로그인 유저가 Top 10 밖일 때 장착한 아바타가 표시되지 않고 기본 아바타가 표시됨.
- **원인:** `RankingService.getRankingFromRedis()` 메서드에서 인벤토리 아이템을 Top 10 유저(`users` 리스트)만 대상으로 배치 조회함. 로그인 유저가 Top 10에 포함되지 않으면 `equippedItemsMap`에 해당 유저의 정보가 없어 빈 리스트가 반환되고, 결과적으로 아바타 URL이 `null`이 됨.

## 2. 해결 방법
- 인벤토리 정보를 조회할 대상 유저 리스트(`usersForInventory`)를 별도로 생성합니다.
- 기본적으로 Top 10 유저를 포함하며, 로그인 유저(`myUser`)가 Top 10에 포함되어 있지 않은 경우(`userMap`에 없는 경우) 추가합니다.
- `inventoryRepository.findEquippedByUserIn()` 호출 시 이 확장된 리스트를 사용하여 모든 관련 유저의 장착 아이템 정보를 한 번에 가져옵니다.

## 3. 작업 상세 정보
- **대상 파일:** `backend/src/main/java/com/daypoo/api/service/RankingService.java`
- **수정 위치:** `getRankingFromRedis()` 메서드 내 `equippedItemsMap` 빌드 로직 (약 219~232라인)
- **변경 사항:**
    - `usersForInventory` 리스트 생성 및 `myUser` 조건부 추가 로직 삽입.
    - `inventoryRepository.findEquippedByUserIn(users)`를 `findEquippedByUserIn(usersForInventory)`로 변경.

## 4. 검증 계획
- 코드 수정 후 랭킹 API 응답 시 `myRank` 필드의 `equippedAvatarUrl`이 정상적으로 채워지는지 확인합니다. (로그인 유저가 Top 10 밖인 상황 가정)

---
[✅ 규칙을 잘 수행했습니다.]
