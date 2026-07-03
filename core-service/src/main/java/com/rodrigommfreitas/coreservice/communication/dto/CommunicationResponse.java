package com.rodrigommfreitas.coreservice.communication.dto;

import java.util.List;

public record CommunicationResponse(
        Long id,
        String objective,
        String scope,
        String plan,
        List<CommunicationItemResponse> internalItems,
        List<CommunicationItemResponse> externalItems
) {}
