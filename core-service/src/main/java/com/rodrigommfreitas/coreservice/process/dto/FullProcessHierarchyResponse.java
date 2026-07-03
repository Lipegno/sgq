package com.rodrigommfreitas.coreservice.process.dto;

import com.rodrigommfreitas.coreservice.macroprocess.dto.MacroProcessHierarchyResponse;

import java.util.List;

public record FullProcessHierarchyResponse(
        List<MacroProcessHierarchyResponse> macroProcesses,
        List<ProcessHierarchyResponse> standaloneProcesses
) {}