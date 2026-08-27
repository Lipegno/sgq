package com.rodrigommfreitas.coreservice.process.dto;

public record UpdateProcessRequest(
        String name,
        String objective,
        Long fichaDocumentoId,
        String entradas,
        String atividades,
        String saidas
) {}
