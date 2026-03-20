package com.daypoo.api.controller;

import com.daypoo.api.dto.FaqResponse;
import com.daypoo.api.dto.InquiryRequest;
import com.daypoo.api.entity.User;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.UserRepository;
import com.daypoo.api.service.SupportService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/support")
@RequiredArgsConstructor
public class SupportController {

  private final SupportService supportService;
  private final UserRepository userRepository;

  /** 1:1 문의 등록 */
  @PostMapping("/inquiries")
  public ResponseEntity<Void> createInquiry(
      @AuthenticationPrincipal UserDetails userDetails, @RequestBody InquiryRequest request) {
    User user = getUserByUsername(userDetails.getUsername());
    supportService.createInquiry(user, request);
    return ResponseEntity.ok().build();
  }

  /** 내 문의 내역 조회 */
  @GetMapping("/inquiries")
  public ResponseEntity<List<?>> getMyInquiries(@AuthenticationPrincipal UserDetails userDetails) {
    User user = getUserByUsername(userDetails.getUsername());
    return ResponseEntity.ok(supportService.getMyInquiries(user));
  }

  /** FAQ 조회 */
  @GetMapping("/faqs")
  public ResponseEntity<List<FaqResponse>> getFaqs(
      @RequestParam(required = false) String category) {
    return ResponseEntity.ok(supportService.getFaqs(category));
  }

  private User getUserByUsername(String username) {
    return userRepository
        .findByUsername(username)
        .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
  }
}
