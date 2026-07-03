package com.rodrigommfreitas.coreservice.interestedparty.dto;

import com.rodrigommfreitas.coreservice.interestedparty.InterestedPartyType;
import com.rodrigommfreitas.coreservice.process.dto.ProcessOptionResponse;

import java.util.List;

public record AssociateProcessesRequest(
        List<Long> processesIds
) {}