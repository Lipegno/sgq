package com.rodrigommfreitas.coreservice.indicator.dto;

import java.util.List;

public record HumanResourceResponsibilitiesResponse(
        List<ProcessResponsibility> processes,
        List<IndicatorResponsibility> indicators
) {

    public record ProcessResponsibility(
            Long processYearId,
            Long processId,
            String name
    ) {}

    public record IndicatorResponsibility(
            Long indicatorYearId,
            Long indicatorId,
            String name
    ) {}
}