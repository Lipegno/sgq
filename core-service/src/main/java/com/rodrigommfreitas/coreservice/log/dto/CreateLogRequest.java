package com.rodrigommfreitas.coreservice.log.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;

public record CreateLogRequest(
        Long userId,
        EntityType entityType,
        Long baseEntityId,
        Long entityYearId,
        Long yearId,
        String entityName,
        ActionType action,
        JsonNode details
) {}
