package com.rodrigommfreitas.coreservice.improvementopportunity.dto;

import com.rodrigommfreitas.coreservice.improvementopportunity.ImprovementOpportunityOrigin;

import java.util.Set;

public record CreateImprovementOpportunityRequest(
        String name,
        String description,
        String cause,
        Long responsibleId,
        Long departmentId,
        ImprovementOpportunityOrigin origin,
        Set<Long> yearIds
) {}