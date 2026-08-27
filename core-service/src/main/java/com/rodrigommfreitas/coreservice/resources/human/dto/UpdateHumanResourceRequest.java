package com.rodrigommfreitas.coreservice.resources.human.dto;


import java.util.List;

public record UpdateHumanResourceRequest(
        String name,
        String function,
        Long departmentId,
        List<String> competencies,
        Long yearId,
        boolean isActive
) {}