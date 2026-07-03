package com.rodrigommfreitas.coreservice.resources.infrastructure.dto;

import com.rodrigommfreitas.coreservice.user.dto.UserSummary;
import com.rodrigommfreitas.coreservice.year.dto.YearOption;

import java.util.List;

public record InfrastructureResponse(
        Long id,
        String name,
        String type,
        String location,
        UserSummary responsible,
        String maintenance,

        Long yearId,
        Integer year,
        boolean isActive,
        List<YearOption> years
) {}