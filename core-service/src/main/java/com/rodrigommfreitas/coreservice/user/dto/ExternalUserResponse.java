package com.rodrigommfreitas.coreservice.user.dto;

import java.util.List;

public record ExternalUserResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        List<Integer> accessibleYears
) {}