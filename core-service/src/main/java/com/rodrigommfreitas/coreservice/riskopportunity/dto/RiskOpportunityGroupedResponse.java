package com.rodrigommfreitas.coreservice.riskopportunity.dto;

import java.util.List;

public record RiskOpportunityGroupedResponse(
        List<RiskOpportunityResponse> risks,
        List<RiskOpportunityResponse> opportunities
) {}
