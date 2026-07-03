package com.rodrigommfreitas.coreservice.nonconformity.dto;

import com.rodrigommfreitas.coreservice.nonconformity.NonConformityStatus;

public record UpdateNonConformityYearRequest(
        NonConformityStatus status,
        String evaluation,
        String evaluationDescription
) {}