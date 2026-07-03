package com.rodrigommfreitas.coreservice.process.dto;

import java.util.Set;

public record UpdateProcessYearsRequest(
        Set<Long> associateYearIds,
        Set<Long> disassociateYearIds
) {}
