package com.rodrigommfreitas.coreservice.indicator.dto;

import com.rodrigommfreitas.coreservice.indicator.IndicatorFrequency;
import com.rodrigommfreitas.coreservice.indicator.IndicatorValueType;

import java.math.BigDecimal;

public record CreateIndicatorRequest(
        String name,
        String formula,
        IndicatorFrequency frequency,
        IndicatorValueType valueType,
        Long responsibleId,
        String notes,
        Long yearId,
        BigDecimal goal
) {}