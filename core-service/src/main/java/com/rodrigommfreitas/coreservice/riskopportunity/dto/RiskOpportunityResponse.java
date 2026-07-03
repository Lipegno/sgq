package com.rodrigommfreitas.coreservice.riskopportunity.dto;

import com.rodrigommfreitas.coreservice.process.dto.ProcessOptionResponse;
import com.rodrigommfreitas.coreservice.riskopportunity.RiskDecision;
import com.rodrigommfreitas.coreservice.riskopportunity.RiskOpportunityType;

import java.util.List;

public record RiskOpportunityResponse (
    Long id,
    Long riskOpportunityYearId,
    String code,
    RiskOpportunityType type,
    String origin,
    String description,
    String category,

    Long yearId,
    Integer year,

    Integer impact,
    Integer probability,
    Integer riskLevel,
    RiskDecision decision,
    List<ProcessOptionResponse> processes
){
}
