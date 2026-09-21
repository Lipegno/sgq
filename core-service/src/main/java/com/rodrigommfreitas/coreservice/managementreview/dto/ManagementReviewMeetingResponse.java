package com.rodrigommfreitas.coreservice.managementreview.dto;

import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;

import java.time.LocalDate;
import java.util.List;

public record ManagementReviewMeetingResponse(
        Long id,
        Long yearId,
        Integer year,
        LocalDate meetingDate,
        String participants,
        String notes,
        String decisions,
        String improvementOutputs,
        String changeNeeds,
        String resourceNeeds,
        List<DocumentWithVersionsResponse> documents
) {}
