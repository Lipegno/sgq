package com.rodrigommfreitas.coreservice.managementreview;

import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentResponse;
import com.rodrigommfreitas.coreservice.document.dto.UploadDocumentRequest;
import com.rodrigommfreitas.coreservice.managementreview.dto.ManagementReviewResponse;
import com.rodrigommfreitas.coreservice.managementreview.dto.ManagementReviewYearDetail;
import com.rodrigommfreitas.coreservice.managementreview.dto.UpdateManagementReviewRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/management-reviews")
@RequiredArgsConstructor
public class ManagementReviewController {

    private final ManagementReviewService service;
    private final DocumentService documentService;

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ManagementReviewResponse get() {
        return service.get();
    }

    @PatchMapping
    @ResponseStatus(HttpStatus.OK)
    public ManagementReviewResponse update(@RequestBody UpdateManagementReviewRequest request) {
        return service.update(request);
    }

    @GetMapping("/year/{yearId}")
    @ResponseStatus(HttpStatus.OK)
    public ManagementReviewYearDetail getByYear(@PathVariable Long yearId) {
        return service.getByYear(yearId);
    }

    @PostMapping("/years/{yearId}/documents")
    @ResponseStatus(HttpStatus.CREATED)
    public ManagementReviewYearDetail uploadDocument(
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
}
