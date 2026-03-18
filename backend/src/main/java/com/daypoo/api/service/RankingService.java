package com.daypoo.api.service;

import com.daypoo.api.dto.RankingResponse;
import com.daypoo.api.dto.UserRankResponse;
import com.daypoo.api.entity.User;
import com.daypoo.api.repository.UserRepository;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class RankingService {

  private final StringRedisTemplate redisTemplate;
  private final UserRepository userRepository;

  private static final String GLOBAL_RANK_KEY = "daypoo:rankings:global";
  private static final String REGION_RANK_KEY_PREFIX = "daypoo:rankings:region:";

  /** 유저의 포인트 점수를 랭킹에 업데이트 (ZADD) */
  public void updateGlobalRank(User user) {
    redisTemplate.opsForZSet().add(GLOBAL_RANK_KEY, user.getId().toString(), user.getPoints());
  }

  /** 유저의 특정 지역 포인트 점수를 랭킹에 업데이트 */
  public void updateRegionRank(User user, String regionName) {
    String key = REGION_RANK_KEY_PREFIX + regionName;
    // 지역 랭킹은 해당 지역에서의 총 방문 횟수 또는 획득 포인트를 기준으로 할 수 있음
    // 여기서는 유저의 해당 지역 방문 포인트(누적)를 가정
    redisTemplate.opsForZSet().incrementScore(key, user.getId().toString(), 5.0); // 방문당 5점 가점
  }

  /** 전체 랭킹 조회 (상위 10명 + 내 순위) */
  public RankingResponse getGlobalRanking(User myUser) {
    return getRankingFromRedis(GLOBAL_RANK_KEY, myUser);
  }

  /** 지역 랭킹 조회 */
  public RankingResponse getRegionRanking(User myUser, String regionName) {
    return getRankingFromRedis(REGION_RANK_KEY_PREFIX + regionName, myUser);
  }

  private RankingResponse getRankingFromRedis(String key, User myUser) {
    // 상위 10명 추출 (DESC 정렬)
    Set<ZSetOperations.TypedTuple<String>> topRankersRaw =
        redisTemplate.opsForZSet().reverseRangeWithScores(key, 0, 9);

    List<UserRankResponse> topRankers =
        Objects.requireNonNull(topRankersRaw).stream()
            .map(
                tuple -> {
                  Long userId = Long.valueOf(Objects.requireNonNull(tuple.getValue()));
                  User user = userRepository.findById(userId).orElse(null);
                  if (user == null) return null;

                  Long rank = redisTemplate.opsForZSet().reverseRank(key, userId.toString());
                  return UserRankResponse.builder()
                      .userId(userId)
                      .nickname(user.getNickname())
                      .level(user.getLevel())
                      .score(tuple.getScore().longValue())
                      .rank((rank != null ? rank : 0) + 1)
                      .build();
                })
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

    // 내 순위 추출
    Long myRankRaw = redisTemplate.opsForZSet().reverseRank(key, myUser.getId().toString());
    Double myScoreRaw = redisTemplate.opsForZSet().score(key, myUser.getId().toString());

    UserRankResponse myRank =
        UserRankResponse.builder()
            .userId(myUser.getId())
            .nickname(myUser.getNickname())
            .level(myUser.getLevel())
            .score(myScoreRaw != null ? myScoreRaw.longValue() : 0)
            .rank((myRankRaw != null ? myRankRaw : 0) + 1)
            .build();

    return RankingResponse.builder().topRankers(topRankers).myRank(myRank).build();
  }
}
