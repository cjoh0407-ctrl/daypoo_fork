package com.daypoo.api.controller;

import com.daypoo.api.dto.ToiletResponse;
import com.daypoo.api.service.ToiletService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@RestController
@RequestMapping("/api/v1/toilets")
@RequiredArgsConstructor
public class ToiletController {

  private final ToiletService toiletService;

  @GetMapping
  public ResponseEntity<List<ToiletResponse>> searchToilets(
      @RequestParam double latitude,
      @RequestParam double longitude,
      @RequestParam(defaultValue = "1000") double radius) { // default 1km
    List<ToiletResponse> responses = toiletService.searchToilets(latitude, longitude, radius);
    return ResponseEntity.ok(responses);
  }
}
