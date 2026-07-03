package com.rodrigommfreitas.coreservice.change.dto;

import com.rodrigommfreitas.coreservice.change.ChangeStatus;
import com.rodrigommfreitas.coreservice.user.dto.UserSummary;

import java.time.LocalDateTime;

public record ChangeResponse(
        Long id,
        String description,
        String origin,
        String whatWillBeDone,
        String why,
        UserSummary createdBy,
        String startDate,
        Integer timeLimitInDays,
        String expectedEndDate,
        String realEndDate,
        String where,
        String how,
        String howMuch,
        ChangeStatus status,
        String notes,
        LocalDateTime createdAt
) {}