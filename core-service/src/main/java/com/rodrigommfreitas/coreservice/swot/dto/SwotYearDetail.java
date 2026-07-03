package com.rodrigommfreitas.coreservice.swot.dto;

import java.util.List;

public record SwotYearDetail(
        Long swotYearId,
        Long yearId,
        Integer year,
        List<SwotItemResponse> strengths,
        List<SwotItemResponse> weaknesses,
        List<SwotItemResponse> opportunities,
        List<SwotItemResponse> threats
) {}