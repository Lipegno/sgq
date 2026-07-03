package com.rodrigommfreitas.coreservice.process.dto;

public record UpdateProcessRequest(
        String name,
        String objective,
        Long fichaDocumentoId
) {}
