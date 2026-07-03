package com.rodrigommfreitas.coreservice.macroprocess.dto;

public record MacroProcessOptionResponse(
        Long macroProcessYearId,
        Long macroProcessId,
        String name
) {}