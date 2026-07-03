package com.rodrigommfreitas.coreservice.improvementopportunity.dto;

import com.rodrigommfreitas.coreservice.improvementopportunity.ImprovementOpportunityOrigin;

import java.time.LocalDate;

public record UpdateImprovementOpportunityRequest(
        String name,
        String description,
        String cause,
        Long responsibleId,
        Long departmentId,
        ImprovementOpportunityOrigin origin,

        String whatWillBeDone,
        String why,
        String who,
        String where,
        LocalDate startDate,
        LocalDate expectedEndDate,
        String how,
        String howMuch,

        // --- EFICÁCIA (CAMPOS NOVOS) ---
        String effectivenessVerification,
        LocalDate verificationDate,
        String verificationResponsible
) {}