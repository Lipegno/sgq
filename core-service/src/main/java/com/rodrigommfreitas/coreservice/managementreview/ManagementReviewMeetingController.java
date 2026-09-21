package com.rodrigommfreitas.coreservice.managementreview;

import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentResponse;
import com.rodrigommfreitas.coreservice.document.dto.UploadDocumentRequest;
import com.rodrigommfreitas.coreservice.managementreview.dto.ManagementReviewMeetingRequest;
import com.rodrigommfreitas.coreservice.managementreview.dto.ManagementReviewMeetingResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/management-review-meetings")
@RequiredArgsConstructor
public class ManagementReviewMeetingController {

    private final ManagementReviewMeetingService service;
    private final DocumentService documentService;

    @GetMapping
    public List<ManagementReviewMeetingResponse> list(@RequestParam Long yearId) {
        return service.listByYear(yearId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ManagementReviewMeetingResponse create(@RequestBody ManagementReviewMeetingRequest request) {
        return service.create(request);
    }

    @PatchMapping("/{id}")
    public ManagementReviewMeetingResponse update(@PathVariable Long id, @RequestBody ManagementReviewMeetingRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PostMapping("/{id}/documents")
    @ResponseStatus(HttpStatus.CREATED)
    public ManagementReviewMeetingResponse uploadDocument(
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
