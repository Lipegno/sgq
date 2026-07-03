package com.rodrigommfreitas.coreservice.resources.equipment.dto;

import java.time.LocalDate;

public record CalibrationRecordResponse(
        Long id,
        LocalDate date,
        String performedBy,
        String result,
        String description
) {}