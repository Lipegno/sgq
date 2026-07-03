package com.rodrigommfreitas.coreservice.process.dto;

import java.util.List;

public record DisassociateProcessRequest(
        List<Long> processYearIds
) {
}
