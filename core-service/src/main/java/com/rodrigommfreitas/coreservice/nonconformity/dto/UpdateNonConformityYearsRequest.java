package com.rodrigommfreitas.coreservice.nonconformity.dto;

import java.util.Set;

public record UpdateNonConformityYearsRequest(
        Set<Long> associateYearIds,
        Set<Long> disassociateYearIds
) {}