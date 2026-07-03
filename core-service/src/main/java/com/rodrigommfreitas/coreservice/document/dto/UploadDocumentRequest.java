package com.rodrigommfreitas.coreservice.document.dto;

public record UploadDocumentRequest(
        Long documentId,          // null if creating new document
        Boolean versioned,
        double version,
        Boolean requiresApproval, // optional override
        Long uploadedById
) {

}
