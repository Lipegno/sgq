package com.rodrigommfreitas.coreservice.process.dto;

import com.rodrigommfreitas.coreservice.department.dto.DepartmentResponse;
import com.rodrigommfreitas.coreservice.user.dto.UserSummary;

import java.util.List;

public record ProcessResponse(
        Long id,
        String name,
        String objective,
        List<DocumentSummary> entradasDocumentos,
        List<DocumentSummary> saidasDocumentos,
        DocumentSummary fichaDocumento,
        List<DocumentSummary> documents,
        List<UserSummary> responsibles,
        List<DepartmentResponse> departments,
        Long macroProcessYearId
) {}
