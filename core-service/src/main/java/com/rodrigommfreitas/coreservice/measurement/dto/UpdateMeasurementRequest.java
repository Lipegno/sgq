package com.rodrigommfreitas.coreservice.measurement.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Campos opcionais: o que vier nulo não é alterado. */
public record UpdateMeasurementRequest(
        BigDecimal value,
        LocalDate measurementDate,
        String notes
) {}
