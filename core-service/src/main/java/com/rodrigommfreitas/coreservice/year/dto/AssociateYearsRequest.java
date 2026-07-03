package com.rodrigommfreitas.coreservice.year.dto;

import java.util.List;

public record AssociateYearsRequest(
        List<Long> yearIds
) { }
