package com.rodrigommfreitas.coreservice.communication.dto;

import com.rodrigommfreitas.coreservice.communication.CommunicationType;

import java.util.Set;

public record CreateCommunicationItemRequest(
        String what,
        String who,
        String toWho,
        String when,
        String where,
        String how,
        CommunicationType type,
        Set<Long> yearIds
) {}