package com.rodrigommfreitas.coreservice.resources.equipment.dto;

import java.time.LocalDate;

public record CreateMaintenanceRecordRequest(
        LocalDate date,
        LocalDate nextDueDate,
        String type,
        String performedBy,
        String description
) {}