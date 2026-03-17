package com.daypoo.api.service;

import com.daypoo.api.dto.NotificationResponse;
import com.daypoo.api.entity.Notification;
import com.daypoo.api.entity.NotificationType;
import com.daypoo.api.entity.User;
import com.daypoo.api.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    
    // 유저별 SSE Emitter 관리 (메모리 저장소)
    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    /**
     * SSE 연결 수립
     */
    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(60L * 1000 * 60); // 1시간 타임아웃
        emitters.put(userId, emitter);

        emitter.onCompletion(() -> emitters.remove(userId));
        emitter.onTimeout(() -> emitters.remove(userId));

        // 연결 시 더미 이벤트 전송 (연결 확인용)
        try {
            emitter.send(SseEmitter.event()
                    .name("connect")
                    .data("connected!"));
        } catch (IOException e) {
            emitters.remove(userId);
        }

        return emitter;
    }

    /**
     * 알림 생성 및 실시간 전송
     */
    @Transactional
    public void send(User user, NotificationType type, String title, String content, String redirectUrl) {
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .content(content)
                .redirectUrl(redirectUrl)
                .build();
        
        notificationRepository.save(notification);

        // 실시간 전송 (SSE)
        if (emitters.containsKey(user.getId())) {
            SseEmitter emitter = emitters.get(user.getId());
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .data(NotificationResponse.builder()
                                .id(notification.getId())
                                .type(notification.getType())
                                .title(notification.getTitle())
                                .content(notification.getContent())
                                .redirectUrl(notification.getRedirectUrl())
                                .isRead(notification.isRead())
                                .createdAt(notification.getCreatedAt())
                                .build()));
            } catch (IOException e) {
                emitters.remove(user.getId());
            }
        }
    }

    /**
     * 내 알림 목록 조회
     */
    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(User user) {
        return notificationRepository.findAllByUserOrderByCreatedAtDesc(user).stream()
                .map(n -> NotificationResponse.builder()
                        .id(n.getId())
                        .type(n.getType())
                        .title(n.getTitle())
                        .content(n.getContent())
                        .redirectUrl(n.getRedirectUrl())
                        .isRead(n.isRead())
                        .createdAt(n.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * 알림 읽음 처리
     */
    @Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 알림입니다."));
        notification.markAsRead();
    }
}
