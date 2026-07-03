package com.rodrigommfreitas.coreservice.riskopportunity.dto;

import com.rodrigommfreitas.coreservice.riskopportunity.RiskDecision;
import com.rodrigommfreitas.coreservice.riskopportunity.RiskOpportunityType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.Set;

public record RiskOpportunityCreateRequest(
    @NotNull
    String origin,
    @NotNull
    String description,
    @NotNull
    String category,
    @NotNull
    RiskOpportunityType type,
    @NotNull
    Set<Long> yearIds,

    @Min(1)
    @Max(5)
    Integer impact,
    @Min(1)
    @Max(5)
    Integer probability,
    RiskDecision decision,
    Set<Long> processYearIds
    ) {
}
