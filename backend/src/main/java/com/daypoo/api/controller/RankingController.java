package com.daypoo.api.controller;

import com.daypoo.api.dto.RankingResponse;
import com.daypoo.api.entity.User;
import com.daypoo.api.repository.UserRepository;
import com.daypoo.api.service.RankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/rankings")
@RequiredArgsConstructor
public class RankingController {

  private final RankingService rankingService;
  private final UserRepository userRepository;

  /** 전체 랭킹 조회 */
  @GetMapping("/global")
  public ResponseEntity<RankingResponse> getGlobalRanking(@AuthenticationPrincipal String email) {
    User user =
        (email != null && !"anonymousUser".equals(email))
            ? userRepository.findByEmail(email).orElse(null)
            : null;
    return ResponseEntity.ok(rankingService.getGlobalRanking(user));
  }

  /** 지역 랭킹 조회 */
  @GetMapping("/region")
  public ResponseEntity<RankingResponse> getRegionRanking(
      @AuthenticationPrincipal String email, @RequestParam String regionName) {
    User user =
        (email != null && !"anonymousUser".equals(email))
            ? userRepository.findByEmail(email).orElse(null)
            : null;
    return ResponseEntity.ok(rankingService.getRegionRanking(user, regionName));
  }

  /** 건강왕 랭킹 조회 */
  @GetMapping("/health")
  public ResponseEntity<RankingResponse> getHealthRanking(@AuthenticationPrincipal String email) {
    User user =
        (email != null && !"anonymousUser".equals(email))
            ? userRepository.findByEmail(email).orElse(null)
            : null;
    return ResponseEntity.ok(rankingService.getHealthRanking(user));
  }
}
