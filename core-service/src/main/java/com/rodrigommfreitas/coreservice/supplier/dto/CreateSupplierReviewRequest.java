package com.rodrigommfreitas.coreservice.supplier.dto;

import java.time.LocalDate;

public record CreateSupplierReviewRequest(
        Integer rating,
        String text,
        LocalDate reviewDate
) {}
