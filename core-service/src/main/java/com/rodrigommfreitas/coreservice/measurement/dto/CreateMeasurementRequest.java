package com.rodrigommfreitas.coreservice.measurement.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateMeasurementRequest(
        @NotNull LocalDate measurementDate,
        @NotNull BigDecimal value,
        String notes
) {}
