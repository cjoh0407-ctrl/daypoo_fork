package com.daypoo.api.security;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Base64;
import java.util.Optional;

public class CookieUtils {

  private static final ObjectMapper objectMapper = new ObjectMapper();

  public static Optional<Cookie> getCookie(HttpServletRequest request, String name) {
    Cookie[] cookies = request.getCookies();
    if (cookies != null) {
      for (Cookie cookie : cookies) {
        if (cookie.getName().equals(name)) {
          return Optional.of(cookie);
        }
      }
    }
    return Optional.empty();
  }

  public static void addCookie(
      HttpServletResponse response, String name, String value, int maxAge) {
    Cookie cookie = new Cookie(name, value);
    cookie.setPath("/");
    cookie.setHttpOnly(true);
    cookie.setMaxAge(maxAge);
    response.addCookie(cookie);
  }

  public static void deleteCookie(
      HttpServletRequest request, HttpServletResponse response, String name) {
    Cookie[] cookies = request.getCookies();
    if (cookies != null) {
      for (Cookie cookie : cookies) {
        if (cookie.getName().equals(name)) {
          cookie.setValue("");
          cookie.setPath("/");
          cookie.setMaxAge(0);
          response.addCookie(cookie);
        }
      }
    }
  }

  public static String serialize(Object object) {
    try {
      return Base64.getUrlEncoder().encodeToString(objectMapper.writeValueAsBytes(object));
    } catch (JsonProcessingException e) {
      throw new IllegalArgumentException("Could not serialize object", e);
    }
  }

  public static <T> T deserialize(Cookie cookie, Class<T> cls) {
    try {
      byte[] decoded = Base64.getUrlDecoder().decode(cookie.getValue());
      return objectMapper.readValue(decoded, cls);
    } catch (IOException e) {
      throw new IllegalArgumentException("Could not deserialize cookie", e);
    }
  }
}
