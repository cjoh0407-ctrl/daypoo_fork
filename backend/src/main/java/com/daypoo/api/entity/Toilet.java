package com.daypoo.api.entity;

import com.daypoo.api.global.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.Point;

@Entity
@Table(name = "toilets")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Toilet extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "geometry(Point, 4326)", nullable = false)
    private Point location;

    @Column(length = 255)
    private String address;

    @Column(name = "open_hours", length = 100)
    private String openHours;

    @Column(name = "is_24h", nullable = false)
    private boolean is24h;

    @Column(name = "is_unisex", nullable = false)
    private boolean isUnisex;

    @Builder
    public Toilet(String name, Point location, String address, String openHours, boolean is24h, boolean isUnisex) {
        this.name = name;
        this.location = location;
        this.address = address;
        this.openHours = openHours;
        this.is24h = is24h;
        this.isUnisex = isUnisex;
    }
}
