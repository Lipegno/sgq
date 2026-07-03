package com.rodrigommfreitas.coreservice.improvementopportunity.dto;

import com.rodrigommfreitas.coreservice.improvementopportunity.ImprovementOpportunityStatus;

public record ImprovementOpportunityYearDetail(
        Long improvementOpportunityYearId,
        Long yearId,
        Integer year,
        ImprovementOpportunityStatus status,
        String evaluation,
        String evaluationDescription
) {}