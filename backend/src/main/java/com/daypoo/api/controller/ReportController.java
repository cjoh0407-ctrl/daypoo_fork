package com.daypoo.api.controller;

import com.daypoo.api.dto.HealthReportResponse;
import com.daypoo.api.entity.ReportType;
import com.daypoo.api.entity.User;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.UserRepository;
import com.daypoo.api.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

  private final ReportService reportService;
  private final UserRepository userRepository;

  /** AI 건강 리포트 조회/생성 */
  @GetMapping("/{type}")
  public ResponseEntity<HealthReportResponse> getReport(
      @AuthenticationPrincipal String email, @PathVariable ReportType type) {
    User user = getUserByEmail(email);
    return ResponseEntity.ok(reportService.generateReport(user, type));
  }

  private User getUserByEmail(String email) {
    return userRepository
        .findByEmail(email)
        .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
  }
}
