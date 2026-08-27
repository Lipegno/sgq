package com.rodrigommfreitas.coreservice.process.dto;

public record ProcessResponsibleResponse(
        Long humanResourceYearId,
        Long humanResourceId,
        String name,
        String function,
        String department
) {}