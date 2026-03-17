package com.daypoo.api.controller;

import com.daypoo.api.dto.ToiletResponse;
import com.daypoo.api.service.ToiletService;
import com.daypoo.api.service.PublicDataSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/toilets")
@RequiredArgsConstructor
public class ToiletController {

    private final ToiletService toiletService;
    private final PublicDataSyncService publicDataSyncService;

    @GetMapping
    public ResponseEntity<List<ToiletResponse>> searchToilets(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam(defaultValue = "1000") double radius) { // default 1km
        List<ToiletResponse> responses = toiletService.searchToilets(latitude, longitude, radius);
        return ResponseEntity.ok(responses);
    }

    @org.springframework.web.bind.annotation.PostMapping("/sync")
    public ResponseEntity<String> syncToilets(
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "100") int numOfRows) {
        int count = publicDataSyncService.syncToiletData(pageNo, numOfRows);
        return ResponseEntity.ok("Successfully synced " + count + " toilets.");
    }
}

