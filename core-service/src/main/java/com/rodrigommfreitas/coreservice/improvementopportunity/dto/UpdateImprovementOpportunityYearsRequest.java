package com.rodrigommfreitas.coreservice.improvementopportunity.dto;

import java.util.Set;

public record UpdateImprovementOpportunityYearsRequest(
        Set<Long> associateYearIds,
        Set<Long> disassociateYearIds
) {}