package com.rodrigommfreitas.coreservice.change.dto;

import com.rodrigommfreitas.coreservice.change.ChangeStatus;

public record ChangeRequest(
        String description,
        String origin,
        String whatWillBeDone,
        String why,
        Long createdById,
        String startDate,
        Integer timeLimitInDays,
        String expectedEndDate,
        String realEndDate,
        String where,
        String how,
        String howMuch,
        ChangeStatus status,
        String notes
) {}