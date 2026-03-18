package com.daypoo.api.repository;

import com.daypoo.api.entity.Notification;
import com.daypoo.api.entity.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
  List<Notification> findAllByUserOrderByCreatedAtDesc(User user);

  long countByUserAndIsReadFalse(User user);
}
