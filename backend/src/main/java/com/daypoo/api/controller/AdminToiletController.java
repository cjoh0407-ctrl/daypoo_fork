package com.daypoo.api.controller;

import com.daypoo.api.dto.AdminToiletListResponse;
import com.daypoo.api.service.AdminManagementService;
import com.daypoo.api.service.ToiletReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Admin - Toilet", description = "관리자 전용 화장실 데이터 관리 API")
@RestController
@RequestMapping("/api/v1/admin/toilets")
@RequiredArgsConstructor
public class AdminToiletController {

  private final AdminManagementService adminManagementService;
  private final ToiletReviewService toiletReviewService;

  @Operation(summary = "전체 화장실 목록 조회 및 검색", description = "검색어(이름/주소)를 포함한 화장실 전체 리스트를 페이징 조회합니다.")
  @GetMapping
  public ResponseEntity<Page<AdminToiletListResponse>> getToilets(
      @RequestParam(required = false) String search,
      @PageableDefault(size = 20) Pageable pageable) {
    return ResponseEntity.ok(adminManagementService.getToilets(search, pageable));
  }

  @Operation(summary = "AI 리뷰 요약 일괄 생성", description = "리뷰 5개 이상이면서 AI 요약이 없는 화장실들에 대해 일괄 생성합니다.")
  @PostMapping("/ai-summaries/generate")
  public ResponseEntity<Map<String, Object>> generateAiSummaries() {
    int count = toiletReviewService.generateMissingAiSummaries();
    return ResponseEntity.ok(Map.of("generated", count));
  }
}
