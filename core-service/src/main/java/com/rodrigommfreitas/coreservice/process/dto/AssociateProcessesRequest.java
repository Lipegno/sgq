package com.rodrigommfreitas.coreservice.process.dto;

import java.util.List;

public record AssociateProcessesRequest(
        List<Long> processIds,
        Long macroProcessYearId,
        Long yearId
) {
}
