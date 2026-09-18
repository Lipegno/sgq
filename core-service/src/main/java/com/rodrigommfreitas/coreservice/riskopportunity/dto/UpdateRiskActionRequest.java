package com.rodrigommfreitas.coreservice.riskopportunity.dto;

import com.rodrigommfreitas.coreservice.riskopportunity.ActionStatus;

public record UpdateRiskActionRequest(
        String title,
        Long responsibleId,
        String effectivenessEvaluationMethod,
        ActionStatus status,
        String notes,
        String monitoringQ1,
        String monitoringQ2,
        String monitoringQ3,
        String monitoringQ4
) {}
