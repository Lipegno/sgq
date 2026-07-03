package com.rodrigommfreitas.coreservice.supplier.dto;

import java.time.LocalDateTime;
import java.util.List;

public record SupplierResponse(
        Long id,
        String name,
        String description,
        String contactInfo,
        LocalDateTime createdAt,
        List<SupplierReviewResponse> reviews
) {}
