package com.daypoo.api.service;

import com.daypoo.api.dto.InventoryResponse;
import com.daypoo.api.dto.ItemResponse;
import com.daypoo.api.dto.TitleResponse;
import com.daypoo.api.entity.*;
import com.daypoo.api.entity.enums.ItemType;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.*;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class ShopService {

  private final ItemRepository itemRepository;
  private final InventoryRepository inventoryRepository;
  private final TitleRepository titleRepository;
  private final UserTitleRepository userTitleRepository;
  private final UserRepository userRepository;

  /** 상점 아이템 목록 조회 */
  @Transactional(readOnly = true)
  public List<ItemResponse> getAllItems(ItemType type) {
    List<Item> items =
        (type == null) ? itemRepository.findAll() : itemRepository.findAllByType(type);
    return items.stream()
        .map(
            item ->
                ItemResponse.builder()
                    .id(item.getId())
                    .name(item.getName())
                    .description(item.getDescription())
                    .type(item.getType())
                    .price(item.getPrice())
                    .imageUrl(item.getImageUrl())
                    .build())
        .collect(Collectors.toList());
  }

  /** 아이템 구매 */
  public void purchaseItem(User user, Long itemId) {
    Item item =
        itemRepository
            .findById(itemId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ITEM_NOT_FOUND));

    if (inventoryRepository.existsByUserAndItemId(user, itemId)) {
      throw new BusinessException(ErrorCode.ALREADY_OWNED_ITEM);
    }

    user.deductPoints(item.getPrice());
    userRepository.save(user);

    Inventory inventory = Inventory.builder().user(user).item(item).isEquipped(false).build();
    inventoryRepository.save(inventory);
  }

  /** 유저 인벤토리 조회 */
  @Transactional(readOnly = true)
  public List<InventoryResponse> getUserInventory(User user) {
    return inventoryRepository.findAllByUser(user).stream()
        .map(
            inventory ->
                InventoryResponse.builder()
                    .id(inventory.getId())
                    .itemId(inventory.getItem().getId())
                    .itemName(inventory.getItem().getName())
                    .itemType(inventory.getItem().getType().name())
                    .isEquipped(inventory.isEquipped())
                    .imageUrl(inventory.getItem().getImageUrl())
                    .build())
        .collect(Collectors.toList());
  }

  /** 아이템 장착/해제 */
  public void toggleEquipItem(User user, Long inventoryId) {
    Inventory inventory =
        inventoryRepository
            .findById(inventoryId)
            .orElseThrow(() -> new IllegalArgumentException("인벤토리에 존재하지 않는 아이템입니다."));

    if (!inventory.getUser().getId().equals(user.getId())) {
      throw new SecurityException("본인의 아이템만 장착할 수 있습니다.");
    }

    // 같은 타입의 다른 장착된 아이템이 있다면 해제 (아바타/마커 스킨은 하나만 장착 가능)
    if (!inventory.isEquipped()) {
      List<Inventory> sameTypeItems =
          inventoryRepository.findAllByUser(user).stream()
              .filter(i -> i.isEquipped() && i.getItem().getType() == inventory.getItem().getType())
              .collect(Collectors.toList());
      sameTypeItems.forEach(Inventory::unequip);
      inventory.equip();
    } else {
      inventory.unequip();
    }

    inventoryRepository.save(inventory);
  }

  /** 전체 칭호 목록 및 유저 보유 여부 조회 */
  @Transactional(readOnly = true)
  public List<TitleResponse> getAllTitles(User user) {
    List<Title> allTitles = titleRepository.findAll();
    List<Long> ownedTitleIds =
        userTitleRepository.findAllByUser(user).stream()
            .map(ut -> ut.getTitle().getId())
            .collect(Collectors.toList());

    return allTitles.stream()
        .map(
            title ->
                TitleResponse.builder()
                    .id(title.getId())
                    .name(title.getName())
                    .description(title.getDescription())
                    .requirementDescription(
                        title.getAchievementType() + ": " + title.getAchievementThreshold())
                    .isOwned(ownedTitleIds.contains(title.getId()))
                    .build())
        .collect(Collectors.toList());
  }

  /** 칭호 장착 */
  public void equipTitle(User user, Long titleId) {
    Title title =
        titleRepository
            .findById(titleId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 칭호입니다."));
    if (!userTitleRepository.existsByUserAndTitle(user, title)) {
      throw new IllegalStateException("보유하지 않은 칭호입니다.");
    }
    user.equipTitle(titleId);
    userRepository.save(user);
  }
}
