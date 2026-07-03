package com.rodrigommfreitas.coreservice.qualityobjective.dto;

import com.rodrigommfreitas.coreservice.qualityobjective.QualityObjectiveStatus;

import java.util.Set;

public record AssociateYearsRequest(
        Set<Long> yearIds,
        boolean copyProcessesAndIndicators
) {}