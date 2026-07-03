package com.rodrigommfreitas.coreservice.indicator.dto;

import com.rodrigommfreitas.coreservice.indicator.IndicatorFrequency;
import com.rodrigommfreitas.coreservice.indicator.IndicatorValueType;

import java.math.BigDecimal;

public record CreateIndicatorInProcessRequest(
        String name,
        String formula,
        IndicatorFrequency frequency,
        IndicatorValueType valueType,
        Long responsibleId,
        String notes,
        BigDecimal goal
) {}