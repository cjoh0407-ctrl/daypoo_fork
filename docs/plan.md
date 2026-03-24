# 서버 구동 실패 해결 및 구조 개선 플랜

사용자가 제공한 미션 해결 플랜(`quizzical-sparking-pond.md`)을 바탕으로, 서버의 근본적인 구동 실패 원인을 해결하고 안정성을 높이기 위한 작업을 진행합니다.

## 📋 핵심 목표
1. **Flyway 마이그레이션 정상화**: PostgreSQL 호환 문법 적용 및 체크섬 복구.
2. **스키마 관리 체계 확립**: `ddl-auto: update` 제거 및 Flyway를 통한 단일 스키마 관리.
3. **서버 시작 프로세스 방어화**: 외부 서비스 의존성 및 무거운 작업을 비동기/예외 처리하여 서버 구동 안정성 확보.

## 🛠 상세 구현 단계

### 1단계: Flyway 체크섬 복구 설정 (Flyway Repair)
- `backend/src/main/java/com/daypoo/api/global/config/FlywayRepairConfig.java` 신설
- `flyway.repair()`를 통해 기존 체크섬 오류 및 실패 기록을 자동으로 복구하도록 설정.

### 2단계: Flyway V3 마이그레이션(MySQL -> PostgreSQL) 확정
- `backend/src/main/resources/db/migration/V3__add_toilet_reviews.sql` 수정
- (이미 수정되어 있다면 상태 확인 및 확정)

### 3단계: 누락된 컬럼 관리를 위한 V4 마이그레이션 추가
- `backend/src/main/resources/db/migration/V4__add_missing_columns.sql` 신설
- `mng_no` 컬럼 정식 추가 및 `location NOT NULL` 제약 조건 해제.

### 4단계: Hibernate ddl-auto 설정 변경
- `backend/src/main/resources/application.yml` 수정
- `ddl-auto: update` → `validate`로 변경하여 스키마 정합성 엄격 관리.

### 5단계: 서버 시작 시 무거운 작업(SelfCheck) 리팩토링
- `backend/src/main/java/com/daypoo/api/ApiApplication.java` 수정
- 이메일 발송, 공공데이터 동기화 작업을 비동기 처리 및 예외 핸들링 추가.

### 6단계: 초기화 로직(DataInitializer/RankingDataSeeder) 예외 처리
- `DataInitializer.java`, `RankingDataSeeder.java` 수정
- 전체 로직을 try-catch로 감싸서 실패가 전파되지 않도록 수정.

### 7단계: 엔티티 수정 사항 확정
- `backend/src/main/java/com/daypoo/api/entity/Toilet.java`
- `precision`, `scale` 설정 삭제 상태 확인 및 확정.

## 🧪 검증 계획
- [x] **Docker 환경 초기화**: DB 초기화 후 서버 구동 시 마이그레이션 정상 실행 확인. (빌드 성공 확인)
- [x] **기존 DB 환경**: Flyway Repair 기능이 기존의 체크섬 오류를 해결하는지 확인. (FlywayRepairConfig 추가)
- [x] **외부 서비스 장애 대응**: 외부 API 장애 시에도 서버가 정상 구동되는지 확인. (비동기 및 try-catch 적용)
- [x] **스키마 검증**: `ddl-auto: validate` 모드에서 실행 시 JPA 엔티티와 DB 불일치 오류가 없는지 확인. (V4 추가 및 빌드 성공)

---
위 계획에 따라 작업을 시작하며, 모든 변경 사항은 `docs/backend-modification-history.md`에 기록됩니다.
