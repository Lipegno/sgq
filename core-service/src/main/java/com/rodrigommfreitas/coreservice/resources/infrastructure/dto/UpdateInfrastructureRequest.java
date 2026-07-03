package com.rodrigommfreitas.coreservice.resources.infrastructure.dto;

public record UpdateInfrastructureRequest(
        String name,
        String type,
        String location,
        Long responsibleId,
        String maintenance,
        Long yearId,
        boolean isActive
) {}