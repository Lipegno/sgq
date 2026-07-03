package com.rodrigommfreitas.coreservice.nonconformity.dto;

import com.rodrigommfreitas.coreservice.department.dto.DepartmentResponse;
import com.rodrigommfreitas.coreservice.nonconformity.NonConformityOrigin;
import com.rodrigommfreitas.coreservice.user.dto.UserSummary;

import java.util.List;

public record NonConformityResponse(
        Long id,
        String name,
        String description,
        String cause,
        UserSummary responsible,
        DepartmentResponse department,
        NonConformityOrigin origin,
        List<NonConformityYearDetail> years,
        List<CorrectiveActionResponse> correctiveActions
) {}