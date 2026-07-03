package com.rodrigommfreitas.coreservice.nonconformity.dto;

import com.rodrigommfreitas.coreservice.nonconformity.NonConformityOrigin;

import java.util.Set;

public record CreateNonConformityRequest(
        String name,
        String description,
        String cause,
        Long responsibleId,
        Long departmentId,
        NonConformityOrigin origin,
        Set<Long> yearIds
) {}