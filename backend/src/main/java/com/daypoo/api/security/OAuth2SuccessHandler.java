package com.daypoo.api.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

  private final JwtProvider jwtProvider;

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
    String accessToken = jwtProvider.createAccessToken(username, "ROLE_USER");
    String refreshToken = jwtProvider.createRefreshToken(username);

    String targetUrl =
        frontendUrl
            + "/auth/callback?access_token="
            + accessToken
            + "&refresh_token="
            + refreshToken;
    getRedirectStrategy().sendRedirect(request, response, targetUrl);
  }
}
