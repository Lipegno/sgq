package com.rodrigommfreitas.coreservice.log.dto;

import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.user.dto.UserSummary;

import java.time.LocalDateTime;

public record LogResponse(
        Long id,
        UserSummary user,
        LocalDateTime timestamp,
        EntityType entityType,
        Long baseEntityId,
        Long entityYearId,
        Long yearId,
        String entityName,
        ActionType action,
        Object details
) {}