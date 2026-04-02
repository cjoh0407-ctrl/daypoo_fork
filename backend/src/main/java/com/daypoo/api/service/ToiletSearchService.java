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

    // 1차: 좌표 포함 검색 시도 (geo_distance 정렬)
    if (latitude != null && longitude != null) {
      try {
        String requestBody = buildQuery(query.trim(), size, latitude, longitude);
        String response = executeSearch(requestBody);
        List<ToiletSearchResultResponse> results = parseResponse(response);
        if (!results.isEmpty()) {
          return results;
        }
      } catch (Exception e) {
        log.warn(
            "[OpenSearch] geo_distance 검색 실패, 좌표 없이 재시도합니다. query='{}': {}", query, e.getMessage());
      }
    }

    // 2차: 좌표 없이 검색 (순수 텍스트/초성 일치도만)
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

    List<Object> shouldClauses = new ArrayList<>();

    if (!isChosung) {
      // 1. 일반 텍스트 검색
      shouldClauses.add(
          Map.of(
              "multi_match",
              Map.of(
                  "query",
                  query,
                  "fields",
                  List.of("name^10", "address"),
                  "type",
                  "best_fields",
                  "boost",
                  5.0)));
      shouldClauses.add(
          Map.of("match_phrase_prefix", Map.of("name", Map.of("query", query, "boost", 15.0))));
    }

    // 2. 초성 검색 (가중치 조정)
    shouldClauses.add(
        Map.of("term", Map.of("nameChosung", Map.of("value", chosungQuery, "boost", 100.0))));
    shouldClauses.add(
        Map.of("prefix", Map.of("nameChosung", Map.of("value", chosungQuery, "boost", 50.0))));
    shouldClauses.add(
        Map.of(
            "wildcard",
            Map.of("nameChosung", Map.of("value", "*" + chosungQuery + "*", "boost", 10.0))));
    shouldClauses.add(
        Map.of(
            "wildcard",
            Map.of("addressChosung", Map.of("value", "*" + chosungQuery + "*", "boost", 5.0))));

    Map<String, Object> finalQuery;

    if (latitude != null && longitude != null) {
      // 거리와 일치도를 합산한 점수 모델 사용
      finalQuery =
          Map.of(
              "function_score",
              Map.of(
                  "query",
                  Map.of("bool", Map.of("should", shouldClauses, "minimum_should_match", 1)),
                  "functions",
                  List.of(
                      Map.of(
                          "gauss",
                          Map.of(
                              "location",
                              Map.of(
                                  "origin", Map.of("lat", latitude, "lon", longitude),
                                  "offset", "500m",
                                  "scale", "3km")),
                          "weight",
                          2.0)),
                  "score_mode",
                  "multiply",
                  "boost_mode",
                  "multiply"));
    } else {
      finalQuery = Map.of("bool", Map.of("should", shouldClauses, "minimum_should_match", 1));
    }

    java.util.LinkedHashMap<String, Object> queryBody = new java.util.LinkedHashMap<>();
    queryBody.put("query", finalQuery);
    queryBody.put("size", size);

    // 점수(일치도+거리)를 1순위로, 그래도 같으면 더 가까운 순으로
    if (latitude != null && longitude != null) {
      queryBody.put(
          "sort",
          List.of(
              Map.of("_score", "desc"),
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
