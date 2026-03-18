package com.daypoo.api.global.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
  // Common
  INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "C001", "잘못된 입력값입니다."),
  METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "C002", "허용되지 않은 메서드입니다."),
  ENTITY_NOT_FOUND(HttpStatus.NOT_FOUND, "C003", "엔티티를 찾을 수 없습니다."),
  INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "C004", "서버 내부 오류입니다."),
  INVALID_TYPE_VALUE(HttpStatus.BAD_REQUEST, "C005", "잘못된 타입의 값입니다."),
  HANDLE_ACCESS_DENIED(HttpStatus.FORBIDDEN, "C006", "접근 권한이 없습니다."),

  // User
  USER_NOT_FOUND(HttpStatus.NOT_FOUND, "U001", "사용자를 찾을 수 없습니다."),
  USERNAME_ALREADY_EXISTS(HttpStatus.BAD_REQUEST, "U002", "이미 존재하는 아이디입니다."),
  NICKNAME_ALREADY_EXISTS(HttpStatus.BAD_REQUEST, "U003", "이미 존재하는 닉네임입니다."),
  INVALID_PASSWORD(HttpStatus.BAD_REQUEST, "U004", "비밀번호가 일치하지 않습니다."),

  // Shop
  INSUFFICIENT_POINTS(HttpStatus.BAD_REQUEST, "S001", "포인트가 부족합니다."),
  ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "S002", "아이템을 찾을 수 없습니다."),
  ALREADY_OWNED_ITEM(HttpStatus.BAD_REQUEST, "S003", "이미 보유 중인 아이템입니다."),
  NOT_OWNED_TITLE(HttpStatus.BAD_REQUEST, "S004", "보유하지 않은 칭호입니다."),

  // PooRecord
  LOCATION_OUT_OF_RANGE(HttpStatus.BAD_REQUEST, "R001", "화장실 반경 밖에서는 인증할 수 없습니다."),
  COOLDOWN_ACTIVE(HttpStatus.BAD_REQUEST, "R002", "이미 최근 인증을 완료한 화장실입니다."),
  AI_SERVICE_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "R003", "AI 분석 서비스 호출에 실패했습니다."),
  NO_RECORDS_FOR_REPORT(HttpStatus.BAD_REQUEST, "R004", "분석할 배변 기록이 없습니다.");

  private final HttpStatus status;
  private final String code;
  private final String message;

  ErrorCode(HttpStatus status, String code, String message) {
    this.status = status;
    this.code = code;
    this.message = message;
  }
}
