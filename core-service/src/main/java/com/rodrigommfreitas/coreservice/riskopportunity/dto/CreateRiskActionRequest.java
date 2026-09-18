package com.rodrigommfreitas.coreservice.riskopportunity.dto;

public record CreateRiskActionRequest(
        String title,
        Long responsibleId,
        String effectivenessEvaluationMethod
) {}
