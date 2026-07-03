package com.rodrigommfreitas.coreservice.qualityobjective.dto;

import com.rodrigommfreitas.coreservice.qualityobjective.QualityObjectiveStatus;

import java.util.Set;

public record UpdateQualityObjectiveRequest(
        String objectiveTitle,
        String description,
        Long responsibleId,
        QualityObjectiveStatus status,
        Long yearId,
        Set<Long> processYearIds,
        Set<Long> indicatorYearIds
) {}