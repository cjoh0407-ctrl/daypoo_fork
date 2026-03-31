package com.daypoo.api.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final JwtProvider jwtProvider;
  private final StringRedisTemplate redisTemplate;

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String token = resolveToken(request);

    if (token != null && jwtProvider.validateToken(token)) {
      // 블랙리스트 확인
      Boolean isBlacklisted = redisTemplate.hasKey("blacklist:" + token);
      if (Boolean.TRUE.equals(isBlacklisted)) {
        filterChain.doFilter(request, response);
        return;
      }

      Claims claims = jwtProvider.getClaims(token);
      String email = claims.getSubject();
      String role = claims.get("role", String.class);

      Authentication authentication =
          new UsernamePasswordAuthenticationToken(
              email, null, Collections.singleton(new SimpleGrantedAuthority(role)));

      SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    filterChain.doFilter(request, response);
  }

  private String resolveToken(HttpServletRequest request) {
    // 1. Authorization 헤더에서 토큰 추출
    String bearerToken = request.getHeader("Authorization");
    if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
      return bearerToken.substring(7);
    }

    // 2. 쿼리 파라미터에서 토큰 추출 (SSE용: /api/v1/notifications/subscribe 경로만 허용)
    String path = request.getRequestURI();
    if (path != null && path.contains("/notifications/subscribe")) {
      String tokenParam = request.getParameter("token");
      if (!StringUtils.hasText(tokenParam)) {
        tokenParam = request.getParameter("sseToken");
      }
      if (StringUtils.hasText(tokenParam)) {
        return tokenParam;
      }
    }

    return null;
  }
}
