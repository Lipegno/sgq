package com.rodrigommfreitas.coreservice.indicator.dto;

import java.util.List;

public record AssociateProcessesRequest(
        Long indicatorYearId,
        List<Long> processYearIds
) {
}
