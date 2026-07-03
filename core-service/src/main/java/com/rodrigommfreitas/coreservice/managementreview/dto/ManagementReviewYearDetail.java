package com.rodrigommfreitas.coreservice.managementreview.dto;

import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;

import java.util.List;

public record ManagementReviewYearDetail(
        Long managementReviewYearId,
        Long yearId,
        Integer year,
        List<DocumentWithVersionsResponse> documents
) {}
