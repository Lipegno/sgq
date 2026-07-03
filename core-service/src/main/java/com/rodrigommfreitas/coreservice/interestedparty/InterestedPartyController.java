package com.rodrigommfreitas.coreservice.interestedparty;

import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentResponse;
import com.rodrigommfreitas.coreservice.document.dto.UploadDocumentRequest;
import com.rodrigommfreitas.coreservice.interestedparty.dto.AssociateProcessesRequest;
import com.rodrigommfreitas.coreservice.interestedparty.dto.CreateInterestedPartyRequest;
import com.rodrigommfreitas.coreservice.interestedparty.dto.InterestedPartyResponse;
import com.rodrigommfreitas.coreservice.interestedparty.dto.UpdateInterestedPartyRequest;
import com.rodrigommfreitas.coreservice.scope.dto.ScopeResponse;
import com.rodrigommfreitas.coreservice.year.dto.AssociateYearsRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/interested-parties")
@RequiredArgsConstructor
public class InterestedPartyController {

    private final InterestedPartyService service;
    private final InterestedPartyYearService interestedPartyYearService;
    private final DocumentService documentService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InterestedPartyResponse create(@Valid @RequestBody CreateInterestedPartyRequest request) {
        return service.create(request);
    }

    @GetMapping("/year/{yearId}")
    public List<InterestedPartyResponse> getByYear(@PathVariable Long yearId) {
        return service.getByYear(yearId);
    }

    @PutMapping("/{id}/processes/associate")
    public void associateProcesses(
            @PathVariable Long id,
            @RequestBody AssociateProcessesRequest request
    ) {
        interestedPartyYearService.associateProcesses(id, request);
    }

    @PutMapping("/{id}/processes/disassociate")
    public void disassociateProcesses(
            @PathVariable Long id,
            @RequestBody AssociateProcessesRequest request
    ) {
        interestedPartyYearService.disassociateProcesses(id, request);
    }

    @PutMapping("/{id}/years/associate")
    public void associateYears(
            @PathVariable Long id,
            @RequestBody AssociateYearsRequest request
    ) {
        interestedPartyYearService.associateYears(id, request.yearIds());
    }

    @PutMapping("/{id}/years/associate/full")
    public void associateYearsWithChildren(
            @PathVariable Long id,
            @RequestBody AssociateYearsRequest request
    ) {
        interestedPartyYearService.associateYearsWithChildren(id, request.yearIds());
    }

    @PutMapping("/{id}/years/disassociate")
    public void disassociateYears(
            @PathVariable Long id,
            @RequestBody AssociateYearsRequest request
    ) {
        interestedPartyYearService.disassociateYears(id, request);
    }

    @PostMapping("/{id}/document")
    @ResponseStatus(HttpStatus.CREATED)
    public void uploadDocumentForInterestedParty(
            @PathVariable Long id,
            @RequestPart("data") UploadDocumentRequest request,
            @RequestPart("file") MultipartFile file
    ) {
        DocumentResponse doc = documentService.upload(request, file);
        interestedPartyYearService.attachDocument(id, doc.id());
    }

    @PutMapping("/{id}")
    public InterestedPartyResponse update(
            @PathVariable Long id,
            @RequestBody UpdateInterestedPartyRequest request
    ) {
        interestedPartyYearService.updateInterestedPartyYear(id, request);
        return service.getByInterestedPartyYearId(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        interestedPartyYearService.deleteInterestedPartyYear(id);
    }
}
