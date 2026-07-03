package com.rodrigommfreitas.coreservice.awareness;

import com.rodrigommfreitas.coreservice.awareness.dto.AwarenessResponse;
import com.rodrigommfreitas.coreservice.awareness.dto.AwarenessYearDetail;
import com.rodrigommfreitas.coreservice.awareness.dto.UpdateAwarenessRequest;
import com.rodrigommfreitas.coreservice.awareness.dto.UpdateDocumentYearsRequest;
import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentResponse;
import com.rodrigommfreitas.coreservice.document.dto.UploadDocumentRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/awareness")
@RequiredArgsConstructor
public class AwarenessController {

    private final AwarenessService service;
    private final DocumentService documentService;

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public AwarenessResponse get() {
        return service.get();
    }

    @PatchMapping
    @ResponseStatus(HttpStatus.OK)
    public AwarenessResponse update(@RequestBody UpdateAwarenessRequest request) {
        return service.update(request);
    }

    @GetMapping("/year/{yearId}")
    @ResponseStatus(HttpStatus.OK)
    public AwarenessYearDetail getByYear(@PathVariable Long yearId) {
        return service.getByYear(yearId);
    }

    @PostMapping("/years/{yearId}/documents")
    @ResponseStatus(HttpStatus.CREATED)
    public AwarenessYearDetail uploadDocument(
            @PathVariable Long yearId,
            @RequestPart("data") UploadDocumentRequest request,
            @RequestPart("file") MultipartFile file
    ) {
        DocumentResponse doc = documentService.upload(request, file);
        return service.attachDocument(yearId, doc.id());
    }

    @DeleteMapping("/documents/{documentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDocument(@PathVariable Long documentId) {
        service.deleteDocument(documentId);
    }

    @PatchMapping("/documents/{documentId}/years")
    @ResponseStatus(HttpStatus.OK)
    public AwarenessYearDetail updateDocumentYears(
            @PathVariable Long documentId,
            @RequestBody UpdateDocumentYearsRequest request
    ) {
        return service.updateDocumentYears(documentId, request);
    }
}