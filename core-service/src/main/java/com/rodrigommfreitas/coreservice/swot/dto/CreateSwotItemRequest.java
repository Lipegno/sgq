package com.rodrigommfreitas.coreservice.swot.dto;

import com.rodrigommfreitas.coreservice.swot.SwotItemType;

import java.util.Set;

public record CreateSwotItemRequest(
        String text,
        SwotItemType type,
        Set<Long> yearIds
) {}