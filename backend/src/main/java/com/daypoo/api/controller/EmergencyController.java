package com.daypoo.api.controller;

import com.daypoo.api.dto.EmergencyToiletResponse;
import com.daypoo.api.service.EmergencyService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/toilets/emergency")
@RequiredArgsConstructor
public class EmergencyController {

  private final EmergencyService emergencyService;

  @GetMapping
  public ResponseEntity<List<EmergencyToiletResponse>> searchEmergencyToilets(
      @RequestParam double latitude, @RequestParam double longitude) {

    List<EmergencyToiletResponse> top3Responses =
        emergencyService.findEmergencyToilets(latitude, longitude);
    return ResponseEntity.ok(top3Responses);
  }
}
