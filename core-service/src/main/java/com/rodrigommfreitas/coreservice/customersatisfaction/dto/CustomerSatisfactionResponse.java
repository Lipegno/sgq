package com.rodrigommfreitas.coreservice.customersatisfaction.dto;

import java.util.List;

public record CustomerSatisfactionResponse(
        Long id,
        String description,
        List<CustomerSatisfactionYearDetail> years
) {}
