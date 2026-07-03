package com.rodrigommfreitas.coreservice.audit.dto;

public record DocumentSummary(
        Long id,
        String fileName,
        String fileType,
        String fileUrl,
        String uploadedByFullName,
        String uploadedAt
) {}