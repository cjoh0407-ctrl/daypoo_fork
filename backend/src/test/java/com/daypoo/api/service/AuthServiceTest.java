package com.daypoo.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

import com.daypoo.api.dto.LoginRequest;
import com.daypoo.api.dto.SignUpRequest;
import com.daypoo.api.dto.TokenResponse;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.Role;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.UserRepository;
import com.daypoo.api.security.JwtProvider;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
@DisplayName("인증 서비스 테스트")
class AuthServiceTest {

  @InjectMocks private AuthService authService;

  @Mock private UserRepository userRepository;

  @Mock private PasswordEncoder passwordEncoder;

  @Mock private JwtProvider jwtProvider;

  private SignUpRequest signUpRequest;
  private LoginRequest loginRequest;
  private User testUser;

  @BeforeEach
  void setUp() {
    signUpRequest = new SignUpRequest("password123", "test@example.com", "PoopKing");
    loginRequest = new LoginRequest("test@example.com", "password123");
    testUser =
        User.builder()
            .email("test@example.com")
            .password("encodedPassword")
            .nickname("PoopKing")
            .role(Role.ROLE_USER)
            .build();
  }

  @Test
  @DisplayName("성공: 회원가입")
  void signUp_success() {
    // given
    given(userRepository.existsByEmail(anyString())).willReturn(false);
    given(userRepository.existsByNickname(anyString())).willReturn(false);
    given(passwordEncoder.encode(anyString())).willReturn("encodedPassword");

    // when
    authService.signUp(signUpRequest);

    // then
    verify(userRepository, times(1)).save(any(User.class));
  }

  @Test
  @DisplayName("실패: 중복된 이메일로 회원가입")
  void signUp_fail_duplicateEmail() {
    // given
    given(userRepository.existsByEmail(anyString())).willReturn(true);

    // when & then
    assertThatThrownBy(() -> authService.signUp(signUpRequest))
        .isInstanceOf(BusinessException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.EMAIL_ALREADY_EXISTS);

    verify(userRepository, never()).save(any(User.class));
  }

  @Test
  @DisplayName("성공: 로그인 및 토큰 발급")
  void login_success() {
    // given
    given(userRepository.findByEmail(anyString())).willReturn(Optional.of(testUser));
    given(passwordEncoder.matches(anyString(), anyString())).willReturn(true);
    given(jwtProvider.createAccessToken(anyString(), anyString())).willReturn("access-token");
    given(jwtProvider.createRefreshToken(anyString())).willReturn("refresh-token");

    // when
    TokenResponse response = authService.login(loginRequest);

    // then
    assertThat(response).isNotNull();
    assertThat(response.accessToken()).isEqualTo("access-token");
    assertThat(response.refreshToken()).isEqualTo("refresh-token");
    verify(jwtProvider, times(1)).createAccessToken(anyString(), anyString());
  }

  @Test
  @DisplayName("실패: 존재하지 않는 사용자로 로그인")
  void login_fail_userNotFound() {
    // given
    given(userRepository.findByEmail(anyString())).willReturn(Optional.empty());

    // when & then
    assertThatThrownBy(() -> authService.login(loginRequest))
        .isInstanceOf(BusinessException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_FOUND);
  }

  @Test
  @DisplayName("실패: 잘못된 비밀번호로 로그인")
  void login_fail_invalidPassword() {
    // given
    given(userRepository.findByEmail(anyString())).willReturn(Optional.of(testUser));
    given(passwordEncoder.matches(anyString(), anyString())).willReturn(false);

    // when & then
    assertThatThrownBy(() -> authService.login(loginRequest))
        .isInstanceOf(BusinessException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PASSWORD);
  }
}
