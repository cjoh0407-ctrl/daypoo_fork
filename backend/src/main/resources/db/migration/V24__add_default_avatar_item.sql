-- 1. 기본 아바타 아이템 등록 (상점 판매 아이템이 아닌 시스템 기본 아이템)
INSERT INTO items (name, description, type, price, image_url, created_at, updated_at)
VALUES ('기본 아바타', '모든 회원에게 기본 지급되는 프로필 아바타', 'AVATAR', 0, '/assets/default-avatar.svg', NOW(), NOW());

-- 2. system_settings에 default_avatar_item_id 컬럼 추가
ALTER TABLE system_settings ADD COLUMN default_avatar_item_id BIGINT;

-- 3. 방금 등록한 기본 아바타 아이템 ID를 system_settings에 세팅
UPDATE system_settings
SET default_avatar_item_id = (SELECT id FROM items WHERE name = '기본 아바타' AND type = 'AVATAR' AND price = 0 LIMIT 1);

-- 4. 기존 유저 중 장착된 아바타가 없는 유저에게 기본 아바타 자동 지급 + 장착
INSERT INTO inventories (user_id, item_id, is_equipped, created_at, updated_at)
SELECT u.id,
       (SELECT id FROM items WHERE name = '기본 아바타' AND type = 'AVATAR' AND price = 0 LIMIT 1),
       TRUE, NOW(), NOW()
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM inventories inv
    JOIN items it ON inv.item_id = it.id
    WHERE inv.user_id = u.id AND inv.is_equipped = TRUE AND it.type = 'AVATAR'
);
