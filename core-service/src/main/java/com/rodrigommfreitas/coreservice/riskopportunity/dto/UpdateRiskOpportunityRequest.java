package com.rodrigommfreitas.coreservice.riskopportunity.dto;

import com.rodrigommfreitas.coreservice.riskopportunity.RiskDecision;

public record UpdateRiskOpportunityRequest(

        // BASE ENTITY
        String name,
        String origin,
        String description,
        String category,

        // YEAR ENTITY (optional target year context)
        Long yearId,

        Integer impact,
        Integer probability,
        RiskDecision decision

) {}