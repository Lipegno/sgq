package com.rodrigommfreitas.coreservice.qualityobjective.dto;

import com.rodrigommfreitas.coreservice.process.dto.ProcessOptionResponse;
import com.rodrigommfreitas.coreservice.qualityobjective.QualityObjectiveStatus;
import com.rodrigommfreitas.coreservice.user.dto.UserSummary;
import com.rodrigommfreitas.coreservice.year.dto.YearOption;

import java.util.List;

public record QualityObjectiveResponse(
        Long id,
        Long qualityObjectiveYearId,
        String objectiveTitle,
        String description,
        UserSummary responsible,

        Long yearId,
        Integer year,
        QualityObjectiveStatus status,
        List<YearOption> years,

        List<ProcessOptionResponse> processes,
        List<QualityObjectiveIndicatorResponse> indicators
) {}