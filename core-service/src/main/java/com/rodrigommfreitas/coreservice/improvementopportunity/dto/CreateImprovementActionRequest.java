package com.rodrigommfreitas.coreservice.improvementopportunity.dto;

public record CreateImprovementActionRequest(
        String name,
        String description,
        Long responsibleId
) {}