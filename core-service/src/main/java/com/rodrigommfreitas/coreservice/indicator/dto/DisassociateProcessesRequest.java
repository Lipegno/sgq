package com.rodrigommfreitas.coreservice.indicator.dto;

import java.util.List;

public record DisassociateProcessesRequest(
        Long indicatorYearId,
        List<Long> processYearIds
) {
}
