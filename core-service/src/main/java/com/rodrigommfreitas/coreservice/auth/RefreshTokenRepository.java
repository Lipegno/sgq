package com.rodrigommfreitas.coreservice.auth;

import com.rodrigommfreitas.coreservice.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByUserAndRevokedFalse(User user);
    Optional<RefreshToken> findByToken(String token);
    void deleteByUser(User user);

    @Modifying
    @Query("delete from RefreshToken rt where rt.revoked = true or rt.expiresAt < :now")
    int deleteExpiredOrRevoked(@Param("now") Instant now);
}