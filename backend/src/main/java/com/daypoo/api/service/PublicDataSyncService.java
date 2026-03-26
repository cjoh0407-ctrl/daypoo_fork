package com.daypoo.api.service;

import com.daypoo.api.dto.SyncStatusResponse;
import com.daypoo.api.entity.Toilet;
import com.daypoo.api.global.GeometryUtil;
import com.daypoo.api.repository.ToiletRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.PreparedStatement;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Point;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.util.retry.Retry;

@Slf4j
@Service
public class PublicDataSyncService {

  private final ObjectMapper objectMapper;
  private final GeometryUtil geometryUtil;
  private final StringRedisTemplate redisTemplate;
  private final JdbcTemplate jdbcTemplate;
  private final PlatformTransactionManager transactionManager;
  private final WebClient webClient;

  @Value("${public-data.api-key}")
  private String apiKey;

  private static final String REDIS_GEO_KEY = "daypoo:toilets:geo";
  private static final int BATCH_SIZE = 500;
  private static final int MAX_CONCURRENT_REQUESTS = 10;
  private static final DateTimeFormatter DATE_TIME_FORMATTER =
      DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

  // Status tracking fields
  private volatile String syncStatus = "IDLE";
  private volatile Integer lastCount = null;
  private volatile String startedAt = null;
  private volatile String completedAt = null;
  private volatile String errorMessage = null;

  public PublicDataSyncService(
      ToiletRepository toiletRepository,
      ObjectMapper objectMapper,
      GeometryUtil geometryUtil,
      StringRedisTemplate redisTemplate,
      JdbcTemplate jdbcTemplate,
      PlatformTransactionManager transactionManager,
      @Value("${public-data.url}") String apiUrl) {
    this.objectMapper = objectMapper;
    this.geometryUtil = geometryUtil;
    this.redisTemplate = redisTemplate;
    this.jdbcTemplate = jdbcTemplate;
    this.transactionManager = transactionManager;
    this.webClient = WebClient.builder().baseUrl(apiUrl).build();
  }

  /** 매일 새벽 3시에 공공데이터 전체 동기화를 실행합니다. 서버 시작 시에는 toilet 데이터가 없는 경우에만 소규모 동기화를 수행합니다. */
  @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 3 * * *")
  public void scheduledSync() {
    log.info("🕒 [Scheduled] Starting daily public data sync...");
    try {
      int saved = syncAllToilets(1, 30);
      log.info("✅ [Scheduled] Daily sync completed. New toilets: {}", saved);
    } catch (Exception e) {
      log.error("❌ [Scheduled] Daily sync failed: {}", e.getMessage());
    }
  }

  /** [초고속 모드] 가상 스레드와 병렬 파이프라이닝을 사용하여 데이터를 동기화합니다. */
  public int syncAllToilets(int startPage, int endPage) {
    AtomicInteger totalSavedCount = new AtomicInteger(0);

    log.info(
        "🚀 Starting public data sync using Virtual Threads (pages: {}-{}, concurrent: {})...",
        startPage,
        endPage,
        MAX_CONCURRENT_REQUESTS);

    TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);

    try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
      Semaphore semaphore = new Semaphore(MAX_CONCURRENT_REQUESTS);
      List<CompletableFuture<Void>> futures = new ArrayList<>();

      for (int page = startPage; page <= endPage; page++) {
        int currentPage = page;
        futures.add(
            CompletableFuture.runAsync(
                () -> {
                  try {
                    semaphore.acquire();
                    // findAllMngNos() 전체 로딩 대신 페이지별 IN 쿼리로 중복 체크
                    int saved =
                        syncToiletDataWithInQuery(currentPage, BATCH_SIZE, transactionTemplate);
                    totalSavedCount.addAndGet(saved);
                    if (currentPage % 10 == 0) {
                      log.info(
                          "📈 Progress: {}/{} pages processed. Total new: {}",
                          currentPage,
                          endPage,
                          totalSavedCount.get());
                    }
                  } catch (Exception e) {
                    log.error("⚠️ Error processing page {}: {}", currentPage, e.getMessage());
                  } finally {
                    semaphore.release();
                  }
                },
                executor));
      }

      CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
    }

    log.info("🏁 Sync Finished. Total new toilets added: {}", totalSavedCount.get());
    return totalSavedCount.get();
  }

  /** 상태 조회 메서드 */
  public SyncStatusResponse getSyncStatus() {
    return SyncStatusResponse.builder()
        .status(syncStatus)
        .totalCount(lastCount)
        .startedAt(startedAt)
        .completedAt(completedAt)
        .errorMessage(errorMessage)
        .build();
  }

  /** 비동기 실행 메서드 (기존 syncAllToilets 재사용) */
  @Async("taskExecutor")
  public void syncAllToiletsAsync(int startPage, int endPage) {
    syncStatus = "RUNNING";
    startedAt = LocalDateTime.now().format(DATE_TIME_FORMATTER);
    completedAt = null;
    errorMessage = null;
    lastCount = null;

    try {
      log.info("📢 Starting background sync: {} - {}", startPage, endPage);
      int count = syncAllToilets(startPage, endPage);
      lastCount = count;
      syncStatus = "COMPLETED";
      completedAt = LocalDateTime.now().format(DATE_TIME_FORMATTER);
      log.info("✅ Background sync finished. Count: {}", count);
    } catch (Exception e) {
      log.error("❌ Background sync failed: {}", e.getMessage());
      syncStatus = "FAILED";
      errorMessage = e.getMessage();
      completedAt = LocalDateTime.now().format(DATE_TIME_FORMATTER);
    }
  }

  /** 단일 페이지 동기화를 위한 호환성 메서드 */
  public int syncToiletData(int pageNo, int numOfRows) throws Exception {
    TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);
    // 단일 페이지 호출 시에는 해당 페이지의 MNG_NO만 DB에서 조회하여 중복 체크 (메모리 낭비 방지)
    return syncToiletDataWithInQuery(pageNo, numOfRows, transactionTemplate);
  }

  private int syncToiletDataWithInQuery(
      int pageNo, int numOfRows, TransactionTemplate transactionTemplate) throws Exception {
    String responseBody = fetchResponseBody(pageNo, numOfRows);
    JsonNode rootNode = objectMapper.readTree(responseBody);
    JsonNode bodyNode = rootNode.path("response").path("body");
    if (bodyNode.isMissingNode()) return 0;

    JsonNode itemsNode = bodyNode.path("items").path("item");
    if (!itemsNode.isArray() || itemsNode.isEmpty()) return 0;

    List<JsonNode> itemList = new ArrayList<>();
    for (JsonNode item : itemsNode) {
      String mngNo = item.path("MNG_NO").asText("");
      if (!mngNo.isEmpty()) {
        itemList.add(item);
      }
    }

    List<Toilet> toiletsToSave = convertToToiletEntities(itemList);

    if (!toiletsToSave.isEmpty()) {
      transactionTemplate.execute(
          status -> {
            bulkInsertToilets(toiletsToSave);
            return null;
          });
      addToRedisGeoBulk(toiletsToSave);
      return toiletsToSave.size();
    }
    return 0;
  }

  private String fetchResponseBody(int pageNo, int numOfRows) {
    return webClient
        .get()
        .uri(
            uriBuilder ->
                uriBuilder
                    .path("")
                    .queryParam("serviceKey", apiKey)
                    .queryParam("pageNo", pageNo)
                    .queryParam("numOfRows", numOfRows)
                    .queryParam("returnType", "json")
                    .build())
        .retrieve()
        .bodyToMono(String.class)
        .retryWhen(Retry.backoff(2, Duration.ofSeconds(1)).maxBackoff(Duration.ofSeconds(5)))
        .block();
  }

  private List<Toilet> convertToToiletEntities(List<JsonNode> itemList) {
    List<Toilet> toiletsToSave = new ArrayList<>();
    Set<String> processedMngNos = new HashSet<>();
    for (JsonNode item : itemList) {
      String mngNo = item.path("MNG_NO").asText("");
      if (mngNo.isEmpty() || processedMngNos.contains(mngNo)) continue;

      double lat = item.path("WGS84_LAT").asDouble(0.0);
      double lon = item.path("WGS84_LOT").asDouble(0.0);
      Point location =
          (lat >= 33.0 && lat <= 39.0 && lon >= 124.0 && lon <= 132.0)
              ? geometryUtil.createPoint(lon, lat)
              : null;

      toiletsToSave.add(
          Toilet.builder()
              .name(item.path("RSTRM_NM").asText("이름 없음"))
              .mngNo(mngNo)
              .location(location)
              .address(
                  item.path("LCTN_ROAD_NM_ADDR").asText(item.path("LCTN_LOTNO_ADDR").asText("")))
              .openHours(item.path("OPN_HR").asText("상시개방"))
              .is24h(
                  item.path("OPN_HR").asText("").contains("24")
                      || item.path("OPN_HR").asText("").contains("상시"))
              .isUnisex(false)
              .build());

      processedMngNos.add(mngNo);
    }
    return toiletsToSave;
  }

  private void bulkInsertToilets(List<Toilet> toilets) {
    // 3. Multi-row Insert/Update (Upsert) 최적화
    String sql =
        "INSERT INTO toilets (name, mng_no, location, address, open_hours, is_24h, is_unisex, created_at, updated_at) "
            + "VALUES (?, ?, ST_GeomFromText(?, 4326), ?, ?, ?, ?, NOW(), NOW()) "
            + "ON CONFLICT (mng_no) DO UPDATE SET "
            + "  name        = EXCLUDED.name, "
            + "  location    = EXCLUDED.location, "
            + "  address     = EXCLUDED.address, "
            + "  open_hours  = EXCLUDED.open_hours, "
            + "  is_24h      = EXCLUDED.is_24h, "
            + "  is_unisex   = EXCLUDED.is_unisex, "
            + "  updated_at  = NOW()";

    jdbcTemplate.batchUpdate(
        sql,
        new org.springframework.jdbc.core.BatchPreparedStatementSetter() {
          @Override
          public void setValues(PreparedStatement ps, int i) throws java.sql.SQLException {
            Toilet t = toilets.get(i);
            ps.setString(1, t.getName());
            ps.setString(2, t.getMngNo());
            ps.setString(3, t.getLocation() != null ? t.getLocation().toText() : null);
            ps.setString(4, t.getAddress());
            ps.setString(5, t.getOpenHours());
            ps.setBoolean(6, t.is24h());
            ps.setBoolean(7, t.isUnisex());
          }

          @Override
          public int getBatchSize() {
            return toilets.size();
          }
        });
  }

  private void addToRedisGeoBulk(List<Toilet> toilets) {
    // 4. Redis Bulk Geo Indexing (네트워크 RTT 최소화)
    Map<String, org.springframework.data.geo.Point> memberCoordsMap = new HashMap<>();
    for (Toilet t : toilets) {
      if (t.getLocation() != null) {
        memberCoordsMap.put(
            t.getMngNo(),
            new org.springframework.data.geo.Point(t.getLocation().getX(), t.getLocation().getY()));
      }
    }

    if (!memberCoordsMap.isEmpty()) {
      try {
        redisTemplate.opsForGeo().add(REDIS_GEO_KEY, memberCoordsMap);
      } catch (Exception e) {
        log.warn("Failed to add geo data to Redis bulk: {}", e.getMessage());
      }
    }
  }
}
