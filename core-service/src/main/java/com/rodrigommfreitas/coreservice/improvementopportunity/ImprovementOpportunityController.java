package com.rodrigommfreitas.coreservice.improvementopportunity;

import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentResponse;
import com.rodrigommfreitas.coreservice.document.dto.UploadDocumentRequest;
import com.rodrigommfreitas.coreservice.improvementopportunity.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/improvement-opportunities")
@RequiredArgsConstructor
public class ImprovementOpportunityController {

    private final ImprovementOpportunityService service;
    private final DocumentService documentService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ImprovementOpportunityResponse create(@RequestBody CreateImprovementOpportunityRequest request) {
        return service.create(request);
    }

    @PatchMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ImprovementOpportunityResponse update(
            @PathVariable Long id,
            @RequestBody UpdateImprovementOpportunityRequest request
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
    public List<ImprovementOpportunityResponse> getByYear(@PathVariable Long yearId) {
        return service.getByYear(yearId);
    }

    // ImprovementOpportunityYear

    @PatchMapping("/{id}/years/{yearId}")
    @ResponseStatus(HttpStatus.OK)
    public ImprovementOpportunityYearDetail updateYear(
            @PathVariable Long id,
            @PathVariable Long yearId,
            @RequestBody UpdateImprovementOpportunityYearRequest request
    ) {
        return service.updateYear(id, yearId, request);
    }

    @PatchMapping("/{id}/years")
    @ResponseStatus(HttpStatus.OK)
    public ImprovementOpportunityResponse updateYears(
            @PathVariable Long id,
            @RequestBody UpdateImprovementOpportunityYearsRequest request
    ) {
        return service.updateYears(id, request);
    }

    // Improvement Actions

    @PostMapping("/{id}/improvement-actions")
    @ResponseStatus(HttpStatus.CREATED)
    public ImprovementActionResponse createImprovementAction(
            @PathVariable Long id,
            @RequestBody CreateImprovementActionRequest request
    ) {
        return service.createImprovementAction(id, request);
    }

    @PatchMapping("/{id}/improvement-actions/{actionId}")
    @ResponseStatus(HttpStatus.OK)
    public ImprovementActionResponse updateImprovementAction(
            @PathVariable Long id,
            @PathVariable Long actionId,
            @RequestBody UpdateImprovementActionRequest request
    ) {
        return service.updateImprovementAction(id, actionId, request);
    }

    @DeleteMapping("/{id}/improvement-actions/{actionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteImprovementAction(
            @PathVariable Long id,
            @PathVariable Long actionId
    ) {
        service.deleteImprovementAction(id, actionId);
    }

    // --- Improvement Action Documents ---

    @PostMapping("/{id}/improvement-actions/{actionId}/documents")
    @ResponseStatus(HttpStatus.CREATED)
    public ImprovementActionResponse uploadDocument(
            @PathVariable Long id,
            @PathVariable Long actionId,
            @RequestPart("data") UploadDocumentRequest request,
            @RequestPart("file") MultipartFile file
    ) {
        DocumentResponse doc = documentService.upload(request, file);
        return service.attachDocument(id, actionId, doc.id());
    }

    @DeleteMapping("/{id}/improvement-actions/{actionId}/documents/{documentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeDocument(
            @PathVariable Long id,
            @PathVariable Long actionId,
            @PathVariable Long documentId
    ) {
        service.removeDocument(id, actionId, documentId);
    }
}