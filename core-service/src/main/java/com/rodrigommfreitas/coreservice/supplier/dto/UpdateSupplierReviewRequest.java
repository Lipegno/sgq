package com.rodrigommfreitas.coreservice.supplier.dto;

import java.time.LocalDate;

public record UpdateSupplierReviewRequest(
        Integer rating,
        String text,
        LocalDate reviewDate
) {}
