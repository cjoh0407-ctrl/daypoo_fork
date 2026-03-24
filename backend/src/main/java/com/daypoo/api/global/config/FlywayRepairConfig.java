package com.daypoo.api.global.config;

import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayRepairConfig {
  @Bean
  public FlywayMigrationStrategy flywayMigrationStrategy() {
    return flyway -> {
      flyway.repair(); // 체크섬 불일치/실패 엔트리 정리
      flyway.migrate(); // 정상 마이그레이션 실행
    };
  }
}
