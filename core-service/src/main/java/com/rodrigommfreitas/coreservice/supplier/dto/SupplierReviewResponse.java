package com.rodrigommfreitas.coreservice.supplier.dto;

import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;

import java.time.LocalDate;
import java.util.List;

public record SupplierReviewResponse(
        Long id,
        Integer rating,
        String text,
        LocalDate reviewDate,
        List<DocumentWithVersionsResponse> documents
) {}
