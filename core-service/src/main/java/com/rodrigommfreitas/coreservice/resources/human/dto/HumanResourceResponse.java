package com.rodrigommfreitas.coreservice.resources.human.dto;

import com.rodrigommfreitas.coreservice.year.dto.YearOption;

import java.util.List;

public record HumanResourceResponse(
        Long id,
        String name,
        String function,
        String department,

        List<CompetencyResponse> competencies,

        // current year context
        Long yearId,
        Integer year,
        boolean isActive,

        // all associated years
        List<YearOption> years,

        // HumanResourceYear id (for creating competencies etc.)
        Long hryId

) {}