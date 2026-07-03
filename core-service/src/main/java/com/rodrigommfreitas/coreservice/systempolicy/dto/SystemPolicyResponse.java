package com.rodrigommfreitas.coreservice.systempolicy.dto;

import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;

public record SystemPolicyResponse(
        Long id,
        String description,
        DocumentWithVersionsResponse document
) {}