package com.rodrigommfreitas.coreservice.auth;

import com.rodrigommfreitas.coreservice.auth.dto.LoginRequest;
import com.rodrigommfreitas.coreservice.auth.dto.LoginResponse;
import com.rodrigommfreitas.coreservice.auth.util.CookieUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import org.springframework.http.ResponseCookie;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @ResponseStatus(HttpStatus.OK)
    public LoginResponse login(@Valid @RequestBody LoginRequest request,
                               HttpServletRequest httpRequest,
                               HttpServletResponse response) {
        String refreshToken = CookieUtil.getRefreshTokenFromCookies(httpRequest);
        var result = authService.login(request.email(), request.password(), refreshToken);
        ResponseCookie cookie = CookieUtil.createRefreshTokenCookie(result.refreshToken(), Duration.ofDays(30));
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return new LoginResponse(result.accessToken(), result.userId(), result.email(), result.firstName(), result.lastName(), result.roles());
    }

    @PostMapping("/refresh")
    @ResponseStatus(HttpStatus.OK)
    public LoginResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = CookieUtil.getRefreshTokenFromCookies(request);
        var result = authService.refresh(refreshToken);
        ResponseCookie cookie = CookieUtil.createRefreshTokenCookie(result.refreshToken(), Duration.ofDays(30));
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return new LoginResponse(result.accessToken(), result.userId(), result.email(), result.firstName(), result.lastName(), result.roles());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = CookieUtil.getRefreshTokenFromCookies(request);
        authService.logout(refreshToken);
        ResponseCookie deletedCookie = CookieUtil.deleteRefreshTokenCookie();
        response.addHeader(HttpHeaders.SET_COOKIE, deletedCookie.toString());
    }
}