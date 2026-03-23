package com.daypoo.api.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

  private final JwtProvider jwtProvider;
  private final com.daypoo.api.repository.UserRepository userRepository;

  @org.springframework.beans.factory.annotation.Value("${app.frontend.url}")
  private String frontendUrl;

  @Override
  public void onAuthenticationSuccess(
      HttpServletRequest request, HttpServletResponse response, Authentication authentication)
      throws IOException, ServletException {
    OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
    OAuth2AuthenticationToken authToken = (OAuth2AuthenticationToken) authentication;

    String registrationId = authToken.getAuthorizedClientRegistrationId();
    String providerId;

    if ("kakao".equals(registrationId)) {
      providerId = String.valueOf(oAuth2User.getAttributes().get("id"));
    } else if ("google".equals(registrationId)) {
      providerId = (String) oAuth2User.getAttributes().get("sub");
    } else {
      providerId = oAuth2User.getName();
    }

    String username = registrationId + "_" + providerId;
    String email;
    if ("kakao".equals(registrationId)) {
      java.util.Map<String, Object> kakaoAccount =
          (java.util.Map<String, Object>) oAuth2User.getAttributes().get("kakao_account");
      email =
          kakaoAccount != null && kakaoAccount.get("email") != null
              ? (String) kakaoAccount.get("email")
              : username + "@daypoo.com";
    } else {
      email =
          oAuth2User.getAttributes().get("email") != null
              ? (String) oAuth2User.getAttributes().get("email")
              : username + "@daypoo.com";
    }

    String targetUrl;

    // 가입 여부 확인
    if (userRepository.findByEmail(email).isPresent()) {
      // 기존 회원: 로그인 처리
      String accessToken = jwtProvider.createAccessToken(email, "ROLE_USER");
      String refreshToken = jwtProvider.createRefreshToken(email);

      targetUrl =
          frontendUrl
              + "/auth/callback?access_token="
              + accessToken
              + "&refresh_token="
              + refreshToken;
      log.info("Existing OAuth2 User Login Success! Redirecting to: {}", targetUrl);
    } else {
      // 신규 회원: 닉네임 설정 페이지로 유도
      String registrationToken = jwtProvider.createRegistrationToken(email, "ROLE_USER");
      targetUrl = frontendUrl + "/signup/social?registration_token=" + registrationToken;
      log.info("New OAuth2 User Detected! Redirecting to nickname setup: {}", targetUrl);
    }

    getRedirectStrategy().sendRedirect(request, response, targetUrl);
  }
}
