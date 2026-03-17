package com.daypoo.api.repository;

import com.daypoo.api.entity.Faq;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FaqRepository extends JpaRepository<Faq, Long> {
    List<Faq> findAllByCategoryOrderByCreatedAtDesc(String category);
}
