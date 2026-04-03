package com.daypoo.api.service;

import com.daypoo.api.dto.ToiletSearchResultResponse;
import com.daypoo.api.util.ChosungUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.Comparator;
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

    boolean hasLocation = latitude != null && longitude != null;
    // 위치 기반 정렬을 위해 충분한 후보군 확보
    int fetchSize = hasLocation ? Math.max(size * 5, 100) : size;

    try {
      String requestBody = buildQuery(query.trim(), fetchSize);
      String response = executeSearch(requestBody);
      List<ToiletSearchResultResponse> results = parseResponse(response);

      if (hasLocation) {
        double lat = latitude;
        double lon = longitude;
        results.sort(
            Comparator.comparingDouble(r -> haversine(lat, lon, r.latitude(), r.longitude())));
        return results.subList(0, Math.min(size, results.size()));
      }
      return results;
    } catch (Exception e) {
      log.error("[OpenSearch] 검색 실패 query='{}': {}", query, e.getMessage());
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

  private String buildQuery(String query, int size) throws Exception {
    boolean isChosung = ChosungUtils.isChosungOnly(query);
    String chosungQuery = ChosungUtils.extractChosung(query);

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

    java.util.LinkedHashMap<String, Object> boolQuery = new java.util.LinkedHashMap<>();
    boolQuery.put("should", shouldClauses);
    boolQuery.put("minimum_should_match", 1);

    java.util.LinkedHashMap<String, Object> queryBody = new java.util.LinkedHashMap<>();
    queryBody.put("query", Map.of("bool", boolQuery));
    queryBody.put("size", size);

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

  private double haversine(double lat1, double lon1, double lat2, double lon2) {
    final double R = 6371000;
    double dLat = Math.toRadians(lat2 - lat1);
    double dLon = Math.toRadians(lon2 - lon1);
    double a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1))
                * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2)
                * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
