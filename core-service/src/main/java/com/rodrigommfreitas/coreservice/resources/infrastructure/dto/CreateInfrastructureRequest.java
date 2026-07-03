package com.rodrigommfreitas.coreservice.resources.infrastructure.dto;

import java.util.Set;

public record CreateInfrastructureRequest(
        String name,
        String type,
        String location,
        Long responsibleId,
        String maintenance,
        boolean isActive,
        Set<Long> yearIds
) {}