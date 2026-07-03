package com.rodrigommfreitas.coreservice.improvementopportunity.dto;

import com.rodrigommfreitas.coreservice.improvementopportunity.ImprovementActionStatus;

public record UpdateImprovementActionRequest(
        String name,
        String description,
        Long responsibleId,
        ImprovementActionStatus status,
        String progressDescription
) {}