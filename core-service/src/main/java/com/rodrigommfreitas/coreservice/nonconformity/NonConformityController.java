package com.rodrigommfreitas.coreservice.nonconformity;

import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentResponse;
import com.rodrigommfreitas.coreservice.document.dto.UploadDocumentRequest;
import com.rodrigommfreitas.coreservice.nonconformity.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/non-conformities")
@RequiredArgsConstructor
public class NonConformityController {

    private final NonConformityService service;
    private final DocumentService documentService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public NonConformityResponse create(@RequestBody CreateNonConformityRequest request) {
        return service.create(request);
    }

    @PatchMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public NonConformityResponse update(
            @PathVariable Long id,
            @RequestBody UpdateNonConformityRequest request
    ) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @GetMapping("/year/{yearId}")
    @ResponseStatus(HttpStatus.OK)
    public List<NonConformityResponse> getByYear(@PathVariable Long yearId) {
        return service.getByYear(yearId);
    }

    // NonConformityYear

    @PatchMapping("/{id}/years/{yearId}")
    @ResponseStatus(HttpStatus.OK)
    public NonConformityYearDetail updateYear(
            @PathVariable Long id,
            @PathVariable Long yearId,
            @RequestBody UpdateNonConformityYearRequest request
    ) {
        return service.updateYear(id, yearId, request);
    }

    @PatchMapping("/{id}/years")
    @ResponseStatus(HttpStatus.OK)
    public NonConformityResponse updateYears(
            @PathVariable Long id,
            @RequestBody UpdateNonConformityYearsRequest request
    ) {
        return service.updateYears(id, request);
    }

    // Corrective Actions

    @PostMapping("/{id}/corrective-actions")
    @ResponseStatus(HttpStatus.CREATED)
    public CorrectiveActionResponse createCorrectiveAction(
            @PathVariable Long id,
            @RequestBody CreateCorrectiveActionRequest request
    ) {
        return service.createCorrectiveAction(id, request);
    }

    @PatchMapping("/{id}/corrective-actions/{actionId}")
    @ResponseStatus(HttpStatus.OK)
    public CorrectiveActionResponse updateCorrectiveAction(
            @PathVariable Long id,
            @PathVariable Long actionId,
            @RequestBody UpdateCorrectiveActionRequest request
    ) {
        return service.updateCorrectiveAction(id, actionId, request);
    }

    @DeleteMapping("/{id}/corrective-actions/{actionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCorrectiveAction(
            @PathVariable Long id,
            @PathVariable Long actionId
    ) {
        service.deleteCorrectiveAction(id, actionId);
    }

    // --- Corrective Action Documents ---

    @PostMapping("/{id}/corrective-actions/{actionId}/documents")
    @ResponseStatus(HttpStatus.CREATED)
    public CorrectiveActionResponse uploadDocument(
            @PathVariable Long id,
            @PathVariable Long actionId,
            @RequestPart("data") UploadDocumentRequest request,
            @RequestPart("file") MultipartFile file
    ) {
        DocumentResponse doc = documentService.upload(request, file);
        return service.attachDocument(id, actionId, doc.id());
    }

    @DeleteMapping("/{id}/corrective-actions/{actionId}/documents/{documentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeDocument(
            @PathVariable Long id,
            @PathVariable Long actionId,
            @PathVariable Long documentId
    ) {
        service.removeDocument(id, actionId, documentId);
    }
}