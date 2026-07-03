package com.rodrigommfreitas.coreservice.interestedparty.dto;

import com.rodrigommfreitas.coreservice.interestedparty.InterestedPartyType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateInterestedPartyRequest(
        @NotBlank String name,
        @NotNull InterestedPartyType type,
        String category,
        String contactInfo,

        @NotNull Long yearId,
        String needs,
        String communicationAndMonitoringPlan,
        List<Long> processYearIds
        ) {

}
