package com.rodrigommfreitas.coreservice.indicator.dto;

import com.rodrigommfreitas.coreservice.indicator.IndicatorFrequency;
import com.rodrigommfreitas.coreservice.measurement.dto.MeasurementResponse;
import com.rodrigommfreitas.coreservice.process.dto.ProcessOptionResponse;
import com.rodrigommfreitas.coreservice.user.dto.UserSummary;

import java.math.BigDecimal;
import java.util.List;

public record IndicatorFullResponse(
        Long indicatorYearId,
        Long indicatorId,
        String name,
        String formula,
        IndicatorFrequency frequency,
        String valueType,
        UserSummary responsible,
        String notes,
        BigDecimal goal,
        List<ProcessOptionResponse> processes,
        List<MeasurementResponse> measurements
) {}