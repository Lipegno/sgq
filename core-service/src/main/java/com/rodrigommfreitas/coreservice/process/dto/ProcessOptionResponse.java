package com.rodrigommfreitas.coreservice.process.dto;

public record ProcessOptionResponse(
        Long processYearId,
        Long processId,
        String processName,
        String macroProcessName
) {}
