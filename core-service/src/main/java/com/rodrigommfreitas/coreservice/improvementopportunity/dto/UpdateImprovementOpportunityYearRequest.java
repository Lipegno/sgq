package com.rodrigommfreitas.coreservice.improvementopportunity.dto;

import com.rodrigommfreitas.coreservice.improvementopportunity.ImprovementOpportunityStatus;

public record UpdateImprovementOpportunityYearRequest(
        ImprovementOpportunityStatus status,
        String evaluation,
        String evaluationDescription
) {}