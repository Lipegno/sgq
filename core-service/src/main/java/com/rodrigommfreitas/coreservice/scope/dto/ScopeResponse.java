package com.rodrigommfreitas.coreservice.scope.dto;

import com.rodrigommfreitas.coreservice.document.dto.DocumentVersionResponse;
import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;

public record ScopeResponse(
        Long id,
        String description,
        DocumentWithVersionsResponse document
) {}
