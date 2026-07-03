package com.rodrigommfreitas.coreservice.awareness.dto;

import java.util.Set;

public record UpdateDocumentYearsRequest(
        Set<Long> associateYearIds,
        Set<Long> disassociateYearIds
) {}