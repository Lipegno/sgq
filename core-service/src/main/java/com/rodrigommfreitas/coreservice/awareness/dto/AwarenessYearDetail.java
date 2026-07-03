package com.rodrigommfreitas.coreservice.awareness.dto;

import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;

import java.util.List;

public record AwarenessYearDetail(
        Long awarenessYearId,
        Long yearId,
        Integer year,
        List<DocumentWithVersionsResponse> documents
) {}