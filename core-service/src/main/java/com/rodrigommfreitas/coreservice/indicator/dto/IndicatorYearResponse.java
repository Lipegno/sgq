package com.rodrigommfreitas.coreservice.indicator.dto;

import com.rodrigommfreitas.coreservice.user.dto.UserSummary;

import java.math.BigDecimal;

public record IndicatorYearResponse(
        Long id,
        Long indicatorId,
        String name,
        String formula,
        String frequency,
        String valueType,
        UserSummary responsible,
        String notes,
        Long yearId,
        BigDecimal goal
) {}