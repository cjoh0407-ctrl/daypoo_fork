package com.daypoo.api.service;

import com.daypoo.api.dto.RankingResponse;
import com.daypoo.api.dto.UserRankResponse;
import com.daypoo.api.entity.Title;
import com.daypoo.api.entity.User;
import com.daypoo.api.repository.TitleRepository;
import com.daypoo.api.repository.UserRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class RankingService {

  private final StringRedisTemplate redisTemplate;
  private final UserRepository userRepository;
  private final TitleRepository titleRepository;

  private static final String GLOBAL_RANK_KEY = "daypoo:rankings:global";
  private static final String HEALTH_RANK_KEY = "daypoo:rankings:health";
  private static final String REGION_RANK_KEY_PREFIX = "daypoo:rankings:region:";

  public void updateGlobalRank(User user) {
    if (user != null && user.getId() != null) {
      redisTemplate
          .opsForZSet()
          .add(GLOBAL_RANK_KEY, user.getId().toString(), (double) user.getPoints());
    }
  }

  public void updateHealthRank(User user, double healthScore) {
    if (user != null && user.getId() != null) {
      redisTemplate.opsForZSet().add(HEALTH_RANK_KEY, user.getId().toString(), healthScore);
    }
  }

  public void updateRegionRank(User user, String regionName, double score) {
    if (user != null && user.getId() != null) {
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
    List<User> topUsers = userRepository.findAllByOrderByPointsDesc(PageRequest.of(0, 100));
    for (User user : topUsers) {
      if (key.contains("health")) {
        updateHealthRank(user, 60 + Math.random() * 40);
      } else if (key.contains("region")) {
        String region = key.replace(REGION_RANK_KEY_PREFIX, "");
        updateRegionRank(user, region, 10 + Math.random() * 90);
      } else {
        updateGlobalRank(user);
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
              .build();
    }

    return RankingResponse.builder()
        .topRankers(topRankers)
        .myRank(myRank)
        .activeUserCount(activeUserCount)
        .build();
  }
}
