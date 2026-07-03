package com.rodrigommfreitas.coreservice.user.dto;

public record UserSummary(
        Long id,
        String firstName,
        String lastName,
        String email
) {}