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
  public List<ToiletSearchResultResponse> search(String query, int size, Double latitude, Double longitude) {
    if (query == null || query.isBlank()) return List.of();

    try {
      String requestBody = buildQuery(query.trim(), size, latitude, longitude);
      String response =
          webClientBuilder
              .build()
              .post()
              .uri(opensearchUrl + "/" + INDEX_NAME + "/_search")
              .header("Content-Type", "application/json")
              .bodyValue(requestBody)
              .retrieve()
              .bodyToMono(String.class)
              .block();

      return parseResponse(response);
    } catch (Exception e) {
      log.warn("[OpenSearch] 검색 실패 query='{}': {}", query, e.getMessage());
      return List.of();
    }
  }

  // ── private helpers ──────────────────────────────────────────────────────

  private String buildQuery(String query, int size, Double latitude, Double longitude) throws Exception {
    boolean isChosung = ChosungUtils.isChosungOnly(query);
    String chosungQuery = isChosung ? query : ChosungUtils.extractChosung(query);

    List<Object> shouldClauses = new ArrayList<>();

    if (!isChosung) {
      // 1. 일반 텍스트: nori 분석기로 이름/주소 검색 (이름 가중치 대폭 강화)
      shouldClauses.add(
          Map.of(
              "multi_match",
              Map.of(
                  "query", query,
                  "fields", List.of("name^10", "address"),
                  "type", "best_fields",
                  "minimum_should_match", "75%",
                  "boost", 5.0)));

      // 2. 접두사 검색 (나비 -> 나비상가)
      shouldClauses.add(
          Map.of("match_phrase_prefix", Map.of("name", Map.of("query", query, "boost", 10.0))));
    }

    // 3. 초성 검색: 시작 부분 일치 (ㄴㅂ -> 나비상가, 남부센터) - 매우 높은 가중치
    shouldClauses.add(
        Map.of("wildcard", Map.of("nameChosung", Map.of("value", chosungQuery + "*", "boost", 8.0))));

    // 4. 초성 검색: 중간 포함 - 낮은 가중치
    shouldClauses.add(
        Map.of("wildcard", Map.of("nameChosung", Map.of("value", "*" + chosungQuery + "*", "boost", 1.0))));

    // 5. 주소 초성 검색 (참고용)
    shouldClauses.add(
        Map.of("wildcard", Map.of("addressChosung", Map.of("value", "*" + chosungQuery + "*", "boost", 0.5))));

    java.util.LinkedHashMap<String, Object> queryBody = new java.util.LinkedHashMap<>();
    queryBody.put("query", Map.of("bool", Map.of("should", shouldClauses, "minimum_should_match", 1)));
    queryBody.put("size", size);

    // 위치 정보가 있으면 가까운 순으로 정렬 (단, 이름 매칭 점수가 최우선)
    if (latitude != null && longitude != null) {
      queryBody.put("sort", List.of(
          Map.of("_score", "desc"), // 일치도 우선
          Map.of("_geo_distance", Map.of(
              "location", Map.of("lat", latitude, "lon", longitude),
              "order", "asc",
              "unit", "m"
          ))
      ));
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
