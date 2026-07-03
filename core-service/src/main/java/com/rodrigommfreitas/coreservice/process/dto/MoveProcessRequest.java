package com.rodrigommfreitas.coreservice.process.dto;

public record MoveProcessRequest(
        Long processYearId,
        Long targetMacroProcessYearId // can be null if moving to standalone
) {}