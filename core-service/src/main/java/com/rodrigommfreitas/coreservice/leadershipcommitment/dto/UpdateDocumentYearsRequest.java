package com.rodrigommfreitas.coreservice.leadershipcommitment.dto;

import java.util.Set;

public record UpdateDocumentYearsRequest(
        Set<Long> associateYearIds,
        Set<Long> disassociateYearIds
) {}