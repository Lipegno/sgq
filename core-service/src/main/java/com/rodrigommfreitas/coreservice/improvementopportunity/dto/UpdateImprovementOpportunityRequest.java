package com.rodrigommfreitas.coreservice.improvementopportunity.dto;

import com.rodrigommfreitas.coreservice.improvementopportunity.ImprovementOpportunityOrigin;

public record UpdateImprovementOpportunityRequest(
        String name,
        String description,
        String cause,
        Long responsibleId,
        Long departmentId,
        ImprovementOpportunityOrigin origin
) {}