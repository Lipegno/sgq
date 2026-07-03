package com.rodrigommfreitas.coreservice.document.dto;

import com.rodrigommfreitas.coreservice.document.DocumentStatus;
import com.rodrigommfreitas.coreservice.user.dto.UserSummary;

import java.time.LocalDateTime;

public record DocumentVersionResponse(
        Long versionId,
        double version,
        String fileName,
        String fileType,
        UserSummary uploadedBy,
        DocumentStatus status,
        LocalDateTime uploadedAt,
        LocalDateTime obsoleteAt,
        String downloadUrl
) {}