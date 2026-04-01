package com.daypoo.api.dto;

public record EquippedItemResponse(String icon, String name, String type, String iconType) {

  /**
   * itemId를 받아 imageUrl이 null인 경우 dicebear seed로 폴백.
   * 프론트엔드가 동일한 seed로 동일한 아바타를 렌더링할 수 있도록 일관성을 보장한다.
   */
  public static EquippedItemResponse of(String imageUrl, String name, String type, Long itemId) {
    String resolvedIcon = (imageUrl != null) ? imageUrl : "dicebear:funEmoji:item-" + itemId;
    return new EquippedItemResponse(resolvedIcon, name, type, detectIconType(resolvedIcon));
  }

  private static String detectIconType(String imageUrl) {
    if (imageUrl == null) return null;
    if (imageUrl.startsWith("dicebear:")) return "DICEBEAR";
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return "URL";
    return "EMOJI";
  }
}
