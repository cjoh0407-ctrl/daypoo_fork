package com.daypoo.api.repository;

import com.daypoo.api.entity.Item;
import com.daypoo.api.entity.ItemType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findAllByType(ItemType type);
}
