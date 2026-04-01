package com.daypoo.api.dto;

public record EquippedItemResponse(String icon, String name, String type, String iconType) {

  public static EquippedItemResponse of(String imageUrl, String name, String type) {
    return new EquippedItemResponse(imageUrl, name, type, detectIconType(imageUrl));
  }

  private static String detectIconType(String imageUrl) {
    if (imageUrl == null) return null;
    if (imageUrl.startsWith("dicebear:")) return "DICEBEAR";
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return "URL";
    return "EMOJI";
  }
}
