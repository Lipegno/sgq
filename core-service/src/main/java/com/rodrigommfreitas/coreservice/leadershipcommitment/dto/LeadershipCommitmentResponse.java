package com.rodrigommfreitas.coreservice.leadershipcommitment.dto;

import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;

import java.util.List;

public record LeadershipCommitmentResponse(
        Long id,
        String description,
        List<LeadershipCommitmentYearDetail> years
) {}