package com.rodrigommfreitas.coreservice.audit;

import com.rodrigommfreitas.coreservice.audit.dto.*;
import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentResponse;
import com.rodrigommfreitas.coreservice.document.dto.UploadDocumentRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/audits")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService service;
    private final DocumentService documentService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AuditResponse create(@RequestBody CreateAuditRequest request) {
        return service.create(request);
    }

    @PatchMapping("/{id}")
    public AuditResponse update(@PathVariable Long id, @RequestBody UpdateAuditRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @GetMapping("/year/{yearId}")
    public List<AuditResponse> getByYear(@PathVariable Long yearId) {
        return service.getByYear(yearId);
    }

    @PostMapping("/{id}/documents")
    @ResponseStatus(HttpStatus.CREATED)
    public AuditResponse uploadDocument(
            @PathVariable Long id,
            @RequestPart("data") UploadDocumentRequest request,
            @RequestPart("file") MultipartFile file
    ) {
        DocumentResponse doc = documentService.upload(request, file);
        return service.attachDocument(id, doc.id());
    }

    @DeleteMapping("/{id}/documents/{documentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeDocument(@PathVariable Long id, @PathVariable Long documentId) {
        service.removeDocument(id, documentId);
    }
}