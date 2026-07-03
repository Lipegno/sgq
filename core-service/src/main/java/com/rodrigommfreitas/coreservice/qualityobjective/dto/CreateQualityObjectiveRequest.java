package com.rodrigommfreitas.coreservice.qualityobjective.dto;

import com.rodrigommfreitas.coreservice.qualityobjective.QualityObjectiveStatus;

import java.util.Set;

public record CreateQualityObjectiveRequest(
        String objectiveTitle,
        String description,
        Long responsibleId,
        QualityObjectiveStatus status,
        Set<Long> yearIds,
        Set<Long> processYearIds,
        Set<Long> indicatorYearIds
) {}