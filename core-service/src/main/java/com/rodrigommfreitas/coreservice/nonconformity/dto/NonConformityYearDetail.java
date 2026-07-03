package com.rodrigommfreitas.coreservice.nonconformity.dto;

import com.rodrigommfreitas.coreservice.nonconformity.NonConformityStatus;

public record NonConformityYearDetail(
        Long nonConformityYearId,
        Long yearId,
        Integer year,
        NonConformityStatus status,
        String evaluation,
        String evaluationDescription
) {}