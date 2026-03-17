package com.daypoo.api.repository;

import com.daypoo.api.entity.Inventory;
import com.daypoo.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    List<Inventory> findAllByUser(User user);
    Optional<Inventory> findByUserAndItemId(User user, Long itemId);
    boolean existsByUserAndItemId(User user, Long itemId);
}
