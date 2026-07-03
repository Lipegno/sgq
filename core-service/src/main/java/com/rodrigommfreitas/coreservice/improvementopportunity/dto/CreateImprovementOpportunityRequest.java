package com.rodrigommfreitas.coreservice.improvementopportunity.dto;

import com.rodrigommfreitas.coreservice.improvementopportunity.ImprovementOpportunityOrigin;

import java.time.LocalDate;
import java.util.Set;

public record CreateImprovementOpportunityRequest(
        String name,
        String description,
        String cause,
        Long responsibleId,
        Long departmentId,
        ImprovementOpportunityOrigin origin,
        Set<Long> yearIds,

        String whatWillBeDone,
        String why,
        String who,
        String where,
        LocalDate startDate,
        LocalDate expectedEndDate,
        String how,
        String howMuch
) {}