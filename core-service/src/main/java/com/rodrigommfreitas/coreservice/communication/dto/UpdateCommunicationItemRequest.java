package com.rodrigommfreitas.coreservice.communication.dto;

public record UpdateCommunicationItemRequest(
        String what,
        String who,
        String toWho,
        String when,
        String where,
        String how,
        String type
) {}