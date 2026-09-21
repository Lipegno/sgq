package com.rodrigommfreitas.coreservice.supplier.dto;

import java.time.LocalDate;

public record CreateSupplierReviewRequest(
        Integer year,
        Integer semester,
        LocalDate reviewDate,
        LocalDate criteriaSentDate,
        Integer conformityScore,
        Integer deadlineScore,
        Integer qualityScore,
        Integer documentationScore,
        String classification,
        String measures,
        String justification,
        String text
) implements SupplierReviewData {}
