package com.daypoo.api.service;

import com.daypoo.api.dto.LoginRequest;
import com.daypoo.api.dto.PasswordChangeRequest;
import com.daypoo.api.dto.ProfileUpdateRequest;
import com.daypoo.api.dto.SignUpRequest;
import com.daypoo.api.dto.SocialSignUpRequest;
import com.daypoo.api.dto.TokenResponse;
import com.daypoo.api.dto.UserResponse;
import com.daypoo.api.entity.User;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.UserRepository;
import com.daypoo.api.security.JwtProvider;
import io.jsonwebtoken.Claims;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtProvider jwtProvider;
  private final EmailService emailService;

  @Transactional
  public TokenResponse socialSignUp(SocialSignUpRequest request) {
    if (!jwtProvider.validateToken(request.registrationToken())) {
      throw new BusinessException(ErrorCode.INVALID_TOKEN);
    }

    Claims claims = jwtProvider.getClaims(request.registrationToken());
    String type = claims.get("type", String.class);
    if (!"registration".equals(type)) {
      throw new BusinessException(ErrorCode.INVALID_TOKEN);
    }

    String email = claims.get("email", String.class);
    String roleClaim = claims.get("role", String.class);

    checkNicknameDuplicate(request.nickname());

    // 중복 가입 방지
    if (userRepository.existsByEmail(email)) {
      throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
    }

    User user = User.builder()
        .password(passwordEncoder.encode(UUID.randomUUID().toString()))
        .email(email)
        .nickname(request.nickname())
        .role(User.Role.valueOf(roleClaim))
        .build();

    userRepository.save(user);

    String accessToken = jwtProvider.createAccessToken(user.getEmail(), user.getRole().name());
    String refreshToken = jwtProvider.createRefreshToken(user.getEmail());

    return TokenResponse.builder().accessToken(accessToken).refreshToken(refreshToken).build();
  }

  @Transactional(readOnly = true)
  public UserResponse getCurrentUserInfo() {
    String email = SecurityContextHolder.getContext().getAuthentication().getName();
    User user = userRepository
        .findByEmail(email)
        .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

    return UserResponse.from(user);
  }

  @Transactional
  public void signUp(SignUpRequest request) {
    checkEmailDuplicate(request.email());
    checkNicknameDuplicate(request.nickname());

    User user = User.builder()
        .password(passwordEncoder.encode(request.password()))
        .email(request.email())
        .nickname(request.nickname())
        .role(User.Role.ROLE_USER)
        .build();

    userRepository.save(user);
  }

  public String findIdByNickname(String nickname) {
    User user = userRepository
        .findByNickname(nickname)
        .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

    // 이메일 마스킹 (he***@example.com 형태)
    String email = user.getEmail();
    int atIndex = email.indexOf("@");
    if (atIndex <= 2)
      return email;

    return email.substring(0, 2) + "***" + email.substring(atIndex);
  }

  public void checkEmailDuplicate(String email) {
    if (userRepository.existsByEmail(email)) {
      throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
    }
  }

  public void checkNicknameDuplicate(String nickname) {
    if (userRepository.existsByNickname(nickname)) {
      throw new BusinessException(ErrorCode.NICKNAME_ALREADY_EXISTS);
    }
  }

  @Transactional
  public TokenResponse login(LoginRequest request) {
    User user = userRepository
        .findByEmail(request.email())
        .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

    if (!passwordEncoder.matches(request.password(), user.getPassword())) {
      throw new BusinessException(ErrorCode.INVALID_PASSWORD);
    }

    String accessToken = jwtProvider.createAccessToken(user.getEmail(), user.getRole().name());
    String refreshToken = jwtProvider.createRefreshToken(user.getEmail());

    return TokenResponse.builder().accessToken(accessToken).refreshToken(refreshToken).build();
  }

  @Transactional
  public void resetPassword(String email) {
    User user = userRepository
        .findByEmail(email)
        .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

    // 1. 임시 비밀번호 생성 (8자리)
    String tempPassword = UUID.randomUUID().toString().substring(0, 8);

    // 2. 사용자 비밀번호 업데이트
    user.updatePassword(passwordEncoder.encode(tempPassword));

    // 3. 이메일 발송
    String subject = "[대똥여지도] 임시 비밀번호 안내";
    String text = String.format(
        "안녕하세요, 대똥여지도(DayPoo)입니다.\n\n"
            + "요청하신 임시 비밀번호를 안내해 드립니다.\n"
            + "임시 비밀번호: %s\n\n"
            + "로그인 후 반드시 비밀번호를 변경해 주세요.",
        tempPassword);

    emailService.sendEmail(user.getEmail(), subject, text);
  }

  @Transactional
  public void updateProfile(String email, ProfileUpdateRequest request) {
    User user = userRepository
        .findByEmail(email)
        .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

    // 닉네임이 현재와 다를 경우만 중복 체크
    if (!user.getNickname().equals(request.nickname())) {
      checkNicknameDuplicate(request.nickname());
      user.updateNickname(request.nickname());
    }
  }

  @Transactional
  public void changePassword(String email, PasswordChangeRequest request) {
    User user = userRepository
        .findByEmail(email)
        .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

    if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
      throw new BusinessException(ErrorCode.INVALID_PASSWORD);
    }

    user.updatePassword(passwordEncoder.encode(request.newPassword()));
  }

  @Transactional(readOnly = true)
  public TokenResponse refresh(String refreshToken) {
    if (!jwtProvider.validateToken(refreshToken)) {
      throw new BusinessException(ErrorCode.INVALID_TOKEN);
    }

    Claims claims = jwtProvider.getClaims(refreshToken);
    String email = claims.getSubject();

    User user = userRepository
        .findByEmail(email)
        .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

    String newAccessToken = jwtProvider.createAccessToken(user.getEmail(), user.getRole().name());

    return TokenResponse.builder().accessToken(newAccessToken).refreshToken(refreshToken).build();
  }

  @Transactional
  public void logout(String email) {
    // Redis 블랙리스트 등을 사용하여 토큰을 무효화하는 로직을 여기에 구현할 수 있습니다.
    // 현재는 로그아웃 성공 메시지만 반환하는 수준으로 처리합니다.
  }

  @Transactional
  public void withdraw(String email, String password) {
    User user = userRepository
        .findByEmail(email)
        .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

    if (!passwordEncoder.matches(password, user.getPassword())) {
      throw new BusinessException(ErrorCode.INVALID_PASSWORD);
    }

    userRepository.delete(user);
  }
}
