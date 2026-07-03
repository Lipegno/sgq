package com.rodrigommfreitas.coreservice.swot.dto;

import java.util.Set;

public record UpdateItemYearsRequest(
        Set<Long> associateYearIds,
        Set<Long> disassociateYearIds
) {}