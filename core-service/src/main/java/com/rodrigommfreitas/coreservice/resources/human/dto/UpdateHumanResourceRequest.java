package com.rodrigommfreitas.coreservice.resources.human.dto;


import java.util.List;

public record UpdateHumanResourceRequest(
        String name,
        String function,
        String department,
        List<String> competencies,
        Long yearId,
        boolean isActive
) {}