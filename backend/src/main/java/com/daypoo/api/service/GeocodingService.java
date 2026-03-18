package com.daypoo.api.service;

import com.daypoo.api.global.GeometryUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Point;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeocodingService {

  private final RestTemplate restTemplate;
  private final ObjectMapper objectMapper;
  private final GeometryUtil geometryUtil;

  @Value("${kakao.client-id}") // REST API 키로 활용
  private String kakaoApiKey;

  private static final String KAKAO_GEOCODE_URL =
      "https://dapi.kakao.com/v2/local/search/address.json";

  /** 주소를 받아 위경도 좌표(Point)를 반환합니다. */
  public Point geocodeAddress(String address) {
    if (address == null || address.trim().isEmpty()) {
      return null;
    }

    try {
      URI uri =
          UriComponentsBuilder.fromUriString(KAKAO_GEOCODE_URL)
              .queryParam("query", address)
              .build()
              .toUri();

      HttpHeaders headers = new HttpHeaders();
      headers.set("Authorization", "KakaoAK " + kakaoApiKey);
      HttpEntity<String> entity = new HttpEntity<>(headers);

      log.info("Requesting Kakao Geocoding for address: {}", address);
      ResponseEntity<String> response =
          restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);

      JsonNode rootNode = objectMapper.readTree(response.getBody());
      JsonNode documents = rootNode.path("documents");

      if (documents.isArray() && !documents.isEmpty()) {
        JsonNode firstDoc = documents.get(0);
        double lon = firstDoc.path("x").asDouble(0.0);
        double lat = firstDoc.path("y").asDouble(0.0);

        if (lat != 0.0 && lon != 0.0) {
          return geometryUtil.createPoint(lon, lat);
        }
      }

      log.warn("No geocoding result found for address: {}", address);
      return null;

    } catch (Exception e) {
      log.error("Failed to geocode address: {}. Error: {}", address, e.getMessage());
      return null;
    }
  }
}
