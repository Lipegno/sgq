package com.rodrigommfreitas.coreservice.interestedparty.dto;

import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;
import com.rodrigommfreitas.coreservice.interestedparty.InterestedPartyType;
import com.rodrigommfreitas.coreservice.process.dto.ProcessOptionResponse;
import com.rodrigommfreitas.coreservice.year.Year;

import java.util.List;

public record InterestedPartyResponse(
        Long id,
        Long interestedPartyYearId,
        String name,
        InterestedPartyType type,
        String category,
        String contactInfo,

        Long yearId,
        Integer year,
        String needs,
        String communicationAndMonitoringPlan,
        List<ProcessOptionResponse> processes,
        List<DocumentWithVersionsResponse> evidences
) {}