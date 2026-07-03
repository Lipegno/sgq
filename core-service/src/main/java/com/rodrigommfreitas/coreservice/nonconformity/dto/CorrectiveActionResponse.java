package com.rodrigommfreitas.coreservice.nonconformity.dto;

import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;
import com.rodrigommfreitas.coreservice.nonconformity.CorrectiveActionStatus;
import com.rodrigommfreitas.coreservice.user.dto.UserSummary;

import java.util.List;

public record CorrectiveActionResponse(
        Long id,
        String name,
        String description,
        UserSummary responsible,
        CorrectiveActionStatus status,
        String progressDescription,
        List<DocumentWithVersionsResponse> documents
) {}