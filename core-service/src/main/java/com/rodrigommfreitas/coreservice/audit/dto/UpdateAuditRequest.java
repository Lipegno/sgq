package com.rodrigommfreitas.coreservice.audit.dto;

import com.rodrigommfreitas.coreservice.audit.AuditStatus;
import com.rodrigommfreitas.coreservice.audit.AuditType;

public record UpdateAuditRequest(
        String name,
        AuditType type,
        String team,
        String notes,
        Long responsibleId,
        Long departmentId,
        AuditStatus status,
        String plannedDate
) {}