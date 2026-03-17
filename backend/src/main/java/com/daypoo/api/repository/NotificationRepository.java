package com.daypoo.api.repository;

import com.daypoo.api.entity.Notification;
import com.daypoo.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findAllByUserOrderByCreatedAtDesc(User user);
    long countByUserAndIsReadFalse(User user);
}
