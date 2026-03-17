package com.daypoo.api.service;

import com.daypoo.api.dto.LoginRequest;
import com.daypoo.api.dto.SignUpRequest;
import com.daypoo.api.dto.TokenResponse;
import com.daypoo.api.entity.User;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.UserRepository;
import com.daypoo.api.security.JwtProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("인증 서비스 테스트")
class AuthServiceTest {

    @InjectMocks
    private AuthService authService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtProvider jwtProvider;

    private SignUpRequest signUpRequest;
    private LoginRequest loginRequest;
    private User testUser;

    @BeforeEach
    void setUp() {
        signUpRequest = new SignUpRequest("testUser", "password123", "PoopKing");
        loginRequest = new LoginRequest("testUser", "password123");
        testUser = User.builder()
                .username("testUser")
                .password("encodedPassword")
                .nickname("PoopKing")
                .role(User.Role.ROLE_USER)
                .build();
    }

    @Test
    @DisplayName("성공: 회원가입")
    void signUp_success() {
        // given
        given(userRepository.existsByUsername(anyString())).willReturn(false);
        given(userRepository.existsByNickname(anyString())).willReturn(false);
        given(passwordEncoder.encode(anyString())).willReturn("encodedPassword");

        // when
        authService.signUp(signUpRequest);

        // then
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("실패: 중복된 사용자명으로 회원가입")
    void signUp_fail_duplicateUsername() {
        // given
        given(userRepository.existsByUsername(anyString())).willReturn(true);

        // when & then
        assertThatThrownBy(() -> authService.signUp(signUpRequest))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USERNAME_ALREADY_EXISTS);

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("성공: 로그인 및 토큰 발급")
    void login_success() {
        // given
        given(userRepository.findByUsername(anyString())).willReturn(Optional.of(testUser));
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
        given(userRepository.findByUsername(anyString())).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_FOUND);
    }

    @Test
    @DisplayName("실패: 잘못된 비밀번호로 로그인")
    void login_fail_invalidPassword() {
        // given
        given(userRepository.findByUsername(anyString())).willReturn(Optional.of(testUser));
        given(passwordEncoder.matches(anyString(), anyString())).willReturn(false);

        // when & then
        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PASSWORD);
    }
}
