package com.daypoo.api.service;

import com.daypoo.api.dto.EquippedItemResponse;
import com.daypoo.api.dto.RankingResponse;
import com.daypoo.api.dto.UserRankResponse;
import com.daypoo.api.entity.HealthReportSnapshot;
import com.daypoo.api.entity.Title;
import com.daypoo.api.entity.User;
import com.daypoo.api.repository.HealthReportSnapshotRepository;
import com.daypoo.api.repository.InventoryRepository;
import com.daypoo.api.repository.PooRecordRepository;
import com.daypoo.api.repository.TitleRepository;
import com.daypoo.api.repository.UserRepository;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class RankingService {

  private final StringRedisTemplate redisTemplate;
  private final UserRepository userRepository;
  private final TitleRepository titleRepository;
  private final PooRecordRepository recordRepository;
  private final HealthReportSnapshotRepository snapshotRepository;
  private final InventoryRepository inventoryRepository;

  private static final String GLOBAL_RANK_KEY = "daypoo:rankings:global";
  private static final String HEALTH_RANK_KEY = "daypoo:rankings:health";
  private static final String REGION_RANK_KEY_PREFIX = "daypoo:rankings:region:";

  public void updateGlobalRank(User user) {
    if (user != null && user.getId() != null) {
      long recordCount = recordRepository.countByUser(user);
      long uniqueToilets = recordRepository.countDistinctToiletsByUser(user);
      double score = recordCount + uniqueToilets * 3.0;
      redisTemplate.opsForZSet().add(GLOBAL_RANK_KEY, user.getId().toString(), score);
    }
  }

  public void updateHealthRank(User user, double healthScore) {
    if (user != null && user.getId() != null) {
      redisTemplate.opsForZSet().add(HEALTH_RANK_KEY, user.getId().toString(), healthScore);
    }
  }

  public void updateRegionRank(User user, String regionName) {
    if (user != null && user.getId() != null) {
      long recordCount = recordRepository.countByUserAndRegionName(user, regionName);
      long uniqueToilets =
          recordRepository.countDistinctToiletsByUserAndRegionName(user, regionName);
      double score = recordCount + uniqueToilets * 3.0;
      String key = REGION_RANK_KEY_PREFIX + regionName;
      redisTemplate.opsForZSet().add(key, user.getId().toString(), score);
    }
  }

  public RankingResponse getGlobalRanking(User myUser) {
    checkAndInitialize(GLOBAL_RANK_KEY);
    return getRankingFromRedis(GLOBAL_RANK_KEY, myUser);
  }

  public RankingResponse getHealthRanking(User myUser) {
    checkAndInitialize(HEALTH_RANK_KEY);
    return getRankingFromRedis(HEALTH_RANK_KEY, myUser);
  }

  public RankingResponse getRegionRanking(User myUser, String regionName) {
    String key = REGION_RANK_KEY_PREFIX + regionName;
    checkAndInitialize(key);
    return getRankingFromRedis(key, myUser);
  }

  @EventListener(ApplicationReadyEvent.class)
  public void onApplicationReady() {
    log.info("[Ranking] ApplicationReadyEvent: 랭킹 재구축 수행");
    rebuildAllRankings();
  }

  @Scheduled(cron = "0 0 4 * * *")
  public void scheduledRankingRebuild() {
    log.info("[Ranking] 스케줄 랭킹 재구축 수행 (매일 04:00)");
    rebuildAllRankings();
  }

  public void rebuildAllRankings() {
    log.info("[Ranking] 전체 랭킹 재구축 시작...");

    // 1. 기존 키 삭제
    redisTemplate.delete(GLOBAL_RANK_KEY);
    redisTemplate.delete(HEALTH_RANK_KEY);
    Set<String> regionKeys = redisTemplate.keys(REGION_RANK_KEY_PREFIX + "*");
    if (regionKeys != null && !regionKeys.isEmpty()) {
      redisTemplate.delete(regionKeys);
    }

    // 2. DB 기반 재구축
    initializeRankingsFromDb(GLOBAL_RANK_KEY);
    initializeRankingsFromDb(HEALTH_RANK_KEY);

    // 3. 지역별 재구축
    List<String> regions = recordRepository.findDistinctRegionNames();
    for (String region : regions) {
      if (region != null && !region.isBlank()) {
        initializeRankingsFromDb(REGION_RANK_KEY_PREFIX + region);
      }
    }

    log.info("[Ranking] 전체 랭킹 재구축 완료.");
  }

  public RankingResponse getGlobalRanking() {
    return getGlobalRanking(null);
  }

  private void checkAndInitialize(String key) {
    Long size = redisTemplate.opsForZSet().size(key);
    if (size == null || size == 0) {
      if (key.equals(GLOBAL_RANK_KEY)
          || key.equals(HEALTH_RANK_KEY)
          || key.startsWith(REGION_RANK_KEY_PREFIX)) {
        initializeRankingsFromDb(key);
      }
    }
  }

  private void initializeRankingsFromDb(String key) {
    log.info("Redis [Ranking] empty: initializing for key {}", key);
    if (key.equals(HEALTH_RANK_KEY)) {
      LocalDateTime startOfDay = LocalDateTime.now().with(LocalTime.MIN);
      LocalDateTime endOfDay = LocalDateTime.now().with(LocalTime.MAX);
      List<HealthReportSnapshot> snapshots =
          snapshotRepository.findTodayDailySnapshots(startOfDay, endOfDay);
      for (HealthReportSnapshot snippet : snapshots) {
        updateHealthRank(snippet.getUser(), snippet.getHealthScore());
      }
    } else {
      List<User> topUsers = userRepository.findAll(PageRequest.of(0, 200)).getContent();
      for (User user : topUsers) {
        if (key.startsWith(REGION_RANK_KEY_PREFIX)) {
          String region = key.replace(REGION_RANK_KEY_PREFIX, "");
          updateRegionRank(user, region);
        } else {
          updateGlobalRank(user);
        }
      }
    }
  }

  private RankingResponse getRankingFromRedis(String key, User myUser) {
    Set<ZSetOperations.TypedTuple<String>> topRankersRaw =
        redisTemplate.opsForZSet().reverseRangeWithScores(key, 0, 9);

    Long activeUserCount = redisTemplate.opsForZSet().size(key);
    if (activeUserCount == null) {
      activeUserCount = 0L;
    }

    if (topRankersRaw == null || topRankersRaw.isEmpty()) {
      return RankingResponse.builder()
          .topRankers(new ArrayList<>())
          .myRank(null)
          .activeUserCount(activeUserCount)
          .build();
    }

    // N+1 Optimization: Batch fetch users and titles
    List<Long> userIds =
        topRankersRaw.stream()
            .map(tuple -> Long.valueOf(Objects.requireNonNull(tuple.getValue())))
            .collect(Collectors.toList());

    List<User> users = userRepository.findAllById(userIds);
    java.util.Map<Long, User> userMap =
        users.stream().collect(Collectors.toMap(User::getId, u -> u));

    java.util.Set<Long> titleIds =
        users.stream()
            .map(User::getEquippedTitleId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

    if (myUser != null && myUser.getEquippedTitleId() != null) {
      titleIds.add(myUser.getEquippedTitleId());
    }

    java.util.Map<Long, String> titleMap =
        titleRepository.findAllById(titleIds).stream()
            .collect(Collectors.toMap(Title::getId, Title::getName));

    // Batch-fetch equipped items for all top rankers
    java.util.Map<Long, List<EquippedItemResponse>> equippedItemsMap =
        inventoryRepository.findEquippedByUserIn(users).stream()
            .collect(
                Collectors.groupingBy(
                    inv -> inv.getUser().getId(),
                    Collectors.mapping(
                        inv ->
                            new EquippedItemResponse(
                                inv.getItem().getImageUrl(),
                                inv.getItem().getName(),
                                inv.getItem().getType().name()),
                        Collectors.toList())));

    List<UserRankResponse> topRankers =
        topRankersRaw.stream()
            .map(
                tuple -> {
                  Long userId = Long.valueOf(tuple.getValue());
                  User user = userMap.get(userId);
                  if (user == null) return null;

                  Long rank = redisTemplate.opsForZSet().reverseRank(key, userId.toString());
                  String titleName = titleMap.getOrDefault(user.getEquippedTitleId(), "새내기 쾌변러");

                  return UserRankResponse.builder()
                      .userId(userId)
                      .nickname(user.getNickname())
                      .titleName(titleName)
                      .level(user.getLevel())
                      .score(tuple.getScore() != null ? tuple.getScore().longValue() : 0L)
                      .rank((rank != null ? rank : 0L) + 1L)
                      .equippedItems(equippedItemsMap.getOrDefault(userId, List.of()))
                      .build();
                })
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

    UserRankResponse myRank = null;
    if (myUser != null && myUser.getId() != null) {
      Long myRankRaw = redisTemplate.opsForZSet().reverseRank(key, myUser.getId().toString());
      Double myScoreRaw = redisTemplate.opsForZSet().score(key, myUser.getId().toString());
      String myTitleName = titleMap.getOrDefault(myUser.getEquippedTitleId(), "새내기 쾌변러");

      myRank =
          UserRankResponse.builder()
              .userId(myUser.getId())
              .nickname(myUser.getNickname())
              .titleName(myTitleName)
              .level(myUser.getLevel())
              .score(myScoreRaw != null ? myScoreRaw.longValue() : 0L)
              .rank((myRankRaw != null ? myRankRaw : 0L) + 1L)
              .equippedItems(List.of())
              .build();
    }

    return RankingResponse.builder()
        .topRankers(topRankers)
        .myRank(myRank)
        .activeUserCount(activeUserCount)
        .build();
  }
}
