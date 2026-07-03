package com.rodrigommfreitas.coreservice.macroprocess.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateMacroProcessRequest(
        @NotBlank String name,
        Long yearId
) {}