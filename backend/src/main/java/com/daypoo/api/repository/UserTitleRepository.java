package com.daypoo.api.repository;

import com.daypoo.api.entity.User;
import com.daypoo.api.entity.UserTitle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserTitleRepository extends JpaRepository<UserTitle, Long> {
    List<UserTitle> findAllByUser(User user);
    boolean existsByUserAndTitleId(User user, Long titleId);
}
