package com.rodrigommfreitas.coreservice.indicator.dto;

import java.util.List;

public record DisassociateIndicatorsRequest(
        Long processYearId,
        List<Long> indicatorYearIds
) {}