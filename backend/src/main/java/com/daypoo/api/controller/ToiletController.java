package com.daypoo.api.controller;

import com.daypoo.api.dto.ToiletResponse;
import com.daypoo.api.dto.ToiletSearchResultResponse;
import com.daypoo.api.service.ToiletSearchService;
import com.daypoo.api.service.ToiletService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/toilets")
@RequiredArgsConstructor
public class ToiletController {

  private final ToiletService toiletService;
  private final ToiletSearchService toiletSearchService;

  /** 반경 내 화장실 목록 조회 (지도 마커용) */
  @GetMapping
  public ResponseEntity<List<ToiletResponse>> searchToilets(
      @RequestParam double latitude,
      @RequestParam double longitude,
      @RequestParam(defaultValue = "1000") double radius,
      @RequestParam(defaultValue = "300") int limit) {
    List<ToiletResponse> responses =
        toiletService.searchToilets(latitude, longitude, radius, limit);
    return ResponseEntity.ok(responses);
  }

  /**
   * OpenSearch 기반 텍스트 검색 (초성 검색 지원)
   *
   * @param q 검색어 (일반 한글 또는 초성. 예: "서대문" 또는 "ㅅㄷㅁ")
   * @param size 최대 결과 수 (기본 10)
   */
  @GetMapping("/search")
  public ResponseEntity<List<ToiletSearchResultResponse>> textSearch(
      @RequestParam String q,
      @RequestParam(defaultValue = "10") int size,
      @RequestParam(required = false) Double latitude,
      @RequestParam(required = false) Double longitude) {
    List<ToiletSearchResultResponse> results =
        toiletSearchService.search(q, size, latitude, longitude);
    return ResponseEntity.ok(results);
  }
}
