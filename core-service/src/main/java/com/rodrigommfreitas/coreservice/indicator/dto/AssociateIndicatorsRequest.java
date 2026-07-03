package com.rodrigommfreitas.coreservice.indicator.dto;

import java.util.List;

public record AssociateIndicatorsRequest(
        Long processYearId,
        List<Long> indicatorYearIds
) {}