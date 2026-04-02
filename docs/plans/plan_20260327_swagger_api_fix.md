# Swagger 접속 오류 해결 및 API 경로 정규화 계획

## 🎯 목표
- Swagger UI를 통해 `openapi.yaml` 명세서가 정상적으로 노출되도록 설정 및 보안 허용.
- 컨트롤러와 보안 설정, 그리고 API 명세서 간의 경로 불일치 문제를 해결하여 API 정합성 확보.

## 🛠 분석된 문제점
1. **Swagger 설정 누락**: `application.yml`에 `openapi.yaml` 파일을 문서 원본으로 사용하기 위한 설정이 없음.
2. **보안 설정 누락**: `SecurityConfig.java`에서 `/openapi.yaml` 정적 리소스에 대한 접근이 허용되지 않음 (403 오류 원인).
3. **Admin API 경로 불일치**:
    - `AdminController`: `/api/v1/admin`
    - `SecurityConfig`: `/api/v2/admin` (오타)
    - `openapi.yaml`: `/api/v1/admin` 경로 누락 (일부 엔드포인트가 `/api/v1/toilets/sync` 등으로 정의됨)
4. **Stats API 경로 불일치**: `SecurityConfig`는 `/api/v1/main/stats`를 허용하지만, 실제 경로는 `/api/v1/admin/stats`임.

## 📝 작업 단계

### 1단계: SpringDoc 및 보안 설정 수정
- [x] `backend/src/main/resources/application.yml`에 `springdoc.swagger-ui.url=/openapi.yaml` 설정 추가.
- [x] `backend/src/main/java/com/daypoo/api/security/SecurityConfig.java`에 `/openapi.yaml` 경로 `permitAll()` 추가.
- [x] `SecurityConfig.java`의 `/api/v2/admin/**` 오타를 `/api/v1/admin/**`으로 수정.

### 2단계: API 경로 정규화 (Consistency)
- [x] `backend/src/main/java/com/daypoo/api/security/SecurityConfig.java`에서 `/api/v1/main/stats` 허용 구문을 `/api/v1/admin/stats`로 수정 또는 공개용 Stats API 별도 검토. (현재는 `/api/v1/admin/stats`가 적절하므로 보안 설정 수정)
- [x] `backend/src/main/resources/static/openapi.yaml` 파일의 Admin 관련 경로를 `/api/v1/admin/...` 형식으로 통일.
- [x] `AdminController.java`에서 `@PreAuthorize("hasRole('ADMIN')")` 주석 해제.
- [x] `ToiletController.java`에서 중복된 `/api/v1/toilets/sync` 엔드포인트 제거.

### 3단계: 검증
- [ ] `http://localhost:8080/swagger-ui.html` 접속 확인.
- [ ] Swagger UI에서 `openapi.yaml` 내용이 정상적으로 표시되는지 확인.
- [ ] Admin API 호출 시 권한 체크 정상 작동 확인.

---
[✅ 규칙을 잘 수행했습니다.]
