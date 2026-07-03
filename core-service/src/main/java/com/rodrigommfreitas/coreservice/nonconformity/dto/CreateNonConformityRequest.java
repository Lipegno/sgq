package com.rodrigommfreitas.coreservice.nonconformity.dto;

import com.rodrigommfreitas.coreservice.nonconformity.NonConformityOrigin;

import java.time.LocalDate;
import java.util.Set;

public record CreateNonConformityRequest(
        String name,
        String description,
        String cause,
        Long responsibleId,
        Long departmentId,
        NonConformityOrigin origin,
        Set<Long> yearIds,
        //novos campos
        String whatWillBeDone,
        String why,
        String who,
        String where,
        LocalDate startDate,
        LocalDate expectedEndDate,
        String how,
        String howMuch,
        String effectivenessVerification,
        LocalDate verificationDate,
        String verificationResponsible
) {}