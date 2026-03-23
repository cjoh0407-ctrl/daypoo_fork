package com.daypoo.api.entity.enums;

public enum InquiryType {
  TOILET_ERROR("화장실 정보 오류"),
  PAYMENT_ITEM("결제/아이템 문의"),
  HEALTH_ANALYSIS("건강 분석 오류"),
  OTHERS("기타");

  private final String label;

  InquiryType(String label) {
    this.label = label;
  }

  public String getLabel() {
    return label;
  }

  public static InquiryType fromLabel(String label) {
    for (InquiryType type : values()) {
      if (type.label.equals(label)) {
        return type;
      }
    }
    return OTHERS;
  }
}
