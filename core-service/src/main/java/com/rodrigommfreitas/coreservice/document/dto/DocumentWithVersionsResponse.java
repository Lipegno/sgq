package com.rodrigommfreitas.coreservice.document.dto;

import java.util.List;

public record DocumentWithVersionsResponse(
        Long documentId,
        List<DocumentVersionResponse> versions
) {}