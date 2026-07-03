package com.rodrigommfreitas.coreservice.document.dto;

public record DocumentResponse(
        Long id,
        Boolean versioned,
        Double currentVersion
) {}