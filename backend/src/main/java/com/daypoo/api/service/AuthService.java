package com.daypoo.api.service;

import com.daypoo.api.dto.LoginRequest;
import com.daypoo.api.dto.SignUpRequest;
import com.daypoo.api.dto.TokenResponse;
import com.daypoo.api.entity.User;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.UserRepository;
import com.daypoo.api.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtProvider jwtProvider;

  @Transactional
  public void signUp(SignUpRequest request) {
    if (userRepository.existsByUsername(request.username())) {
      throw new BusinessException(ErrorCode.USERNAME_ALREADY_EXISTS);
    }
    if (userRepository.existsByNickname(request.nickname())) {
      throw new BusinessException(ErrorCode.NICKNAME_ALREADY_EXISTS);
    }

    User user =
        User.builder()
            .username(request.username())
            .password(passwordEncoder.encode(request.password()))
            .nickname(request.nickname())
            .role(User.Role.ROLE_USER)
            .build();

    userRepository.save(user);
  }

  @Transactional
  public TokenResponse login(LoginRequest request) {
    User user =
        userRepository
            .findByUsername(request.username())
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

    if (!passwordEncoder.matches(request.password(), user.getPassword())) {
      throw new BusinessException(ErrorCode.INVALID_PASSWORD);
    }

    String accessToken = jwtProvider.createAccessToken(user.getUsername(), user.getRole().name());
    String refreshToken = jwtProvider.createRefreshToken(user.getUsername());

    return TokenResponse.builder().accessToken(accessToken).refreshToken(refreshToken).build();
  }
}
