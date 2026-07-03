package com.rodrigommfreitas.coreservice.customersatisfaction.dto;

import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;

import java.util.List;

public record CustomerSatisfactionYearDetail(
        Long customerSatisfactionYearId,
        Long yearId,
        Integer year,
        List<DocumentWithVersionsResponse> documents
) {}
