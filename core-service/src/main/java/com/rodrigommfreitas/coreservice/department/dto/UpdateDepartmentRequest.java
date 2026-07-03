package com.rodrigommfreitas.coreservice.department.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateDepartmentRequest(
        @NotBlank String name
) {}
