package com.rodrigommfreitas.coreservice.auth.dto;

import java.util.Set;

public record AuthResult(
        String accessToken,
        String refreshToken,
        Long userId,
        String email,
        String firstName,
        String lastName,
        Set<String> roles
) {}