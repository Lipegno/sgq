package com.rodrigommfreitas.coreservice.auth;

import com.rodrigommfreitas.coreservice.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    RefreshTokenRepository repository;

    RefreshTokenService service;
    User userA;
    User userB;

    @BeforeEach
    void setUp() {
        service = new RefreshTokenService(repository);
        userA = User.builder().id(1L).email("a@x.pt").build();
        userB = User.builder().id(2L).email("b@x.pt").build();
    }

    private RefreshToken tokenOf(User user, String value) {
        return RefreshToken.builder().token(value).user(user)
                .expiresAt(Instant.now().plus(1, ChronoUnit.DAYS)).revoked(false).build();
    }

    @Test
    void reusesTheProvidedTokenWhenItBelongsToTheUserLoggingIn() {
        RefreshToken own = tokenOf(userA, "token-a");
        when(repository.findByToken("token-a")).thenReturn(Optional.of(own));

        assertSame(own, service.getOrCreate(userA, "token-a"));
    }

    @Test
    void neverReusesATokenThatBelongsToAnotherAccount() {
        // browser com o cookie da conta A; faz login a conta B
        RefreshToken tokenOfA = tokenOf(userA, "token-a");
        RefreshToken tokenOfB = tokenOf(userB, "token-b");
        when(repository.findByToken("token-a")).thenReturn(Optional.of(tokenOfA));
        when(repository.findByUserAndRevokedFalse(userB)).thenReturn(Optional.of(tokenOfB));

        RefreshToken result = service.getOrCreate(userB, "token-a");

        assertNotEquals("token-a", result.getToken());
        assertEquals(userB.getId(), result.getUser().getId());
    }

    @Test
    void createsAFreshTokenWhenTheOtherAccountsTokenIsIgnoredAndUserHasNone() {
        RefreshToken tokenOfA = tokenOf(userA, "token-a");
        when(repository.findByToken("token-a")).thenReturn(Optional.of(tokenOfA));
        when(repository.findByUserAndRevokedFalse(userB)).thenReturn(Optional.empty());
        when(repository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

        RefreshToken result = service.getOrCreate(userB, "token-a");

        assertEquals(userB.getId(), result.getUser().getId());
        assertNotEquals("token-a", result.getToken());
    }
}
