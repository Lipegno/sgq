package com.rodrigommfreitas.coreservice.auth;

import com.rodrigommfreitas.coreservice.auth.dto.AuthResult;
import com.rodrigommfreitas.coreservice.auth.dto.LoginRequest;
import com.rodrigommfreitas.coreservice.auth.exception.InvalidCredentialsException;
import com.rodrigommfreitas.coreservice.user.Role;
import com.rodrigommfreitas.coreservice.user.User;
import com.rodrigommfreitas.coreservice.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    @Transactional
    public AuthResult login(String email, String password, String providedRefreshToken) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new InvalidCredentialsException();
        }

        String accessToken = jwtService.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.getOrCreate(user, providedRefreshToken);

        return new AuthResult(
                accessToken,
                refreshToken.getToken(),
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRoles().stream().map(Role::name).collect(java.util.stream.Collectors.toSet())
        );
    }

    @Transactional
    public AuthResult refresh(String refreshTokenStr) {
        if (refreshTokenStr == null) {
            throw new com.rodrigommfreitas.coreservice.auth.exception.InvalidRefreshTokenException();
        }

        RefreshToken refreshToken = refreshTokenService.validate(refreshTokenStr);
        User user = refreshToken.getUser();
        String newAccessToken = jwtService.generateToken(user);

        return new AuthResult(
                newAccessToken,
                refreshToken.getToken(),
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRoles().stream().map(Role::name).collect(java.util.stream.Collectors.toSet())
        );
    }

    @Transactional
    public void logout(String refreshTokenStr) {
        if (refreshTokenStr == null) return;
        refreshTokenService.delete(refreshTokenStr);
    }
}