package com.daypoo.api.service;

import com.daypoo.api.entity.Payment;
import com.daypoo.api.entity.User;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.PaymentRepository;
import com.daypoo.api.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

  private final UserRepository userRepository;
  private final PaymentRepository paymentRepository;
  private final ObjectMapper objectMapper;
  private final RestTemplate restTemplate = new RestTemplate();

  @Value("${toss.secret-key}")
  private String secretKey;

  private static final String TOSS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";

  @Transactional
  public void confirmPayment(String email, String paymentKey, String orderId, Long amount) {
    log.info("Processing Payment: orderId={}, amount={}, user={}", orderId, amount, email);

    validateSecretKey();

    try {
      HttpHeaders headers = createHeaders();
      Map<String, Object> params = new HashMap<>();
      params.put("paymentKey", paymentKey);
      params.put("orderId", orderId);
      params.put("amount", amount);

      HttpEntity<Map<String, Object>> entity = new HttpEntity<>(params, headers);
      ResponseEntity<JsonNode> response =
          restTemplate.postForEntity(TOSS_CONFIRM_URL, entity, JsonNode.class);

      if (response.getStatusCode() != HttpStatus.OK) {
        throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR);
      }

      // 결제 유저 조회
      User user =
          userRepository
              .findByEmail(email)
              .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

      // 결제 내역 저장


      paymentRepository.save(
          Payment.builder()
              .email(email)
              .user(user)
              .orderId(orderId)
              .amount(amount)
              .paymentKey(paymentKey)
              .build());

      addPointsToUser(user, amount);
      log.info("✅ Payment confirmed, recorded, and points awarded for user: {}", email);

    } catch (HttpClientErrorException e) {
      handleTossError(e);
    } catch (Exception e) {
      log.error("Unexpected error during payment confirmation", e);
      throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  private void validateSecretKey() {
    if (secretKey == null || secretKey.isBlank()) {
      log.error("❌ TOSS_SECRET_KEY is missing in environment variables!");
      throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  private HttpHeaders createHeaders() {
    String authValue = secretKey + ":";
    String basicToken =
        Base64.getEncoder().encodeToString(authValue.getBytes(StandardCharsets.UTF_8));

    HttpHeaders headers = new HttpHeaders();
    headers.set("Authorization", "Basic " + basicToken);
    headers.setContentType(MediaType.APPLICATION_JSON);
    return headers;
  }

  private void handleTossError(HttpClientErrorException e) {
    String responseBody = e.getResponseBodyAsString();
    log.warn("Toss API Error: status={}, body={}", e.getStatusCode(), responseBody);

    try {
      JsonNode errorNode = objectMapper.readTree(responseBody);
      String errorCode = errorNode.path("code").asText("");
      String errorMessage = errorNode.path("message").asText("토스 결제 승인 중 오류가 발생했습니다.");

      // 테스트 모드 예외 처리 (이미 처리된 요청 등)
      if ("ALREADY_PROCESSING_REQUEST".equals(errorCode)
          || "ALREADY_COMPLETED_PAYMENT".equals(errorCode)) {
        log.info("Payment already processed (Test Mode Bypass): {}", errorCode);
        return;
      }

      log.error("Toss Payment Failed: code={}, message={}", errorCode, errorMessage);
      // 구체적인 에러 메시지를 포함하여 예외 발생 (프론트에서 이 메시지를 사용하게 됨)
      throw new RuntimeException(errorMessage);

    } catch (Exception parseException) {
      log.error("Failed to parse Toss error response", parseException);
      throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  private void addPointsToUser(User user, Long amount) {
    if (user == null) return;
    user.addExpAndPoints(0, amount);
    userRepository.save(user);
  }
}
