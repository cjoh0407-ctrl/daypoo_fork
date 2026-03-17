package com.daypoo.api.repository;

import com.daypoo.api.entity.Inquiry;
import com.daypoo.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InquiryRepository extends JpaRepository<Inquiry, Long> {
    List<Inquiry> findAllByUserOrderByCreatedAtDesc(User user);
}
