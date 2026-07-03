package com.rodrigommfreitas.coreservice.department.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateDepartmentRequest(
        @NotBlank String name
) {}
