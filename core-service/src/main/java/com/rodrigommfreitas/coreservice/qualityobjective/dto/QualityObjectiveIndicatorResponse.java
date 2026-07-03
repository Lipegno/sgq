package com.rodrigommfreitas.coreservice.qualityobjective.dto;

import com.rodrigommfreitas.coreservice.indicator.IndicatorFrequency;
import com.rodrigommfreitas.coreservice.measurement.dto.MeasurementResponse;
import com.rodrigommfreitas.coreservice.user.dto.UserSummary;

import java.math.BigDecimal;
import java.util.List;

public record QualityObjectiveIndicatorResponse(
        Long indicatorYearId,
        Long indicatorId,
        String name,
        String formula,
        IndicatorFrequency frequency,
        String valueType,
        UserSummary responsible,
        String notes,
        BigDecimal goal,
        List<MeasurementResponse> measurements
) {}