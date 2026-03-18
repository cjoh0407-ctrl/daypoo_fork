package com.daypoo.api.controller;

import com.daypoo.api.dto.AdminInquiryAnswerRequest;
import com.daypoo.api.dto.AdminStatsResponse;
import com.daypoo.api.service.AdminService;
import com.daypoo.api.service.PublicDataSyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Admin", description = "시스템 관리 및 운영 API")
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

  private final AdminService adminService;
  private final PublicDataSyncService publicDataSyncService;

  /** 관리자 대시보드 통계 조회 */
  @Operation(summary = "시스템 통계 조회", description = "관리자용 전체 시스템 통계를 조회합니다.")
  @GetMapping("/stats")
  public ResponseEntity<AdminStatsResponse> getDashboardStats() {
    return ResponseEntity.ok(adminService.getDashboardStats());
  }

  /** 화장실 데이터 동기화 */
  @Operation(summary = "화장실 데이터 동기화", description = "공공데이터 API로부터 전국 화장실 데이터를 가져와 동기화합니다.")
  @PostMapping("/toilets/sync")
  public ResponseEntity<String> syncToilets(
      @RequestParam(defaultValue = "1") int pageNo,
      @RequestParam(defaultValue = "100") int numOfRows)
      throws Exception {
    int count = publicDataSyncService.syncToiletData(pageNo, numOfRows);
    return ResponseEntity.ok("Successfully synced " + count + " new toilets.");
  }

  /** 화장실 데이터 전체 동기화 */
  @Operation(
      summary = "전국 화장실 데이터 전체 동기화",
      description = "공공데이터 API의 모든 데이터를 1,000건씩 순차적으로 가져와 DB에 전체 동기화합니다.")
  @PostMapping("/toilets/sync/all")
  public ResponseEntity<String> syncAllToilets(@RequestParam(defaultValue = "1") int startPage)
      throws Exception {
    int count = publicDataSyncService.syncAllToilets(startPage);
    return ResponseEntity.ok("Successfully synced total " + count + " new toilets.");
  }

  /** 화장실 좌표 보정 (Geocoding) */
  @Operation(summary = "화장실 좌표 보정", description = "좌표가 없는 화장실 데이터의 주소를 지오코딩하여 좌표를 채워넣습니다.")
  @PostMapping("/toilets/geocoding/fill")
  public ResponseEntity<String> fillCoordinates(@RequestParam(defaultValue = "100") int limit) {
    int count = adminService.fillMissingCoordinates(limit);
    return ResponseEntity.ok("Successfully updated coordinates for " + count + " toilets.");
  }

  /** 1:1 문의 답변 등록 */
  @Operation(summary = "1:1 문의 답변 등록", description = "사용자의 문의사항에 답변을 등록하고 실시간 알림을 전송합니다.")
  @PostMapping("/inquiries/{inquiryId}/answer")
  public ResponseEntity<Void> answerInquiry(
      @PathVariable Long inquiryId, @RequestBody AdminInquiryAnswerRequest request) {
    adminService.answerInquiry(inquiryId, request.answer());
    return ResponseEntity.ok().build();
  }
}
