package com.rodrigommfreitas.coreservice.supplier.dto;

public record CreateSupplierRequest(
        String name,
        String description,
        String contactInfo
) {}
