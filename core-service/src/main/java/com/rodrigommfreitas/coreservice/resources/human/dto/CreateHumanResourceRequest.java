package com.rodrigommfreitas.coreservice.resources.human.dto;

import java.util.List;
import java.util.Set;

public record CreateHumanResourceRequest(
        String name,
        String function,
        String department,
        Set<Long> yearIds
) {}