package com.daypoo.api.service;

import com.daypoo.api.entity.Toilet;
import com.daypoo.api.global.GeometryUtil;
import com.daypoo.api.repository.ToiletRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Slf4j
@Service
@RequiredArgsConstructor
public class PublicDataSyncService {

  private final ToiletRepository toiletRepository;
  private final RestTemplate restTemplate;
  private final ObjectMapper objectMapper;
  private final GeometryUtil geometryUtil;
  private final StringRedisTemplate redisTemplate;
  private final JdbcTemplate jdbcTemplate;

  @Value("${public-data.api-key}")
  private String apiKey;

  @Value("${public-data.url}")
  private String apiUrl;

  private static final String REDIS_GEO_KEY = "daypoo:toilets:geo";

  /** [완주 모드] 공공데이터 전체를 자동으로 수집합니다. 에러가 발생해도 중단되지 않고 다음 페이지로 전진합니다. */
  public int syncAllToilets(int startPage) {
    int totalSavedCount = 0;
    int currentPage = startPage;
    int pageSize = 500;
    int targetMaxPage = 1000; // 500개씩 1000페이지 = 50만 건 (충분한 범위)

    log.info("🚀 Starting AUTO-PILOT public data sync from page {}...", startPage);

    while (currentPage <= targetMaxPage) {
      try {
        int savedInPage = syncToiletData(currentPage, pageSize);
        totalSavedCount += savedInPage;

        if (savedInPage > 0) {
          log.info(
              "✅ Page {} processed. {} new toilets saved. Total saved in this batch: {}",
              currentPage,
              savedInPage,
              totalSavedCount);
        } else {
          log.debug("Skip Page {} (All duplicates or empty)", currentPage);
        }

        // 500개 미만의 데이터가 오는 지점이 실제 끝일 가능성이 높음 (옵션: 0개일 때 일정 횟수 반복 후 종료 가능)

        currentPage++;
        Thread.sleep(500); // API 서버 보호를 위한 지연

      } catch (Exception e) {
        log.error("⚠️ Error at page {}: {}. Moving to next page...", currentPage, e.getMessage());
        currentPage++; // 에러가 나도 다음 페이지로!
        try {
          Thread.sleep(1000);
        } catch (InterruptedException ie) {
        }
      }
    }

    log.info("🏁 AUTO-PILOT Sync Task Finished. Total new toilets added: {}", totalSavedCount);
    return totalSavedCount;
  }

  private void bulkInsertToilets(List<Toilet> toilets) {
    String sql =
        "INSERT INTO toilets (name, mng_no, location, address, open_hours, is_24h, is_unisex, created_at, updated_at) "
            + "VALUES (?, ?, ST_GeomFromText(?, 4326), ?, ?, ?, ?, ?, ?)";

    jdbcTemplate.batchUpdate(
        sql,
        new org.springframework.jdbc.core.BatchPreparedStatementSetter() {
          @Override
          public void setValues(PreparedStatement ps, int i) throws java.sql.SQLException {
            Toilet toilet = toilets.get(i);
            ps.setString(1, toilet.getName());
            ps.setString(2, toilet.getMngNo());
            ps.setString(3, toilet.getLocation() != null ? toilet.getLocation().toText() : null);
            ps.setString(4, toilet.getAddress());
            ps.setString(5, toilet.getOpenHours());
            ps.setBoolean(6, toilet.is24h());
            ps.setBoolean(7, toilet.isUnisex());
            ps.setTimestamp(8, Timestamp.valueOf(LocalDateTime.now()));
            ps.setTimestamp(9, Timestamp.valueOf(LocalDateTime.now()));
          }

          @Override
          public int getBatchSize() {
            return toilets.size();
          }
        });
  }

  @Transactional
  public int syncToiletData(int pageNo, int numOfRows) throws Exception {
    URI uri =
        UriComponentsBuilder.fromUriString(apiUrl)
            .queryParam("serviceKey", apiKey)
            .queryParam("pageNo", pageNo)
            .queryParam("numOfRows", numOfRows)
            .queryParam("returnType", "json")
            .build(true)
            .toUri();

    ResponseEntity<String> response = restTemplate.getForEntity(uri, String.class);
    JsonNode rootNode = objectMapper.readTree(response.getBody());

    JsonNode bodyNode = rootNode.path("response").path("body");
    if (bodyNode.isMissingNode()) return 0;

    JsonNode itemsNode = bodyNode.path("items").path("item");
    if (!itemsNode.isArray() || itemsNode.isEmpty()) return 0;

    List<JsonNode> itemList = new ArrayList<>();
    List<String> mngNosInPage = new ArrayList<>();

    for (JsonNode item : itemsNode) {
      String mngNo = item.path("MNG_NO").asText("");
      if (!mngNo.isEmpty()) {
        itemList.add(item);
        mngNosInPage.add(mngNo);
      }
    }

    List<String> existingMngNos = toiletRepository.findAllMngNoIn(mngNosInPage);
    Set<String> existingSet = new HashSet<>(existingMngNos);

    List<Toilet> toiletsToSave = new ArrayList<>();
    for (JsonNode item : itemList) {
      String mngNo = item.path("MNG_NO").asText();
      if (existingSet.contains(mngNo)) continue;

      String name = item.path("RSTRM_NM").asText("이름 없음");
      String address =
          item.path("LCTN_ROAD_NM_ADDR").asText(item.path("LCTN_LOTNO_ADDR").asText(""));
      double lat = item.path("WGS84_LAT").asDouble(0.0);
      double lon = item.path("WGS84_LOT").asDouble(0.0);

      org.locationtech.jts.geom.Point location = null;
      if (lat >= 33.0 && lat <= 39.0 && lon >= 124.0 && lon <= 132.0) {
        location = geometryUtil.createPoint(lon, lat);
      }

      toiletsToSave.add(
          Toilet.builder()
              .name(name)
              .mngNo(mngNo)
              .location(location)
              .address(address)
              .openHours(item.path("OPN_HR").asText("상시개방"))
              .is24h(address.contains("24") || address.contains("상시"))
              .isUnisex(false)
              .build());
    }

    if (!toiletsToSave.isEmpty()) {
      bulkInsertToilets(toiletsToSave);
      addToRedisGeoBulk(toiletsToSave);
      return toiletsToSave.size();
    }
    return 0;
  }

  private void addToRedisGeoBulk(List<Toilet> toilets) {
    for (Toilet t : toilets) {
      if (t.getLocation() != null) {
        try {
          redisTemplate
              .opsForGeo()
              .add(
                  REDIS_GEO_KEY,
                  new org.springframework.data.geo.Point(
                      t.getLocation().getX(), t.getLocation().getY()),
                  t.getMngNo());
        } catch (Exception e) {
        }
      }
    }
  }
}
