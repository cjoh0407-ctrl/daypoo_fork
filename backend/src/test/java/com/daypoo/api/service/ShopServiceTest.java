package com.daypoo.api.service;

import com.daypoo.api.entity.Inventory;
import com.daypoo.api.entity.Item;
import com.daypoo.api.entity.ItemType;
import com.daypoo.api.entity.User;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("상점 서비스 테스트")
class ShopServiceTest {

    @InjectMocks
    private ShopService shopService;

    @Mock
    private ItemRepository itemRepository;
    @Mock
    private InventoryRepository inventoryRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private TitleRepository titleRepository;
    @Mock
    private UserTitleRepository userTitleRepository;

    private User testUser;
    private Item testItem;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .username("testUser")
                .nickname("PoopKing")
                .build();
        ReflectionTestUtils.setField(testUser, "id", 1L);
        ReflectionTestUtils.setField(testUser, "points", 1000L);

        testItem = Item.builder()
                .name("황금 변 스킨")
                .price(500L)
                .type(ItemType.AVATAR_SKIN)
                .build();
        ReflectionTestUtils.setField(testItem, "id", 10L);
    }

    @Test
    @DisplayName("성공: 아이템 구매 및 포인트 차감")
    void purchaseItem_success() {
        // given
        given(itemRepository.findById(10L)).willReturn(Optional.of(testItem));
        given(inventoryRepository.existsByUserAndItemId(testUser, 10L)).willReturn(false);

        // when
        shopService.purchaseItem(testUser, 10L);

        // then
        assertThat(testUser.getPoints()).isEqualTo(500L);
        verify(userRepository, times(1)).save(testUser);
        verify(inventoryRepository, times(1)).save(any(Inventory.class));
    }

    @Test
    @DisplayName("실패: 포인트 부족으로 아이템 구매 실패")
    void purchaseItem_fail_insufficientPoints() {
        // given
        ReflectionTestUtils.setField(testUser, "points", 100L);
        given(itemRepository.findById(10L)).willReturn(Optional.of(testItem));

        // when & then
        assertThatThrownBy(() -> shopService.purchaseItem(testUser, 10L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("포인트가 부족합니다.");

        verify(inventoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("실패: 이미 보유한 아이템 재구매 시도")
    void purchaseItem_fail_alreadyOwned() {
        // given
        given(itemRepository.findById(10L)).willReturn(Optional.of(testItem));
        given(inventoryRepository.existsByUserAndItemId(testUser, 10L)).willReturn(true);

        // when & then
        assertThatThrownBy(() -> shopService.purchaseItem(testUser, 10L))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ALREADY_OWNED_ITEM);

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("성공: 아이템 장착 (기존 동일 타입 아이템 해제)")
    void toggleEquipItem_equip_new() {
        // given
        Inventory existingEquippedItem = Inventory.builder()
                .user(testUser)
                .item(Item.builder().type(ItemType.AVATAR_SKIN).build())
                .isEquipped(true)
                .build();
        
        Inventory newInventoryItem = Inventory.builder()
                .user(testUser)
                .item(testItem)
                .isEquipped(false)
                .build();
        ReflectionTestUtils.setField(newInventoryItem, "id", 100L);

        given(inventoryRepository.findById(100L)).willReturn(Optional.of(newInventoryItem));
        given(inventoryRepository.findAllByUser(testUser)).willReturn(Collections.singletonList(existingEquippedItem));

        // when
        shopService.toggleEquipItem(testUser, 100L);

        // then
        assertThat(newInventoryItem.isEquipped()).isTrue();
        assertThat(existingEquippedItem.isEquipped()).isFalse();
        verify(inventoryRepository, times(1)).save(newInventoryItem);
    }

    @Test
    @DisplayName("성공: 보유한 칭호 장착")
    void equipTitle_success() {
        // given
        given(userTitleRepository.existsByUserAndTitleId(testUser, 5L)).willReturn(true);

        // when
        shopService.equipTitle(testUser, 5L);

        // then
        assertThat(testUser.getEquippedTitleId()).isEqualTo(5L);
        verify(userRepository, times(1)).save(testUser);
    }
}
