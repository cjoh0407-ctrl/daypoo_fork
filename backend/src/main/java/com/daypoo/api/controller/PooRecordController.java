package com.daypoo.api.controller;

import com.daypoo.api.dto.PooRecordCreateRequest;
import com.daypoo.api.dto.PooRecordResponse;
import com.daypoo.api.service.PooRecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Poo Records", description = "배변 기록 및 인증 API")
@RestController
@RequestMapping("/api/v1/records")
@RequiredArgsConstructor
public class PooRecordController {

  private final PooRecordService recordService;

  @Operation(
      summary = "배변 기록 생성",
      description = "화장실 방문 인증 및 배변 상태를 기록합니다. 위치 검증 및 AI 분석 연동이 포함됩니다.")
  @ApiResponse(responseCode = "200", description = "기록 생성 및 보상 지급 완료")
  @ApiResponse(responseCode = "400", description = "위치 검증 실패 또는 어뷰징 감지")
  @PostMapping
  public ResponseEntity<PooRecordResponse> createRecord(
      Authentication authentication, @Valid @RequestBody PooRecordCreateRequest request) {

    // 로그인된 유저의 username 추출
    String username = authentication.getName();

    PooRecordResponse response = recordService.createRecord(username, request);
    return ResponseEntity.ok(response);
  }
}
