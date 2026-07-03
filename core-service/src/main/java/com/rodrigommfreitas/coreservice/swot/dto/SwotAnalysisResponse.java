package com.rodrigommfreitas.coreservice.swot.dto;

import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;

import java.util.List;

public record SwotAnalysisResponse(
        Long id,
        String description,
        List<DocumentWithVersionsResponse> documents,
        List<SwotYearSummary> years
) {}