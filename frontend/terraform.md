# DayPoo AWS 프리티어 배포 - Terraform 가이드 & 문제점 분석

## Context

학원 프로젝트용 DayPoo 앱을 AWS 프리티어(무료)로 Terraform을 활용해 배포하려 합니다.
도메인은 미구매 상태이며, AWS Elasticsearch(OpenSearch)도 사용 예정입니다.

이 문서는 **배포 시 문제가 될 수 있는 파일, 코드, 보완점**을 정리한 가이드입니다.

---

## 1. AWS 프리티어 한계 vs 프로젝트 요구사항 (비용 문제)

### 1.1 프리티어로 가능한 것 (12개월 무료)

| 서비스 | 프리티어 사양 | 용도 |
|--------|-------------|------|
| EC2 | t2.micro (1vCPU, 1GB RAM) x 750시간/월 | 백엔드 + AI 서비스 |
| RDS | db.t3.micro (1vCPU, 1GB RAM, 20GB) x 750시간/월 | PostgreSQL |
| S3 | 5GB 저장 + 2만 GET/2천 PUT | 프론트엔드 정적 호스팅 |
| CloudFront | 1TB 전송/월 | CDN |

### 1.2 프리티어로 불가능한 것 (유료 발생)

| 서비스 | 최소 비용 (월) | 프로젝트 필요 이유 | 대안 |
|--------|--------------|-------------------|------|
| **ElastiCache (Redis)** | ~$12/월 | 랭킹, 실시간 알림, Rate Limiting, Geo 검색 | EC2에 Redis 직접 설치 |
| **OpenSearch (Elasticsearch)** | ~$25/월 | 검색 기능 | EC2에 직접 설치 또는 PostgreSQL FTS |
| **ALB (로드밸런서)** | ~$16/월 | HTTPS 라우팅 | Nginx 리버스 프록시로 대체 |
| **NAT Gateway** | ~$32/월 | Private Subnet 인터넷 접근 | Public Subnet 사용 |

### 1.3 권장 아키텍처 (최소 비용)

```
┌──────────────────────────────────────────────────────┐
│                    CloudFront (CDN)                    │
│              (프리티어 1TB/월 전송 무료)                │
└────────────────────────┬─────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
      ┌──────────────┐    ┌──────────────────────────┐
      │   S3 Bucket  │    │   EC2 t2.micro (1GB)     │
      │  (프론트엔드) │    │  ┌────────────────────┐  │
      │  React SPA   │    │  │ Nginx (리버스 프록시)│  │
      │  정적 파일    │    │  │ :80 → :8080, :8000 │  │
      └──────────────┘    │  └────────────────────┘  │
                          │  ┌────────────────────┐  │
                          │  │ Spring Boot :8080   │  │
                          │  └────────────────────┘  │
                          │  ┌────────────────────┐  │
                          │  │ FastAPI :8000       │  │
                          │  └────────────────────┘  │
                          │  ┌────────────────────┐  │
                          │  │ Redis :6379         │  │
                          │  └────────────────────┘  │
                          └────────────┬─────────────┘
                                       │
                              ┌────────┴────────┐
                              │  RDS PostgreSQL  │
                              │  db.t3.micro     │
                              │  (프리티어)       │
                              └─────────────────┘
```

**예상 비용**: ES 미사용 시 $0/월, ES 사용 시 ~$25+/월

---

## 2. 심각한 보안 문제 (배포 전 필수 해결)

### 2.1 .env 파일에 실제 시크릿 노출 (CRITICAL)

**문제 파일들**:
- `/.env` - DB 비밀번호, JWT 키, OAuth 시크릿, 결제 키 전부 포함
- `/backend/.env` - 백엔드 시크릿
- `/frontend/.env` - 카카오맵 키, 토스 클라이언트 키
- `/ai-service/.env` - OpenAI API 키 (`sk-proj-...`)

**노출된 시크릿 목록**:
| 항목 | 위험도 |
|------|--------|
| PostgreSQL Password (`daypoo1234`) | CRITICAL |
| JWT Secret Key (Base64) | CRITICAL |
| Toss Payment Secret (`test_sk_...`) | CRITICAL |
| Kakao OAuth Secret | CRITICAL |
| Google OAuth Secret | CRITICAL |
| OpenAI API Key (`sk-proj-...`) → 과금 발생 | CRITICAL |
| Gmail App Password | CRITICAL |

**해결 방법**:
```bash
# 1. Git에서 .env 파일 추적 제거
git rm --cached .env backend/.env frontend/.env ai-service/.env
git commit -m "chore: remove .env files from tracking"

# 2. 모든 시크릿 재발급 (필수)
# - JWT Secret Key 재생성
# - OAuth 클라이언트 재발급
# - OpenAI API 키 순환
# - Gmail 앱 비밀번호 변경

# 3. AWS 배포 시 SSM Parameter Store 사용 (무료)
```

### 2.2 AI 서비스 CORS 전체 개방

**파일**: `ai-service/main.py`
```python
# 현재 (위험)
allow_origins=["*"]

# 수정 필요
allow_origins=[os.getenv("ALLOWED_ORIGINS", "http://localhost:8080")]
```

### 2.3 OAuth2 토큰이 URL에 노출

**파일**: `backend/.../security/OAuth2SuccessHandler.java`
```java
// 토큰이 URL 쿼리 파라미터에 포함됨 → 로그에 기록됨
String targetUrl = frontendUrl
    + "/auth/callback?access_token=" + accessToken
    + "&refresh_token=" + refreshToken;
```

---

## 3. 코드 레벨 배포 문제

### 3.1 HikariCP Connection Pool 과다 설정

**파일**: `backend/src/main/resources/application.yml`
```yaml
# 현재 (t2.micro에서 불가능)
maximum-pool-size: 40
minimum-idle: 10

# 수정 필요 (프리티어용)
maximum-pool-size: 5
minimum-idle: 2
```

RDS db.t3.micro는 최대 약 60개 연결 → 40개 풀은 단독으로는 가능하나 다른 서비스와 공유 시 문제

### 3.2 JVM 메모리 설정 필요

EC2 t2.micro (1GB RAM)에서 Spring Boot + FastAPI + Redis가 공존해야 합니다.

```bash
# 런타임 JVM 옵션 필요
JAVA_OPTS="-Xmx384m -Xms256m -XX:+UseG1GC"
```

### 3.3 Virtual Threads (Java 21) 호환성

**파일**: `backend/build.gradle` → Java 21 필수
- Amazon Linux 2023 기본 AMI에 Java 21 없음
- **Amazon Corretto 21** 별도 설치 필요

### 3.4 PostGIS 확장 필요

**파일**: `docker-compose.yml` → `postgis/postgis:16-3.4` 이미지 사용 중
- RDS PostgreSQL에서 PostGIS를 수동 활성화 필요
- Flyway 마이그레이션(V1)에서 PostGIS 함수 사용 (`ST_GeomFromText` 등)
- **배포 전 RDS에서 `CREATE EXTENSION postgis;` 실행 필수**

### 3.5 프론트엔드 API 프록시 미작동

**파일**: `frontend/vite.config.js`
```javascript
server: {
  proxy: {
    '/api': 'http://localhost:8080'  // dev 서버에서만 동작
  }
}
```
- `vite build`로 빌드된 정적 파일에는 프록시 적용 안 됨
- S3 + CloudFront 배포 시 별도 API 라우팅 필요

**해결**: CloudFront Behavior로 라우팅
```
/api/*     → EC2 Origin (백엔드)
/oauth2/*  → EC2 Origin
/*         → S3 Origin (프론트엔드)
```

### 3.6 프론트엔드 envDir 설정

**파일**: `frontend/vite.config.js`
```javascript
envDir: '../'  // 상위 디렉토리에서 .env 로드
```
- CI/CD 빌드 시 상위 경로에 .env가 없으면 `VITE_*` 변수 미주입
- 빌드 환경에서 환경변수를 직접 설정해야 함

### 3.7 스케줄러 메모리 문제

**파일**: `backend/.../service/PublicDataSyncService.java`
- 매일 새벽 3시 공공데이터 동기화
- Virtual Thread + Semaphore(10개 동시 요청) → t2.micro에서 OOM 위험

```java
// 수정 권장: 동시 요청 수 축소
private static final int MAX_CONCURRENT_REQUESTS = 3; // 기존 10
```

### 3.8 Simulation 프로필 비활성화 확인

**파일**: `backend/.../simulation/bot/BotOrchestrator.java`
```java
@Profile("simulation")  // 이 프로필이 활성화되면 1분마다 봇 실행
@Scheduled(fixedRate = 60000)
```
- **배포 시 `SPRING_PROFILES_ACTIVE=prod` 필수 설정**
- simulation 프로필 절대 사용 금지

---

## 4. Dockerfile 부재 (배포 필수 작성)

현재 프로젝트에 **Dockerfile이 하나도 없습니다**.

### 필요한 Dockerfile

**backend/Dockerfile**:
```dockerfile
FROM amazoncorretto:21-alpine AS builder
WORKDIR /app
COPY . .
RUN ./gradlew bootJar -x test

FROM amazoncorretto:21-alpine
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Xmx384m", "-Xms256m", "-jar", "app.jar"]
```

**ai-service/Dockerfile**:
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 5. Terraform 구성 가이드

### 5.1 디렉토리 구조

```
terraform/
├── main.tf              # Provider, Backend 설정
├── variables.tf         # 변수 정의
├── terraform.tfvars     # 변수 값 (Git 제외!)
├── outputs.tf           # 출력값
├── network.tf           # VPC, Subnet, Security Group
├── ec2.tf               # EC2 인스턴스
├── rds.tf               # RDS PostgreSQL
├── s3.tf                # S3 (프론트엔드)
├── cloudfront.tf        # CloudFront CDN
├── iam.tf               # IAM 역할/정책
└── ssm.tf               # SSM Parameter Store (시크릿)
```

### 5.2 핵심 리소스

**EC2 (t2.micro)**:
```hcl
resource "aws_instance" "app" {
  ami           = "ami-xxxxx"  # Amazon Linux 2023
  instance_type = "t2.micro"

  user_data = <<-EOF
    #!/bin/bash
    # Java 21
    yum install -y java-21-amazon-corretto-headless
    # Python 3.12
    yum install -y python3.12 python3.12-pip
    # Redis
    yum install -y redis6
    systemctl enable redis6 && systemctl start redis6
    # Swap (필수)
    fallocate -l 2G /swapfile
    chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
    echo '/swapfile swap swap defaults 0 0' >> /etc/fstab
  EOF
}
```

**RDS (db.t3.micro)**:
```hcl
resource "aws_db_instance" "postgres" {
  identifier        = "daypoo-db"
  engine            = "postgres"
  engine_version    = "16.3"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  db_name           = "daypoo_db"
  username          = var.db_username
  password          = var.db_password
  skip_final_snapshot = true
  publicly_accessible = false
}
```

**S3 + CloudFront**:
```hcl
resource "aws_s3_bucket" "frontend" {
  bucket = "daypoo-frontend"
}

resource "aws_cloudfront_distribution" "main" {
  # S3 Origin (프론트엔드 /*)
  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "s3-frontend"
  }
  # EC2 Origin (API /api/*)
  origin {
    domain_name = aws_instance.app.public_dns
    origin_id   = "ec2-api"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
    }
  }
  # /api/* → EC2
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    target_origin_id = "ec2-api"
    # cache 비활성화 (동적 API)
  }
  # /* → S3
  default_cache_behavior {
    target_origin_id = "s3-frontend"
  }
}
```

**Security Group**:
```hcl
resource "aws_security_group" "app" {
  ingress { from_port = 80;  to_port = 80;  protocol = "tcp"; cidr_blocks = ["0.0.0.0/0"] }
  ingress { from_port = 22;  to_port = 22;  protocol = "tcp"; cidr_blocks = ["YOUR_IP/32"] }
  egress  { from_port = 0;   to_port = 0;   protocol = "-1";  cidr_blocks = ["0.0.0.0/0"] }
}

resource "aws_security_group" "rds" {
  ingress { from_port = 5432; to_port = 5432; protocol = "tcp"; security_groups = [aws_security_group.app.id] }
}
```

**SSM Parameter Store (시크릿 관리, 무료)**:
```hcl
resource "aws_ssm_parameter" "db_password" {
  name  = "/daypoo/db/password"
  type  = "SecureString"
  value = var.db_password
}
```

---

## 6. Elasticsearch (OpenSearch) 관련

### 6.1 프리티어에 포함되지 않음

| 옵션 | 월 비용 |
|------|---------|
| OpenSearch t3.small.search | ~$25/월 |
| OpenSearch Serverless | ~$21+/월 |
| EC2에 직접 설치 | $0 (하지만 1GB RAM에서 OOM) |

### 6.2 현재 코드에 Elasticsearch 코드 없음

- `build.gradle`에 ES 의존성 없음
- `application.yml`에 ES 설정 없음
- 소스 코드에서 ES 참조 없음
- **새로 추가해야 하는 기능** → 배포 후 별도 작업

### 6.3 프리티어 내 대안

- **PostgreSQL Full-Text Search** (`tsvector` + `tsquery`) → 추가 비용 $0
- 학원 프로젝트 수준에서는 충분
- ES가 필수라면 t2.micro에서는 불가능, 별도 인스턴스 필요 (유료)

---

## 7. t2.micro 메모리 분배 계획

```
총 RAM: 1024MB
├── OS + 시스템      : ~150MB
├── Spring Boot (JVM): ~384MB (-Xmx384m)
├── Python FastAPI   : ~100MB
├── Redis            : ~100MB
├── Nginx            : ~20MB
└── 여유             : ~270MB

⚠️ Swap 2GB 설정 필수
```

---

## 8. HTTPS 및 도메인 (미구매 상태)

- 도메인 없이 HTTPS → **CloudFront 기본 도메인** 사용 (`xxxxx.cloudfront.net`)
- CloudFront는 기본적으로 HTTPS 지원 (ACM 인증서 불필요)
- **OAuth2 리다이렉트 URL을 CloudFront 도메인으로 변경 필수**
  - 카카오 개발자 콘솔에 CloudFront URL 등록
  - 구글 OAuth 콘솔에 CloudFront URL 등록
- `FRONTEND_URL` 환경변수도 CloudFront URL로 설정

---

## 9. application.yml 프로필 분리 필요

현재 `application.yml` 하나로 모든 환경 관리 중

**필요 파일**:
```
backend/src/main/resources/
├── application.yml          # 공통
├── application-dev.yml      # 로컬 개발
└── application-prod.yml     # AWS 배포
```

**application-prod.yml 주요 변경**:
```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 5
      minimum-idle: 2
  jpa:
    show-sql: false
app:
  cors:
    allowed-origins: https://xxxxx.cloudfront.net
```

---

## 10. 배포 전 체크리스트

### CRITICAL (필수)
- [ ] .env 파일 Git에서 제거 + 시크릿 재발급
- [ ] Dockerfile 작성 (backend, ai-service)
- [ ] HikariCP 풀 사이즈 축소 (40 → 5)
- [ ] JVM 메모리 제한 (-Xmx384m)
- [ ] EC2 Swap 2GB 설정
- [ ] RDS PostGIS 확장 활성화
- [ ] CORS 설정 변경 (CloudFront 도메인)
- [ ] OAuth2 리다이렉트 URL 변경
- [ ] SPRING_PROFILES_ACTIVE=prod 설정

### HIGH (권장)
- [ ] application-prod.yml 프로필 분리
- [ ] AI 서비스 CORS `*` → 특정 도메인
- [ ] simulation 프로필 비활성화 확인
- [ ] 공공데이터 동기화 동시 요청 수 축소 (10 → 3)
- [ ] terraform.tfvars를 .gitignore에 추가
- [ ] VITE_ 환경변수 프로덕션 값 설정

### MEDIUM (개선)
- [ ] GitHub Actions에 AWS 배포 워크플로우 추가
- [ ] CloudWatch 로그 설정
- [ ] Gmail SMTP → AWS SES 마이그레이션 검토

---

## 11. 예상 비용 정리

### 프리티어 기간 (12개월)

| 서비스 | 월 비용 | 비고 |
|--------|---------|------|
| EC2 t2.micro | $0 | 750시간/월 무료 |
| RDS db.t3.micro | $0 | 750시간/월 무료 |
| S3 | $0 | 5GB 무료 |
| CloudFront | $0 | 1TB/월 무료 |
| SSM Parameter Store | $0 | Standard 무료 |
| **합계 (ES 미사용)** | **$0** | |
| **합계 (ES 사용)** | **~$25+** | 프리티어 불포함 |

### 프리티어 만료 후

| 서비스 | 월 비용 |
|--------|---------|
| EC2 t2.micro | ~$8.50 |
| RDS db.t3.micro | ~$12.50 |
| S3 + CloudFront | ~$1 |
| **합계** | **~$22/월** |

---

## 12. 주요 파일 경로 참조

| 구분 | 파일 | 배포 문제 |
|------|------|----------|
| 환경변수 | `.env`, `backend/.env`, `frontend/.env`, `ai-service/.env` | 시크릿 노출 |
| Spring 설정 | `backend/src/main/resources/application.yml` | 커넥션 풀, 프로필 분리 |
| 빌드 | `backend/build.gradle` | Java 21 필요 |
| Vite 설정 | `frontend/vite.config.js` | 프록시 미작동, envDir |
| Docker | `docker-compose.yml` | 배포용 수정 필요 |
| CI/CD | `.github/workflows/deploy.yml` | 프론트엔드만 배포 |
| 마이그레이션 | `backend/src/main/resources/db/migration/V*.sql` | PostGIS 필요 |
| AI CORS | `ai-service/main.py` | `allow_origins=["*"]` |
| OAuth | `backend/.../security/OAuth2SuccessHandler.java` | 토큰 URL 노출 |
| 보안 | `backend/.../security/SecurityConfig.java` | CORS 설정 |
| 스케줄러 | `backend/.../service/PublicDataSyncService.java` | 동시 요청 10개 OOM |
| 봇 | `backend/.../simulation/bot/BotOrchestrator.java` | simulation 프로필 확인 |

---

## 요약

**배포 전 가장 중요한 3가지**:
1. **.env 시크릿 정리** - Git에서 제거, AWS SSM Parameter Store로 관리
2. **리소스 제한** - HikariCP 5개, JVM 384MB, Swap 2GB
3. **Dockerfile 작성** - 백엔드, AI 서비스 컨테이너화

**Elasticsearch 결론**:
- 현재 코드에 ES 관련 코드 없음 (배포 후 별도 추가)
- 프리티어 불포함 ($25+/월)
- 학원 프로젝트라면 PostgreSQL Full-Text Search로 대체 권장
