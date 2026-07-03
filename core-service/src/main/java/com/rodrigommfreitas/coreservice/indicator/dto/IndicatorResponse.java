package com.rodrigommfreitas.coreservice.indicator.dto;

import com.rodrigommfreitas.coreservice.indicator.IndicatorFrequency;

import java.util.Set;

public record IndicatorResponse(
        String name,
        String formula,
        IndicatorFrequency frequency,
        String owner,
        Set<String> processNames
) {}