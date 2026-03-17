package com.daypoo.api.controller;

import com.daypoo.api.dto.RankingResponse;
import com.daypoo.api.entity.User;
import com.daypoo.api.repository.UserRepository;
import com.daypoo.api.service.RankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/rankings")
@RequiredArgsConstructor
public class RankingController {

    private final RankingService rankingService;
    private final UserRepository userRepository;

    /**
     * 전체 랭킹 조회
     */
    @GetMapping("/global")
    public ResponseEntity<RankingResponse> getGlobalRanking(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUserByUsername(userDetails.getUsername());
        return ResponseEntity.ok(rankingService.getGlobalRanking(user));
    }

    /**
     * 지역 랭킹 조회
     */
    @GetMapping("/region")
    public ResponseEntity<RankingResponse> getRegionRanking(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String regionName) {
        User user = getUserByUsername(userDetails.getUsername());
        return ResponseEntity.ok(rankingService.getRegionRanking(user, regionName));
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }
}
