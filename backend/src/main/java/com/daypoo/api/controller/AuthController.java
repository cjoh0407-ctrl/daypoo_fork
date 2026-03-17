package com.daypoo.api.controller;

import com.daypoo.api.dto.LoginRequest;
import com.daypoo.api.dto.SignUpRequest;
import com.daypoo.api.dto.TokenResponse;
import com.daypoo.api.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Authentication", description = "인증 및 회원가입 API")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "회원가입", description = "아이디, 비밀번호, 닉네임을 입력받아 신규 회원을 등록합니다.")
    @ApiResponse(responseCode = "200", description = "회원가입 성공")
    @ApiResponse(responseCode = "400", description = "잘못된 입력값 또는 중복된 아이디/닉네임")
    @PostMapping("/signup")
    public ResponseEntity<String> signUp(@Valid @RequestBody SignUpRequest request) {
        authService.signUp(request);
        return ResponseEntity.ok("회원가입이 완료되었습니다.");
    }

    @Operation(summary = "로그인", description = "아이디와 비밀번호를 검증하여 JWT 토큰을 발급합니다.")
    @ApiResponse(responseCode = "200", description = "로그인 성공 및 토큰 발급")
    @ApiResponse(responseCode = "401", description = "인증 실패")
    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        TokenResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}
