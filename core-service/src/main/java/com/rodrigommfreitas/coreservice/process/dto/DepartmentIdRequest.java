package com.rodrigommfreitas.coreservice.process.dto;

import jakarta.validation.constraints.NotNull;

public record DepartmentIdRequest(
        @NotNull Long departmentId
) {}
