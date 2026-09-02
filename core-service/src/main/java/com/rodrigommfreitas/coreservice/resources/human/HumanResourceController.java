package com.rodrigommfreitas.coreservice.resources.human;

import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentResponse;
import com.rodrigommfreitas.coreservice.document.dto.UploadDocumentRequest;
import com.rodrigommfreitas.coreservice.indicator.dto.HumanResourceResponsibilitiesResponse;
import com.rodrigommfreitas.coreservice.resources.human.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/human-resources")
@RequiredArgsConstructor
public class HumanResourceController {

    private final HumanResourceService service;
    private final DocumentService documentService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void create(@RequestBody CreateHumanResourceRequest request) {
        service.create(request);
    }

    @PostMapping(value = "/{id}/competencies", consumes = "multipart/form-data")
    @ResponseStatus(HttpStatus.CREATED)
    public HumanResourceResponse createCompetency(
            @PathVariable Long id,
            @RequestPart(value = "name", required = true) String name,
            @RequestPart(value = "details", required = false) String details,
            @RequestPart(value = "data", required = false) UploadDocumentRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        System.out.println("FILE: " + (file != null ? file.getOriginalFilename() : "NULL"));
        System.out.println("REQUEST: " + request);
        return service.createCompetency(id, name, details, request, file);
    }

    @PostMapping(value = "/{id}/competencies/{competencyId}/document", consumes = "multipart/form-data")
    public HumanResourceResponse uploadDocument(
            @PathVariable Long competencyId,
            @RequestPart("data") UploadDocumentRequest request,
            @RequestPart("file") MultipartFile file
    ) {
        return service.uploadAndAttachDocument(competencyId, request, file);
    }

    @PatchMapping("/{id}")
    public void update(
            @PathVariable Long id,
            @RequestBody UpdateHumanResourceRequest request
    ) {
        service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteAll(@PathVariable Long id) {
        service.deleteAll(id);
    }

    @DeleteMapping("/{id}/years/{yearId}")
    public void deleteFromYear(
            @PathVariable Long id,
            @PathVariable Long yearId
    ) {
        service.deleteFromYear(id, yearId);
    }

    @PostMapping("/{id}/years")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void associateYears(
            @PathVariable Long id,
            @RequestBody Set<Long> yearIds
    ) {
        service.associateYears(id, yearIds);
    }

    @GetMapping("/year/{yearId}")
    public List<HumanResourceResponse> getByYear(@PathVariable Long yearId) {
        return service.getByYear(yearId);
    }

    @GetMapping("/{humanResourceYearId}/responsibilities")
    public HumanResourceResponsibilitiesResponse getResponsibilities(
            @PathVariable Long humanResourceYearId
    ) {
        return service.getResponsibilities(humanResourceYearId);
    }
}

