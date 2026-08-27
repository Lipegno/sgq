package com.rodrigommfreitas.coreservice.year.dto;

import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;

public record MacroProcessDiagramResponse(
        Long yearId,
        Integer year,
        DocumentWithVersionsResponse document
) {}