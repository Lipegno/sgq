package com.rodrigommfreitas.coreservice.auth;

import com.rodrigommfreitas.coreservice.user.User;
import com.rodrigommfreitas.coreservice.user.UserRepository;
import com.rodrigommfreitas.coreservice.auth.exception.InvalidRefreshTokenException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository repository;

    @Transactional
    public RefreshToken create(com.rodrigommfreitas.coreservice.user.User user) {
        return repository.save(RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiresAt(Instant.now().plus(30, ChronoUnit.DAYS))
                .revoked(false)
                .build());
    }

    @Transactional
    public RefreshToken validate(String token) {
        RefreshToken refreshToken = repository.findByToken(token)
                .orElseThrow(InvalidRefreshTokenException::new);
        if (refreshToken.isRevoked() || refreshToken.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidRefreshTokenException();
        }
        return refreshToken;
    }

    @Transactional
    public RefreshToken getOrCreate(com.rodrigommfreitas.coreservice.user.User user, String providedToken) {
        if (providedToken != null && !providedToken.isBlank()) {
            try {
                return validate(providedToken);
            } catch (InvalidRefreshTokenException ex) {
                repository.findByToken(providedToken).ifPresent(repository::delete);
            }
        }
        return repository.findByUserAndRevokedFalse(user)
                .filter(t -> t.getExpiresAt().isAfter(Instant.now()))
                .orElseGet(() -> create(user));
    }

    @Transactional
    public void revoke(RefreshToken token) {
        token.setRevoked(true);
        repository.save(token);
    }

    @Transactional
    public void delete(String token) {
        repository.findByToken(token).ifPresent(repository::delete);
    }
}