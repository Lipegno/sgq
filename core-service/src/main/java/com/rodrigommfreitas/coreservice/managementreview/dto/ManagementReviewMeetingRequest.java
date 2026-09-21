package com.rodrigommfreitas.coreservice.managementreview.dto;

import java.time.LocalDate;

/** Tudo opcional; no PATCH os campos são substituídos por inteiro (null limpa o campo). */
public record ManagementReviewMeetingRequest(
        Long yearId,
        LocalDate meetingDate,
        String participants,
        String notes,
        String decisions,
        String improvementOutputs,
        String changeNeeds,
        String resourceNeeds
) {}
