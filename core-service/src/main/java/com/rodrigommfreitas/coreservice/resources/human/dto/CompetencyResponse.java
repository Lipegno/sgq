package com.rodrigommfreitas.coreservice.resources.human.dto;

import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;

public record CompetencyResponse(
        Long id,
        String name,
        String details,
        DocumentWithVersionsResponse document
) {}
