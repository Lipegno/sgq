package com.rodrigommfreitas.coreservice.indicator.dto;

import com.rodrigommfreitas.coreservice.indicator.IndicatorFrequency;
import com.rodrigommfreitas.coreservice.indicator.IndicatorValueType;

import java.math.BigDecimal;

public record UpdateIndicatorRequest(
        Long indicatorYearId,
        String name,
        String formula,
        IndicatorFrequency frequency,
        String notes,
        IndicatorValueType valueType,
        Long responsibleId,
        Double goal
) {}