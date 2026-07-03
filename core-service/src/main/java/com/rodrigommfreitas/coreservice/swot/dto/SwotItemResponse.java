package com.rodrigommfreitas.coreservice.swot.dto;

import com.rodrigommfreitas.coreservice.swot.SwotItemType;

import java.util.List;

public record SwotItemResponse(
        Long id,
        String text,
        SwotItemType type,
        List<SwotYearSummary> years
) {}