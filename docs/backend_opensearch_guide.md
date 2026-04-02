# 백엔드 OpenSearch 인덱스 설정 동기화 가이드

현재 프로젝트의 `ToiletIndexingService.java` 파일에는 인덱스 생성 로직이 하드코딩되어 있습니다. 더 나은 형태소 분석 및 클러스터 상태(Green)를 유지하기 위해 다음 코드를 직접 수정해 주시기 바랍니다.

## 수정 대상 파일
`backend/src/main/java/com/daypoo/api/service/ToiletIndexingService.java`

## 1. 분석기 및 클러스터 상태 설정 수정 (L114-136)

기존 `createIndex` 메서드의 `mapping` 문자열을 아래와 같이 업데이트하세요.

```java
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
                  "filter": ["lowercase", "nori_readingform", "nori_part_of_speech"]
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
    // ... 생략
  }
```

### 주요 변경 사항 설명:
1. **`number_of_replicas: 0`**: 현재 1개의 노드로 구성된 클러스터에서 레플리카를 생성할 수 없어 상태가 **노란색(Yellow)**으로 표시되는 문제를 해결합니다.
2. **`nori_analyzer` 커스텀 설정**: 요청하신 대로 `nori_tokenizer`를 사용하며 `mixed` 모드로 복합 명사까지 상세히 분석하도록 설정했습니다.
3. **`location: geo_point`**: 위치 정보를 기반으로 한 거리에 따른 정렬 기능을 위해 타입을 전문 위치 정보 타입으로 변경했습니다.

## 2. 문서 빌드 형식 수정 (L169-188)

`location` 데이터가 `geo_point` 형식을 따르도록 `buildDocument` 메서드를 수정하세요.

```java
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
              // location 필드 추가 (geo_point 규격)
              put("location", new java.util.HashMap<String, Double>() {{
                  put("lat", t.getLocation().getY());
                  put("lon", t.getLocation().getX());
              }});
            }
          });
    } catch (Exception e) {
        // ... 생략
    }
  }
```

---
**주의**: 위 수정을 마친 후에는 기존 인덱스를 삭제하고 다시 인덱싱해야 설정이 반영됩니다. (이미 작성해 드린 `scripts/init_opensearch_nori.sh`를 활용하세요.)
