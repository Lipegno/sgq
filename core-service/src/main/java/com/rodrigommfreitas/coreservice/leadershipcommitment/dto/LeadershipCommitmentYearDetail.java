package com.rodrigommfreitas.coreservice.leadershipcommitment.dto;

import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;

import java.util.List;

public record LeadershipCommitmentYearDetail(
        Long leadershipCommitmentYearId,
        Long yearId,
        Integer year,
        List<DocumentWithVersionsResponse> documents
) {}