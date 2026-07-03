package com.rodrigommfreitas.coreservice.indicator.dto;

import com.rodrigommfreitas.coreservice.indicator.IndicatorFrequency;
import com.rodrigommfreitas.coreservice.measurement.dto.MeasurementResponse;
import com.rodrigommfreitas.coreservice.year.dto.YearOption;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

public record IndicatorHierarchyResponse(
        Long indicatorYearId,
        Long indicatorId,
        String name,
        String formula,
        IndicatorFrequency frequency,
        BigDecimal goal,
        Set<MeasurementResponse> measurements,
        Set<YearOption> years
) {}