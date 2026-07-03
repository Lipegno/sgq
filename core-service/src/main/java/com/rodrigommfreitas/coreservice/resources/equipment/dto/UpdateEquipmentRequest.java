package com.rodrigommfreitas.coreservice.resources.equipment.dto;

public record UpdateEquipmentRequest(
        String name,
        String type,
        String location,
        Long responsibleId,
        Long yearId,
        boolean isActive
) {}