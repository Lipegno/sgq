package com.rodrigommfreitas.coreservice.measurement.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MeasurementResponse(
        Long id,
        LocalDate measurementDate,
        BigDecimal value,
        String notes,
        Long indicatorYearId
) {}
