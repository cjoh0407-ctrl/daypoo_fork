# DayPoo DB Synchronization Guide

본 문서는 팀원들이 동일한 데이터베이스(DB) 환경을 구축하고 동기화할 수 있도록 돕는 가이드입니다.

## 1. 초기 개발 환경 세팅 (공통)

### 1-1. 환경 변수 설정
프로젝트 루트에서 `.env.example` 파일을 복사하여 `.env` 파일을 생성합니다.
```bash
cp .env.example .env
```
그 후, 필요한 API 키 등을 개인/팀 스펙에 맞춰 수정합니다.

### 1-2. Docker 인프라 구동
PostgreSQL(PostGIS 포함) 및 Redis 컨테이너를 실행합니다.
```bash
docker-compose up -d
```

## 2. DB 스키마 및 데이터 동기화

### 2-1. 스키마 자동 업데이트
백엔드 서버(`./gradlew bootRun`) 실행 시 Hibernate의 `ddl-auto: update` 옵션에 의해 엔티티 구조가 자동으로 DB에 반영됩니다.

### 2-2. 기초 데이터 적재
서버 시작 시 `DataInitializer`가 다음 데이터를 자동으로 생성합니다.
- **관리자 계정:** `admin@admin.com` / `admin1234` (닉네임: 관리자)
- **테스트 유저:** `user1@daypoo.com`, `user2@daypoo.com` (비번: 1234)
- **기본 데이터:** 화장실 정보(Gangnam, Mapo 등), 문의 사항 샘플 등

## 3. 스키마가 꼬였을 때의 해결 방법 (Clean Reset)

만약 기존 데이터와의 충돌로 인하여 서버 실행 시 DDL 에러가 발생한다면, 다음 절차에 따라 테이블을 초기화할 수 있습니다.

### 방법 A: 문제되는 테이블만 드랍 (추천)
에러 로그에 찍힌 테이블(예: `payments`)을 삭제하고 서버를 다시 시작합니다.
```sql
-- DB 터미널 또는 도구에서 실행
DROP TABLE IF EXISTS payments CASCADE;
```

### 방법 B: 전체 데이터 초기화 (완전 초기화 필요 시)
전체 스키마를 날리고 싶다면 다음 명령어를 사용하십시오.
```bash
docker-compose down -v  # 볼륨까지 삭제
docker-compose up -d    # 다시 실행
```

## 4. 주의 사항
- **username 컬럼 제거:** 최신 스펙에서는 `username` 대신 `email`을 식별자로 사용합니다. 만약 DB에 `username` 성격의 컬럼이 남아있다면 삭제해야 합니다.
- **PostGIS 필수:** 공간 쿼리를 위해 `postgis` 확장이 설치된 이미지를 사용해야 합니다. (기본 `docker-compose.yml`에 포함됨)

---
**Last Updated:** 2026-03-23 15:35
