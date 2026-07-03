package com.rodrigommfreitas.coreservice.nonconformity.dto;

public record CreateCorrectiveActionRequest(
        String name,
        String description,
        Long responsibleId
) {}