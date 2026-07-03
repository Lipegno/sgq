package com.rodrigommfreitas.coreservice.process.dto;

import jakarta.validation.constraints.NotNull;

public record DocumentIdRequest(
        @NotNull Long documentId
) {}