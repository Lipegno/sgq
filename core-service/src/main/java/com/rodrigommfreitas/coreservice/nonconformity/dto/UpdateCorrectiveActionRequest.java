package com.rodrigommfreitas.coreservice.nonconformity.dto;

import com.rodrigommfreitas.coreservice.nonconformity.CorrectiveActionStatus;

public record UpdateCorrectiveActionRequest(
        String name,
        String description,
        Long responsibleId,
        CorrectiveActionStatus status,
        String progressDescription
) {}