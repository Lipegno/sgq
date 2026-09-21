package com.rodrigommfreitas.coreservice.documentedinformation.dto;

public record UpdateDocumentedInformationRequest(
        String description,
        String url
) {}
