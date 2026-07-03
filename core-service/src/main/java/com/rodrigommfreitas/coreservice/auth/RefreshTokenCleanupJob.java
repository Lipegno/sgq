package com.rodrigommfreitas.coreservice.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Component
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenCleanupJob {

    private final RefreshTokenRepository refreshTokenRepository;

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanup() {
        int deleted = refreshTokenRepository.deleteExpiredOrRevoked(Instant.now());
        if (deleted > 0) {
            log.info("Deleted {} expired/revoked refresh tokens", deleted);
        }
    }
}