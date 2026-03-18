package com.daypoo.api;

import com.daypoo.api.service.PublicDataSyncService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@Slf4j
@SpringBootApplication
public class ApiApplication {

  public static void main(String[] args) {
    SpringApplication.run(ApiApplication.class, args);
  }

  @Bean
  public CommandLineRunner runSync(PublicDataSyncService syncService) {
    return args -> {
      log.info("🌟 Starting FINAL AUTO-PILOT SYNC (Page 1-1000)...");
      try {
        // 1페이지부터 다시 훑으며 빠진 데이터를 모두 채웁니다.
        // 이미 있는 3.3만 건은 최적화된 IN 쿼리로 광속 스킵됩니다.
        syncService.syncAllToilets(1);
        log.info("🏆 ALL PUBLIC DATA SYNC COMPLETED!");
      } catch (Exception e) {
        log.error("Sync process failed: {}", e.getMessage());
      }
    };
  }
}
