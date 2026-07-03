package com.rodrigommfreitas.coreservice.department.dto;

public record DepartmentResponse(
        Long id,
        String name,
        int userCount
) {}
