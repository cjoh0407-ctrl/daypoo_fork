package com.daypoo.api.controller;

import com.daypoo.api.dto.NotificationResponse;
import com.daypoo.api.entity.User;
import com.daypoo.api.repository.UserRepository;
import com.daypoo.api.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@Tag(name = "Notifications", description = "실시간 알림 API")
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    /**
     * 실시간 알림 구독 (SSE)
     */
    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "실시간 알림 구독 (SSE)", description = "클라이언트와 서버 간의 SSE 연결을 수립합니다.")
    public SseEmitter subscribe(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUserByUsername(userDetails.getUsername());
        return notificationService.subscribe(user.getId());
    }

    /**
     * 내 알림 목록 조회
     */
    @GetMapping
    @Operation(summary = "알림 목록 조회", description = "최신순으로 사용자의 알림 목록을 반환합니다.")
    public ResponseEntity<List<NotificationResponse>> getNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUserByUsername(userDetails.getUsername());
        return ResponseEntity.ok(notificationService.getMyNotifications(user));
    }

    /**
     * 알림 읽음 처리
     */
    @PatchMapping("/{notificationId}/read")
    @Operation(summary = "알림 읽음 처리", description = "특정 알림의 읽음 상태를 true로 변경합니다.")
    public ResponseEntity<Void> markAsRead(@PathVariable Long notificationId) {
        notificationService.markAsRead(notificationId);
        return ResponseEntity.ok().build();
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }
}
