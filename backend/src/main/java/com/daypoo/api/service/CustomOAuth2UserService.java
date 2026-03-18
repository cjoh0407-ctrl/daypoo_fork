package com.daypoo.api.service;

import com.daypoo.api.entity.User;
import com.daypoo.api.repository.UserRepository;
import com.daypoo.api.security.GoogleOAuth2UserInfo;
import com.daypoo.api.security.KakaoOAuth2UserInfo;
import com.daypoo.api.security.OAuth2UserInfo;
import java.util.Collections;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  @Override
  public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
    OAuth2User oAuth2User = super.loadUser(userRequest);

    String registrationId = userRequest.getClientRegistration().getRegistrationId();
    String userNameAttributeName =
        userRequest
            .getClientRegistration()
            .getProviderDetails()
            .getUserInfoEndpoint()
            .getUserNameAttributeName();

    OAuth2UserInfo oAuth2UserInfo = null;
    if (registrationId.equals("kakao")) {
      oAuth2UserInfo = new KakaoOAuth2UserInfo(oAuth2User.getAttributes());
    } else if (registrationId.equals("google")) {
      oAuth2UserInfo = new GoogleOAuth2UserInfo(oAuth2User.getAttributes());
    } else {
      throw new OAuth2AuthenticationException("지원하지 않는 소셜 로그인 제공자입니다.");
    }

    String provider = oAuth2UserInfo.getProvider();
    String providerId = oAuth2UserInfo.getProviderId();
    String email = oAuth2UserInfo.getEmail();
    String nickname = oAuth2UserInfo.getName();

    // 소셜 로그인 회원의 경우 username은 provider_providerId 로 생성
    String username = provider + "_" + providerId;

    // 이메일이 없는 경우
    if (email == null) {
      email = username + "@daypoo.com";
    }

    // 닉네임이 없는 경우 랜덤 생성
    if (nickname == null) {
      nickname = "user_" + UUID.randomUUID().toString().substring(0, 8);
    }

    String finalNickname = nickname;
    User user =
        userRepository
            .findByUsername(username)
            .orElseGet(
                () -> {
                  // 신규 가입
                  String dummyPassword = passwordEncoder.encode(UUID.randomUUID().toString());
                  User newUser =
                      User.builder()
                          .username(username)
                          .password(dummyPassword)
                          .nickname(finalNickname)
                          .role(User.Role.ROLE_USER)
                          .build();
                  return userRepository.save(newUser);
                });

    return new DefaultOAuth2User(
        Collections.emptyList(), oAuth2User.getAttributes(), userNameAttributeName);
  }
}
