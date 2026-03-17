package com.daypoo.api.repository;

import com.daypoo.api.entity.Title;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TitleRepository extends JpaRepository<Title, Long> {
    Optional<Title> findByName(String name);
}
