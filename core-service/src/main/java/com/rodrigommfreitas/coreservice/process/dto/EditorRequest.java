package com.rodrigommfreitas.coreservice.process.dto;

import jakarta.validation.constraints.NotNull;

public record EditorRequest(
        @NotNull Long userId
) {}
