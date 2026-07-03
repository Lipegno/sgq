package com.rodrigommfreitas.coreservice.nonconformity.dto;

import com.rodrigommfreitas.coreservice.nonconformity.NonConformityOrigin;

public record UpdateNonConformityRequest(
        String name,
        String description,
        String cause,
        Long responsibleId,
        Long departmentId,
        NonConformityOrigin origin
) {}