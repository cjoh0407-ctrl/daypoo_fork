package com.daypoo.api.service;

import com.daypoo.api.dto.ToiletSearchResultResponse;
import com.daypoo.api.util.ChosungUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Slf4j
@Service
@RequiredArgsConstructor
public class ToiletSearchService {

  private static final String INDEX_NAME = "toilets_v2";

  private final WebClient.Builder webClientBuilder;
  private final ObjectMapper objectMapper;

  @Value("${opensearch.url}")
  private String opensearchUrl;

  /**
   * 화장실 이름/주소 텍스트 검색 (초성 검색 지원)
   *
   * @param query 검색어 (일반 한글 또는 초성만)
   * @param size 최대 결과 개수
   */
  public List<ToiletSearchResultResponse> search(
      String query, int size, Double latitude, Double longitude) {
    if (query == null || query.isBlank()) return List.of();

    // 1차: 위치 포함 검색 (geo_distance 정렬)
    try {
      String requestBody = buildQuery(query.trim(), size, latitude, longitude);
      String response = executeSearch(requestBody);
      return parseResponse(response);
    } catch (Exception e) {
      log.warn(
          "[OpenSearch] geo_distance 정렬 실패, 점수순으로 재시도합니다. query='{}': {}", query, e.getMessage());
    }

    // 2차: geo_distance 정렬 실패 시에만 점수순 fallback (결과 0건은 fallback 없이 빈 배열 반환)
    try {
      String requestBody = buildQuery(query.trim(), size, null, null);
      String response = executeSearch(requestBody);
      return parseResponse(response);
    } catch (Exception e) {
      log.error("[OpenSearch] 검색 완전 실패 query='{}': {}", query, e.getMessage());
      return List.of();
    }
  }

  private String executeSearch(String requestBody) {
    return webClientBuilder
        .build()
        .post()
        .uri(opensearchUrl + "/" + INDEX_NAME + "/_search")
        .header("Content-Type", "application/json")
        .bodyValue(requestBody)
        .retrieve()
        .bodyToMono(String.class)
        .block();
  }

  // ── private helpers ──────────────────────────────────────────────────────

  private String buildQuery(String query, int size, Double latitude, Double longitude)
      throws Exception {
    boolean isChosung = ChosungUtils.isChosungOnly(query);
    String chosungQuery = ChosungUtils.extractChosung(query);
    boolean hasLocation = latitude != null && longitude != null;

    List<Object> shouldClauses = new ArrayList<>();

    if (!isChosung) {
      // 1. 일반 텍스트 검색
      shouldClauses.add(
          Map.of(
              "multi_match",
              Map.of("query", query, "fields", List.of("name", "address"), "type", "best_fields")));
      shouldClauses.add(Map.of("match_phrase_prefix", Map.of("name", Map.of("query", query))));
    }

    // 2. 초성 검색
    shouldClauses.add(Map.of("term", Map.of("nameChosung", chosungQuery)));
    shouldClauses.add(Map.of("prefix", Map.of("nameChosung", chosungQuery)));
    shouldClauses.add(Map.of("wildcard", Map.of("nameChosung", "*" + chosungQuery + "*")));
    shouldClauses.add(Map.of("wildcard", Map.of("addressChosung", "*" + chosungQuery + "*")));

    // ── bool 쿼리 조립 ──────────────────────────────────────────
    java.util.LinkedHashMap<String, Object> boolQuery = new java.util.LinkedHashMap<>();
    boolQuery.put("should", shouldClauses);
    boolQuery.put("minimum_should_match", 1);

    Map<String, Object> finalQuery = Map.of("bool", boolQuery);

    // ── 결과 조립 ───────────────────────────────────────────────
    java.util.LinkedHashMap<String, Object> queryBody = new java.util.LinkedHashMap<>();
    queryBody.put("query", finalQuery);
    queryBody.put("size", size);

    // 위치가 있으면 항상 거리순 정렬 (화장실 앱 특성상 가까운 결과가 항상 우선)
    if (hasLocation) {
      queryBody.put(
          "sort",
          List.of(
              Map.of(
                  "_geo_distance",
                  Map.of(
                      "location", Map.of("lat", latitude, "lon", longitude),
                      "order", "asc",
                      "unit", "m"))));
    }

    return objectMapper.writeValueAsString(queryBody);
  }

  private List<ToiletSearchResultResponse> parseResponse(String responseJson) throws Exception {
    JsonNode root = objectMapper.readTree(responseJson);
    JsonNode hits = root.path("hits").path("hits");

    List<ToiletSearchResultResponse> results = new ArrayList<>();
    for (JsonNode hit : hits) {
      JsonNode src = hit.path("_source");
      results.add(
          ToiletSearchResultResponse.builder()
              .id(src.path("id").asLong())
              .name(src.path("name").asText(""))
              .address(src.path("address").asText(""))
              .latitude(src.path("latitude").asDouble())
              .longitude(src.path("longitude").asDouble())
              .build());
    }
    return results;
  }
}
