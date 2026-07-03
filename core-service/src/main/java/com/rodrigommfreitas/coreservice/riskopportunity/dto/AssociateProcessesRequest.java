package com.rodrigommfreitas.coreservice.riskopportunity.dto;

import jakarta.validation.constraints.NotNull;

import java.util.Set;

public record AssociateProcessesRequest(
        @NotNull
        Set<Long> processIds
) {
}
