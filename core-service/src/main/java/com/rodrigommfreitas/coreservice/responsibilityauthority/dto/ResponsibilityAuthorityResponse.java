package com.rodrigommfreitas.coreservice.responsibilityauthority.dto;

import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;

public record ResponsibilityAuthorityResponse(
        Long id,
        String description,
        DocumentWithVersionsResponse document
) {}