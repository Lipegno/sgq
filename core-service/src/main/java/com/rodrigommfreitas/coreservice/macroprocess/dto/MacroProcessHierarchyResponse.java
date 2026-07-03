package com.rodrigommfreitas.coreservice.macroprocess.dto;

import com.rodrigommfreitas.coreservice.process.dto.ProcessHierarchyResponse;
import com.rodrigommfreitas.coreservice.year.dto.YearOption;

import java.util.List;
import java.util.Set;

public record MacroProcessHierarchyResponse(
        Long macroProcessYearId,
        Long macroProcessId,
        String name,
        List<ProcessHierarchyResponse> processes,
        Set<YearOption> years
) {}