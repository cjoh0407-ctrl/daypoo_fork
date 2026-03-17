package com.daypoo.api.repository;

import com.daypoo.api.dto.ToiletProjection;
import com.daypoo.api.entity.Toilet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ToiletRepository extends JpaRepository<Toilet, Long> {

    @Query(value = "SELECT t.id as id, t.name as name, t.address as address, t.open_hours as openHours, t.is_24h as is24h, " +
                   "ST_X(t.location) as longitude, ST_Y(t.location) as latitude, " +
                   "ST_DistanceSphere(t.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)) as distance " +
                   "FROM toilets t " +
                   "WHERE ST_DistanceSphere(t.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)) <= :radius " +
                   "ORDER BY distance ASC", nativeQuery = true)
    List<ToiletProjection> findToiletsWithinRadius(@Param("latitude") double latitude, 
                                                   @Param("longitude") double longitude, 
                                                   @Param("radius") double radius);
                                                   
    @Query(value = "SELECT ST_DistanceSphere(t.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)) " +
                   "FROM toilets t WHERE t.id = :toiletId", nativeQuery = true)
    Double getDistanceToToilet(@Param("toiletId") Long toiletId, 
                               @Param("latitude") double latitude, 
                               @Param("longitude") double longitude);
}
