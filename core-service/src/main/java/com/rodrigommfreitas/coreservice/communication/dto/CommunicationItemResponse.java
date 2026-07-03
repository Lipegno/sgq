package com.rodrigommfreitas.coreservice.communication.dto;

import com.rodrigommfreitas.coreservice.communication.CommunicationType;
import com.rodrigommfreitas.coreservice.year.dto.YearOption;

import java.util.List;

public record CommunicationItemResponse(
        Long id,
        String what,
        String who,
        String toWho,
        String when,
        String where,
        String how,
        CommunicationType type,
        List<YearOption> years
) {}