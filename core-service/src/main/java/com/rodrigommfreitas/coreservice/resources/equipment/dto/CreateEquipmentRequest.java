package com.rodrigommfreitas.coreservice.resources.equipment.dto;

import java.util.Set;

public record CreateEquipmentRequest(
        String name,
        String type,
        String location,
        Long responsibleId,
        boolean isActive,
        Set<Long> yearIds
) {}