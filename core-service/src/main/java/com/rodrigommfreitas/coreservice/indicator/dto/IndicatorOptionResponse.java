package com.rodrigommfreitas.coreservice.indicator.dto;

import com.rodrigommfreitas.coreservice.indicator.IndicatorFrequency;
import com.rodrigommfreitas.coreservice.user.dto.UserSummary;

public record IndicatorOptionResponse(
        Long indicatorYearId,
        Long indicatorId,
        String name,
        IndicatorFrequency frequency,
        UserSummary responsible
) {}