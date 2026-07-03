package com.rodrigommfreitas.coreservice.improvementopportunity.dto;

import com.rodrigommfreitas.coreservice.department.dto.DepartmentResponse;
import com.rodrigommfreitas.coreservice.improvementopportunity.ImprovementOpportunityOrigin;
import com.rodrigommfreitas.coreservice.user.dto.UserSummary;

import java.time.LocalDate;
import java.util.List;

public record ImprovementOpportunityResponse(
        Long id,
        String name,
        String description,
        String cause,
        UserSummary responsible,
        DepartmentResponse department,
        ImprovementOpportunityOrigin origin,
        List<ImprovementOpportunityYearDetail> years,
        List<ImprovementActionResponse> improvementActions,

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