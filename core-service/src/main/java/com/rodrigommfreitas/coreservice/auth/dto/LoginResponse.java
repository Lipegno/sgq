package com.rodrigommfreitas.coreservice.auth.dto;

import java.util.Set;

public record LoginResponse(
        String accessToken,
        Long userId,
        String email,
        String firstName,
        String lastName,
        Set<String> roles
) {}