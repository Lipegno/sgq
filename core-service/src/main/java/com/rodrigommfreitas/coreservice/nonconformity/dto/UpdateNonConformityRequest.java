package com.rodrigommfreitas.coreservice.nonconformity.dto;

import com.rodrigommfreitas.coreservice.nonconformity.NonConformityOrigin;

import java.time.LocalDate;

public record UpdateNonConformityRequest(
        String name,
        String description,
        String cause,
        Long responsibleId,
        Long departmentId,
        NonConformityOrigin origin,
        //novos campos
        // NOVOS CAMPOS
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