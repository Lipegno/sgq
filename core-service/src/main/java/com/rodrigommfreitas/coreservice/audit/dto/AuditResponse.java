package com.rodrigommfreitas.coreservice.audit.dto;

import com.rodrigommfreitas.coreservice.audit.AuditStatus;
import com.rodrigommfreitas.coreservice.audit.AuditType;
import com.rodrigommfreitas.coreservice.department.dto.DepartmentResponse;
import com.rodrigommfreitas.coreservice.user.dto.UserSummary;

import java.time.LocalDate;
import java.util.List;

public record AuditResponse(
        Long id,
        String name,
        AuditType type,
        String team,
        String notes,
        UserSummary responsible,
        DepartmentResponse department,
        Long yearId,
        Integer year,
        AuditStatus status,
        LocalDate plannedDate,
        List<DocumentSummary> documents
) {}