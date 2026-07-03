package com.rodrigommfreitas.coreservice.process.dto;

public record DocumentSummary(
    Long id,
    String fileName,
    String fileType,
    String fileUrl,
    String uploadedByFullName,
    String uploadedAt
) {}