package com.rodrigommfreitas.coreservice.macroprocess.dto;

import com.rodrigommfreitas.coreservice.process.dto.ProcessHierarchyResponse;

import java.util.List;
import java.util.Set;
public record HierarchyResponse(

        List<MacroProcessHierarchyResponse> macroProcesses,
        List<ProcessHierarchyResponse> standaloneProcesses
) {}