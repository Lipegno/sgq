package com.rodrigommfreitas.coreservice.macroprocess.dto;


public record CreateMacroProcessResponse(
        Long id,
        String name,
        Long yearId
) {}