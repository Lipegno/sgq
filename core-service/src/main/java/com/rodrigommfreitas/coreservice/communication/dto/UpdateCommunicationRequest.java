package com.rodrigommfreitas.coreservice.communication.dto;

public record UpdateCommunicationRequest(
        String objective,
        String scope,
        String plan
) {}