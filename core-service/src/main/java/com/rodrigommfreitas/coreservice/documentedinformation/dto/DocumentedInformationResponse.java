package com.rodrigommfreitas.coreservice.documentedinformation.dto;

public record DocumentedInformationResponse(
        Long id,
        String description,
        String url
) {}
