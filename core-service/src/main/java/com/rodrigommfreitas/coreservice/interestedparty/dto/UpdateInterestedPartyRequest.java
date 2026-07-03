package com.rodrigommfreitas.coreservice.interestedparty.dto;

import com.rodrigommfreitas.coreservice.interestedparty.InterestedPartyType;

public record UpdateInterestedPartyRequest(
        // Base entity fields
        String name,
        InterestedPartyType type,
        String category,
        String contactInfo,

        // Year entity fields
        String needs,
        String communicationAndMonitoringPlan
) {
}
