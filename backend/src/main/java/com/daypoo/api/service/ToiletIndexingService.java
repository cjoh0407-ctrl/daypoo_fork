package com.daypoo.api.service;

import com.daypoo.api.entity.Toilet;
import com.daypoo.api.repository.ToiletRepository;
import com.daypoo.api.util.ChosungUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Slf4j
@Service
@RequiredArgsConstructor
public class ToiletIndexingService {

  private static final String INDEX_NAME = "toilets_v2";
  private static final int PAGE_SIZE = 200;

  private final ToiletRepository toiletRepository;
  private final WebClient.Builder webClientBuilder;
  private final ObjectMapper objectMapper;

  @Value("${opensearch.url}")
  private String opensearchUrl;

  /** 앱 시작 시 인덱스가 비어 있으면 전체 데이터를 백그라운드로 인덱싱 */
  @Async
  @EventListener(ApplicationReadyEvent.class)
  public void indexOnStartup() {
    try {
      ensureIndexExists();
      long count = getIndexedCount();
      if (count == 0) {
        log.info("[OpenSearch] 인덱스가 비어 있어 전체 화장실 데이터를 인덱싱합니다...");
        indexAll();
      } else {
        log.info("[OpenSearch] 기존 인덱스에 {}개 문서 존재 - 인덱싱 스킵", count);
      }
      cleanupOldIndex();
    } catch (Exception e) {
      log.warn("[OpenSearch] 시작 시 인덱싱 실패 (검색 기능 비활성화): {}", e.getMessage());
    }
  }

  /** 수동 호출: 인덱스를 삭제 후 재생성하고 전체 데이터를 강제로 다시 인덱싱 */
  @Async
  public void forceReindex() {
    try {
      log.info("[OpenSearch] === 강제 재인덱싱 시작 ===");
      WebClient client = webClientBuilder.build();
      // 1. 기존 인덱스 삭제
      deleteIndex(client);
      // 2. 새 인덱스 생성 (Nori + geo_point)
      createIndex(client);
      // 3. 전체 데이터 인덱싱 (조건 체크 없이)
      indexAll();
      // 4. 구버전 인덱스 정리
      cleanupOldIndex();
      log.info("[OpenSearch] === 강제 재인덱싱 완료 ===");
    } catch (Exception e) {
      log.error("[OpenSearch] 강제 재인덱싱 실패: {}", e.getMessage(), e);
    }
  }

  /** DB의 모든 화장실을 OpenSearch에 bulk 인덱싱 */
  public void indexAll() {
    int page = 0;
    int total = 0;
    Page<Toilet> result;
    do {
      result = toiletRepository.findAll(PageRequest.of(page, PAGE_SIZE));
      List<Toilet> toilets = result.getContent();
      if (!toilets.isEmpty()) {
        bulkIndex(toilets);
        total += toilets.size();
        log.info("[OpenSearch] 인덱싱 진행 중... {}개 완료", total);
      }
      page++;
    } while (result.hasNext());
    log.info("[OpenSearch] 전체 인덱싱 완료 - 총 {}개", total);
  }

  /** 화장실 목록을 OpenSearch에 bulk 인덱싱 */
  public void bulkIndex(List<Toilet> toilets) {
    StringBuilder body = new StringBuilder();
    for (Toilet t : toilets) {
      if (t.getLocation() == null) continue;
      body.append("{\"index\":{\"_index\":\"")
          .append(INDEX_NAME)
          .append("\",\"_id\":\"")
          .append(t.getId())
          .append("\"}}\n");
      body.append(buildDocument(t)).append("\n");
    }
    if (body.isEmpty()) return;

    try {
      webClientBuilder
          .build()
          .post()
          .uri(opensearchUrl + "/_bulk")
          .header("Content-Type", "application/x-ndjson")
          .bodyValue(body.toString())
          .retrieve()
          .bodyToMono(String.class)
          .block();
    } catch (Exception e) {
      log.warn("[OpenSearch] bulk 인덱싱 실패: {}", e.getMessage());
    }
  }

  // ── private helpers ──────────────────────────────────────────────────────

  private void ensureIndexExists() {
    WebClient client = webClientBuilder.build();
    boolean indexExists = false;
    try {
      client.head().uri(opensearchUrl + "/" + INDEX_NAME).retrieve().toBodilessEntity().block();
      indexExists = true;
    } catch (Exception e) {
      // 404 → 인덱스 없음 → 생성
      createIndex(client);
    }

    // 인덱스가 있지만 geo_point 매핑이 없으면 삭제 후 재생성
    if (indexExists && !isIndexMappingCurrent(client)) {
      log.info("[OpenSearch] geo_point 매핑 누락 - 인덱스 재생성");
      deleteIndex(client);
      indexExists = false;
    }

    if (!indexExists) {
      createIndex(client);
    }
  }

  private boolean isIndexMappingCurrent(WebClient client) {
    try {
      String response =
          client
              .get()
              .uri(opensearchUrl + "/" + INDEX_NAME + "/_mapping")
              .retrieve()
              .bodyToMono(String.class)
              .block();
      JsonNode node = objectMapper.readTree(response);
      String locationType =
          node.path(INDEX_NAME)
              .path("mappings")
              .path("properties")
              .path("location")
              .path("type")
              .asText("");
      return "geo_point".equals(locationType);
    } catch (Exception e) {
      return false;
    }
  }

  private void deleteIndex(WebClient client) {
    try {
      client
          .delete()
          .uri(opensearchUrl + "/" + INDEX_NAME)
          .retrieve()
          .bodyToMono(String.class)
          .block();
      log.info("[OpenSearch] 인덱스 '{}' 삭제 완료", INDEX_NAME);
    } catch (Exception e) {
      log.warn("[OpenSearch] 인덱스 삭제 실패: {}", e.getMessage());
    }
  }

  private void createIndex(WebClient client) {
    String mapping =
        """
        {
          "settings": {
            "index": {
              "number_of_shards": 1,
              "number_of_replicas": 0
            },
            "analysis": {
              "tokenizer": {
                "kor_tokenizer": {
                  "type": "nori_tokenizer",
                  "decompound_mode": "mixed"
                }
              },
              "analyzer": {
                "nori_analyzer": {
                  "type": "custom",
                  "tokenizer": "kor_tokenizer",
                  "filter": [
                    "lowercase",
                    "nori_readingform",
                    "nori_part_of_speech"
                  ]
                }
              }
            }
          },
          "mappings": {
            "properties": {
              "id":             {"type": "long"},
              "name":           {"type": "text", "analyzer": "nori_analyzer"},
              "nameChosung":    {"type": "keyword"},
              "address":        {"type": "text", "analyzer": "nori_analyzer"},
              "addressChosung": {"type": "keyword"},
              "latitude":       {"type": "double"},
              "longitude":      {"type": "double"},
              "location":       {"type": "geo_point"}
            }
          }
        }
        """;
    try {
      client
          .put()
          .uri(opensearchUrl + "/" + INDEX_NAME)
          .header("Content-Type", "application/json")
          .bodyValue(mapping)
          .retrieve()
          .bodyToMono(String.class)
          .block();
      log.info("[OpenSearch] 인덱스 '{}' 생성 완료", INDEX_NAME);
    } catch (Exception e) {
      log.warn("[OpenSearch] 인덱스 생성 실패: {}", e.getMessage());
    }
  }

  /** 인덱싱된 문서 개수 조회 */
  public long getIndexedCount() {
    try {
      String response =
          webClientBuilder
              .build()
              .get()
              .uri(opensearchUrl + "/" + INDEX_NAME + "/_count")
              .retrieve()
              .bodyToMono(String.class)
              .block();
      JsonNode node = objectMapper.readTree(response);
      return node.path("count").asLong(0);
    } catch (Exception e) {
      return 0;
    }
  }

  private String buildDocument(Toilet t) {
    try {
      String name = t.getName() != null ? t.getName() : "";
      String address = t.getAddress() != null ? t.getAddress() : "";
      return objectMapper.writeValueAsString(
          new java.util.LinkedHashMap<>() {
            {
              put("id", t.getId());
              put("name", name);
              put("nameChosung", ChosungUtils.extractChosung(name));
              put("address", address);
              put("addressChosung", ChosungUtils.extractChosung(address));
              put("latitude", t.getLocation().getY());
              put("longitude", t.getLocation().getX());
              put("location", Map.of("lat", t.getLocation().getY(), "lon", t.getLocation().getX()));
            }
          });
    } catch (Exception e) {
      log.warn("[OpenSearch] 문서 직렬화 실패 id={}: {}", t.getId(), e.getMessage());
      return "{}";
    }
  }

  private void cleanupOldIndex() {
    WebClient client = webClientBuilder.build();
    try {
      // 구버전 인덱스(toilets) 삭제 시도
      client.delete().uri(opensearchUrl + "/toilets").retrieve().toBodilessEntity().block();
      log.info("[OpenSearch] 구버전 인덱스 'toilets' 삭제 완료 - 클러스터 상태 녹색(Green) 전환 유도");
    } catch (Exception e) {
      // 이미 삭제되었거나 없으면 무시
    }
  }
}
