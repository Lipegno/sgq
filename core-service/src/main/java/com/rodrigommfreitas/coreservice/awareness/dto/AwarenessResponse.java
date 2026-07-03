package com.rodrigommfreitas.coreservice.awareness.dto;

import java.util.List;

public record AwarenessResponse(
        Long id,
        String description,
        List<AwarenessYearDetail> years
) {}