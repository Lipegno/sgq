package com.rodrigommfreitas.coreservice.process.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateProcessRequest(
        @NotBlank String name,
        String objective,
        Long fichaDocumentoId,
        List<Long> departmentIds,
        @NotNull Long yearId,
        Long macroProcessYearId
) {}
