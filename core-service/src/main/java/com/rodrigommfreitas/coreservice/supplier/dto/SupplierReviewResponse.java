package com.rodrigommfreitas.coreservice.supplier.dto;

import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;

import java.time.LocalDate;
import java.util.List;

public record SupplierReviewResponse(
        Long id,
        Integer year,
        Integer semester,
        LocalDate reviewDate,
        LocalDate criteriaSentDate,
        Integer conformityScore,
        Integer deadlineScore,
        Integer qualityScore,
        Integer documentationScore,
        Integer totalScore,
        String classification,
        String measures,
        String justification,
        String text,
        List<DocumentWithVersionsResponse> documents
) {}
