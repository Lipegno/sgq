package com.rodrigommfreitas.coreservice.supplier.dto;

public record UpdateSupplierRequest(
        String name,
        String description,
        String contactInfo
) {}
