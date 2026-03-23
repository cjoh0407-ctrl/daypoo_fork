package com.daypoo.api.repository;

import com.daypoo.api.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

  Optional<User> findByEmail(String email);

  Optional<User> findByNickname(String nickname);


  boolean existsByNickname(String nickname);

  boolean existsByEmail(String email);

  List<User> findAllByOrderByPointsDesc(Pageable pageable);
}
