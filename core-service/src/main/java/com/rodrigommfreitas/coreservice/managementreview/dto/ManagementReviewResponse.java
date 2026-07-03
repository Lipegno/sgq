package com.rodrigommfreitas.coreservice.managementreview.dto;

import java.util.List;

public record ManagementReviewResponse(
        Long id,
        String description,
        List<ManagementReviewYearDetail> years
) {}
