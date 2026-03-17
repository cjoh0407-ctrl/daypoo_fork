package com.daypoo.api.service;

import com.daypoo.api.entity.Toilet;
import com.daypoo.api.repository.ToiletRepository;
import com.daypoo.api.global.GeometryUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PublicDataSyncService {

    private final ToiletRepository toiletRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final GeometryUtil geometryUtil;
    private final StringRedisTemplate redisTemplate;

    @Value("${public-data.api-key}")
    private String apiKey;

    // 행정안전부 공중화장실정보 조회서비스 최신 API URL
    private static final String API_URL = "https://apis.data.go.kr/1741000/public_restroom_info/info";
    private static final String REDIS_GEO_KEY = "daypoo:toilets:geo";

    /**
     * 행정안전부 API로부터 화장실 데이터를 가져와 DB와 Redis에 동기화합니다.
     */
    @Transactional
    public int syncToiletData(int pageNo, int numOfRows) {
        try {
            // 1. URI 생성 (명세서 규격 준수)
            URI uri = UriComponentsBuilder.fromHttpUrl(API_URL)
                    .queryParam("serviceKey", apiKey)
                    .queryParam("pageNo", pageNo)
                    .queryParam("numOfRows", numOfRows)
                    .queryParam("returnType", "json")
                    .build(true).toUri();

            log.info("Fetching public toilet data (WGS84) from API... Page: {}, Rows: {}", pageNo, numOfRows);
            ResponseEntity<String> response = restTemplate.getForEntity(uri, String.class);

            // 2. JSON 파싱 (명세서: response.body.items.item)
            JsonNode rootNode = objectMapper.readTree(response.getBody());
            
            // resultCode 검증 (0: 성공)
            String resultCode = rootNode.path("response").path("header").path("resultCode").asText("");
            if (!resultCode.equals("0") && !resultCode.equals("00") && !resultCode.equals("200")) {
                String resultMsg = rootNode.path("response").path("header").path("resultMsg").asText("Unknown Error");
                log.error("API Error: {} (code: {})", resultMsg, resultCode);
                throw new RuntimeException("공공데이터 API 호출 실패: " + resultMsg);
            }

            JsonNode itemsNode = rootNode.path("response").path("body").path("items").path("item");

            List<Toilet> toiletsToSave = new ArrayList<>();

            if (itemsNode.isArray()) {
                for (JsonNode item : itemsNode) {
                    try {
                        // 명세서 필드 매핑
                        String name = item.path("RSTRM_NM").asText("이름 없음");
                        String roadAddr = item.path("LCTN_ROAD_NM_ADDR").asText("");
                        String landAddr = item.path("LCTN_LOTNO_ADDR").asText("");
                        String address = !roadAddr.isEmpty() ? roadAddr : landAddr;
                        
                        String openHours = item.path("OPN_HR").asText("상시개방");
                        boolean is24h = openHours.contains("24") || openHours.contains("상시");

                        // 명세서 위경도 필드: WGS84_LAT, WGS84_LOT
                        double lat = item.path("WGS84_LAT").asDouble(0.0);
                        double lon = item.path("WGS84_LOT").asDouble(0.0);

                        // 대한민국 바운더리 검증 (위도 33~39, 경도 124~132)
                        if (lat >= 33.0 && lat <= 39.0 && lon >= 124.0 && lon <= 132.0) {
                            Toilet toilet = Toilet.builder()
                                    .name(name)
                                    .location(geometryUtil.createPoint(lon, lat))
                                    .address(address)
                                    .openHours(openHours)
                                    .is24h(is24h)
                                    .isUnisex(false)
                                    .build();
                                    
                            toiletsToSave.add(toilet);
                        }
                    } catch (Exception e) {
                        log.warn("Error parsing toilet item: {}", e.getMessage());
                    }
                }
            }

            // 3. DB 및 Redis 저장
            if (!toiletsToSave.isEmpty()) {
                List<Toilet> savedToilets = toiletRepository.saveAll(toiletsToSave);
                log.info("Successfully synced {} toilets to DB.", savedToilets.size());
                
                addToRedisGeo(savedToilets);
                return savedToilets.size();
            }
            
            return 0;

        } catch (Exception e) {
            log.error("Failed to sync toilet data: {}", e.getMessage(), e);
            throw new RuntimeException("화장실 데이터 동기화 중 오류 발생", e);
        }
    }

    private void addToRedisGeo(List<Toilet> toilets) {
        log.info("Updating Redis Geo Index for {} toilets...", toilets.size());
        for (Toilet t : toilets) {
            double lon = t.getLocation().getX();
            double lat = t.getLocation().getY();
            redisTemplate.opsForGeo().add(REDIS_GEO_KEY, new org.springframework.data.geo.Point(lon, lat), t.getId().toString());
        }
    }
}
