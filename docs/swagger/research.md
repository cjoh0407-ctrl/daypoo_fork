# Swagger API 문서 구축 및 유지보수 가이드

> **최종 수정일**: 2026-04-02
> **목적**: 현재 프로젝트(`com.daypoo.api`)의 REST API를 Swagger(OpenAPI 3.0)로 자동화하여 문서화하고, 개발자 간 효율적인 협업 환경을 유지하기 위함

---

## 1. 현재 프로젝트 기술 스택 및 설정

### 백엔드 인프라 (2026-04-02 기준)

| 항목           | 버전/값                                      |
| -------------- | -------------------------------------------- |
| Spring Boot    | 3.4.3                                        |
| Java           | 21                                           |
| 빌드 도구      | Gradle                                       |
| 패키지 구조    | `com.daypoo.api`                             |
| Swagger 라이브러리 | `springdoc-openapi-starter-webmvc-ui:2.8.5` |

### 현재 구현 현황
- **컨트롤러 자동 스캔**: `AuthController`, `ToiletController` 등 20여 개의 컨트롤러가 이미 Swagger 문서에 포함됨
- **Security 연동**: `SecurityConfig`에서 `/swagger-ui/**`, `/v3/api-docs/**` 경로에 대한 접근 허용 완료
- **애노테이션 적용**: `@Tag`, `@Operation`, `@ApiResponse` 등을 통해 주요 API 설명 완료

---

## 2. API 문서 접근 및 확인

서버가 실행 중일 때 다음 URL을 통해 문서를 확인할 수 있습니다:
- **Swagger UI**: `http://localhost:8080/swagger-ui/index.html` (또는 실제 서버 도메인)
- **OpenAPI JSON**: `http://localhost:8080/v3/api-docs`

---

## 3. 핵심 구현 및 유지보수 가이드 (Code-First)

현재 프로젝트는 코드가 작성되면 문서가 자동으로 생성되는 **Code-First** 방식을 채택하고 있습니다.

### 3.1. 컨트롤러 작성 규칙
새로운 API를 생성할 때 반드시 다음 애노테이션을 사용하여 문서를 풍성하게 만드십시오.

```java
@Tag(name = "도메인명", description = "도메인에 대한 설명")
@RestController
@RequestMapping("/api/v1/domain")
public class MyController {

    @Operation(summary = "기능 요약", description = "기능에 대한 상세 설명")
    @ApiResponse(responseCode = "200", description = "성공 시나리오 설명")
    @ApiResponse(responseCode = "400", description = "실패 시나리오 설명")
    @GetMapping("/path")
    public ResponseEntity<?> myApi() { ... }
}
```

### 3.2. JWT 인증 연동 (향후 적용 제안)
Swagger UI 상단에 'Authorize' 버튼을 추가하여 JWT 토큰을 직접 입력하고 테스트하려면 아래와 같은 설정 클래스를 추가해야 합니다. (현재 프로젝트에 추가 제안 사항)

```java
@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI openAPI() {
        String jwtSchemeName = "BearerAuth";
        SecurityRequirement securityRequirement = new SecurityRequirement().addList(jwtSchemeName);
        Components components = new Components()
            .addSecuritySchemes(jwtSchemeName, new SecurityScheme()
                .name(jwtSchemeName)
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT"));

        return new OpenAPI()
            .info(new Info()
                .title("DayPoo API Documentation")
                .description("DayPoo 프로젝트의 백엔드 API 명세서입니다.")
                .version("v1.0.0"))
            .addSecurityItem(securityRequirement)
            .components(components);
    }
}
```

---

## 4. 보안 및 운영 시 주의사항

- **운영 환경 제한**: 운영(Production) 환경에서는 Swagger UI를 비활성화하거나, 별도의 인증(Basic Auth 등)을 통해 접근을 제한해야 합니다.
- **DTO 필드 설명**: `@Schema` 애노테이션을 DTO 필드에 사용하여 데이터 형식을 명시하십시오. (예: `@Schema(description = "사용자 닉네임", example = "똥대장")`)
- **버전 관리**: API 주소에 `/api/v1/`과 같은 버전 정보를 명시하여 하위 호환성을 유지하십시오.
