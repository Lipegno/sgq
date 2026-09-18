package com.rodrigommfreitas.coreservice.riskopportunity.dto;

import com.rodrigommfreitas.coreservice.riskopportunity.ActionStatus;
import com.rodrigommfreitas.coreservice.user.dto.UserSummary;

public record RiskActionResponse(
        Long id,
        String title,
        UserSummary responsible,
        String effectivenessEvaluationMethod,
        ActionStatus status,
        String notes,
        String monitoringQ1,
        String monitoringQ2,
        String monitoringQ3,
        String monitoringQ4
) {}
