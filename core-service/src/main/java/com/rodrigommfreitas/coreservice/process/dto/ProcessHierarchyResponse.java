package com.rodrigommfreitas.coreservice.process.dto;

import com.rodrigommfreitas.coreservice.department.dto.DepartmentResponse;
import com.rodrigommfreitas.coreservice.indicator.dto.IndicatorHierarchyResponse;
import com.rodrigommfreitas.coreservice.user.dto.UserSummary;
import com.rodrigommfreitas.coreservice.year.dto.YearOption;

import java.util.List;
import java.util.Set;

public record ProcessHierarchyResponse(
        Long processYearId,
        Long processId,
        String name,
        String objective,
        String entradas,
        String atividades,
        String saidas,
        List<DocumentSummary> entradasDocumentos,
        List<DocumentSummary> saidasDocumentos,
        DocumentSummary fichaDocumento,
        List<DocumentSummary> documents,
        List<UserSummary> editors,
        List<ProcessResponsibleResponse> formalResponsibles,
        List<DepartmentResponse> departments,
        Set<IndicatorHierarchyResponse> indicators,
        Set<YearOption> years,
        List<QualityObjectiveInfo> qualityObjectives
) {}
