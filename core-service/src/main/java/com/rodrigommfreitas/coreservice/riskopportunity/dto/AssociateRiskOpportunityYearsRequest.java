package com.rodrigommfreitas.coreservice.riskopportunity.dto;

import java.util.Set;

public record AssociateRiskOpportunityYearsRequest(
        Set<Long> yearIds,
        boolean copyAttributes,
        boolean copyProcesses
) {}
