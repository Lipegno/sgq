package com.rodrigommfreitas.coreservice.resources.equipment.dto;

import java.time.LocalDate;

public record MaintenanceRecordResponse(
        Long id,
        LocalDate date,
        LocalDate nextDueDate,
        String type,
        String performedBy,
        String description
) {}