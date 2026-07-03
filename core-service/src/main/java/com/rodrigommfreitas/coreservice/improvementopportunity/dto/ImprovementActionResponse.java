package com.rodrigommfreitas.coreservice.improvementopportunity.dto;

import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;
import com.rodrigommfreitas.coreservice.improvementopportunity.ImprovementActionStatus;
import com.rodrigommfreitas.coreservice.user.dto.UserSummary;

import java.util.List;

public record ImprovementActionResponse(
        Long id,
        String name,
        String description,
        UserSummary responsible,
        ImprovementActionStatus status,
        String progressDescription,
        List<DocumentWithVersionsResponse> documents
) {}