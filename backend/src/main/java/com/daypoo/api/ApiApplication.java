package com.daypoo.api;

import com.daypoo.api.service.EmailService;
import com.daypoo.api.service.PublicDataSyncService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;

@Slf4j
@EnableAsync
@SpringBootApplication
public class ApiApplication {

  public static void main(String[] args) {
    SpringApplication.run(ApiApplication.class, args);
  }

  @Bean
  public CommandLineRunner runSelfCheck(
      PublicDataSyncService syncService,
      EmailService emailService,
      @org.springframework.beans.factory.annotation.Value("${spring.mail.username:NOT_FOUND}")
          String mailUser,
      @org.springframework.beans.factory.annotation.Value("${spring.mail.password:NOT_FOUND}")
          String mailPass) {
    return args -> {
      log.info("🔍 [Env-Check] MAIL_USERNAME: {}", mask(mailUser));
      log.info("🔍 [Env-Check] MAIL_PASSWORD: {}", mask(mailPass));

      if ("NOT_FOUND".equals(mailUser) || mailUser.isEmpty()) {
        log.warn("⚠️ Warning: .env variables [MAIL_USERNAME] are NOT loaded. Skipping mail test.");
        return;
      }

      // 서버 시작을 블로킹하지 않도록 비동기로 실행
      java.util.concurrent.CompletableFuture.runAsync(
          () -> {
            try {
              log.info("🔍 [Self-Check] Starting Background Tasks (Mail & Sync)...");

              // 1. 메일 테스트
              try {
                emailService.sendEmail(
                    mailUser,
                    "[대똥여지도] 자가 진단 메일",
                    "백엔드 서버가 시작되었습니다. 가상 스레드와 메일 발송 기능이 정상적으로 로드되었습니다.\n\n발송 시각: "
                        + java.time.LocalDateTime.now());
                log.info("✅ Self-check mail sent successfully.");
              } catch (Exception e) {
                log.warn(
                    "⚠️ Self-check mail failed: {}. Server will continue to run.", e.getMessage());
              }

              // 2. 동기화 테스트 (30페이지만 샘플로 수행)
              try {
                log.info("🚀 Starting background BULK sync for 30 pages...");
                syncService.syncAllToilets(1, 30);
                log.info("✅ BULK SYNC COMPLETED!");
              } catch (Exception e) {
                log.error(
                    "❌ Background sync failed: {}. This does not affect server availability.",
                    e.getMessage());
              }
            } catch (Exception e) {
              log.error("❌ Unexpected error in background self-check: {}", e.getMessage());
            }
          });
    };
  }

  private String mask(String value) {
    if (value == null || value.length() < 4) return "****";
    return value.substring(0, 2) + "****" + value.substring(value.length() - 2);
  }
}
