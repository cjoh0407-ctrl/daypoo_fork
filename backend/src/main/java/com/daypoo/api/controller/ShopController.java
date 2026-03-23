package com.daypoo.api.controller;

import com.daypoo.api.dto.*;
import com.daypoo.api.entity.ItemType;
import com.daypoo.api.entity.User;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.UserRepository;
import com.daypoo.api.service.ShopService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/shop")
@RequiredArgsConstructor
public class ShopController {

  private final ShopService shopService;
  private final UserRepository userRepository;

  /** 상점 아이템 목록 조회 */
  @GetMapping("/items")
  public ResponseEntity<List<ItemResponse>> getAllItems(
      @RequestParam(required = false) ItemType type) {
    return ResponseEntity.ok(shopService.getAllItems(type));
  }

  /** 아이템 구매 */
  @PostMapping("/purchase")
  public ResponseEntity<Void> purchaseItem(
      @AuthenticationPrincipal String username, @RequestBody ShopPurchaseRequest request) {
    User user = getUserByUsername(username);
    shopService.purchaseItem(user, request.itemId());
    return ResponseEntity.ok().build();
  }

  /** 내 인벤토리 조회 */
  @GetMapping("/inventory")
  public ResponseEntity<List<InventoryResponse>> getUserInventory(
      @AuthenticationPrincipal String username) {
    User user = getUserByUsername(username);
    return ResponseEntity.ok(shopService.getUserInventory(user));
  }

  /** 아이템 장착/해제 토글 */
  @PostMapping("/inventory/{inventoryId}/toggle")
  public ResponseEntity<Void> toggleEquipItem(
      @AuthenticationPrincipal String username, @PathVariable Long inventoryId) {
    User user = getUserByUsername(username);
    shopService.toggleEquipItem(user, inventoryId);
    return ResponseEntity.ok().build();
  }

  /** 전체 칭호 목록 및 유저 보유 여부 조회 */
  @GetMapping("/titles")
  public ResponseEntity<List<TitleResponse>> getAllTitles(
      @AuthenticationPrincipal String username) {
    User user = getUserByUsername(username);
    return ResponseEntity.ok(shopService.getAllTitles(user));
  }

  /** 칭호 장착 */
  @PostMapping("/titles/{titleId}/equip")
  public ResponseEntity<Void> equipTitle(
      @AuthenticationPrincipal String username, @PathVariable Long titleId) {
    User user = getUserByUsername(username);
    shopService.equipTitle(user, titleId);
    return ResponseEntity.ok().build();
  }

  private User getUserByUsername(String username) {
    return userRepository
        .findByUsername(username)
        .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
  }
}
