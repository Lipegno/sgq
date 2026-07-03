package com.rodrigommfreitas.coreservice.supplier;

import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentResponse;
import com.rodrigommfreitas.coreservice.document.dto.UploadDocumentRequest;
import com.rodrigommfreitas.coreservice.supplier.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService service;
    private final DocumentService documentService;

    @GetMapping
    public List<SupplierResponse> getAll() {
        return service.getAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SupplierResponse create(@RequestBody CreateSupplierRequest request) {
        return service.create(request);
    }

    @PatchMapping("/{id}")
    public SupplierResponse update(
            @PathVariable Long id,
            @RequestBody UpdateSupplierRequest request
    ) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PostMapping("/{id}/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public SupplierReviewResponse createReview(
            @PathVariable Long id,
            @RequestBody CreateSupplierReviewRequest request
    ) {
        return service.createReview(id, request);
    }

    @PatchMapping("/{id}/reviews/{reviewId}")
    public SupplierReviewResponse updateReview(
            @PathVariable Long id,
            @PathVariable Long reviewId,
            @RequestBody UpdateSupplierReviewRequest request
    ) {
        return service.updateReview(id, reviewId, request);
    }

    @DeleteMapping("/{id}/reviews/{reviewId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteReview(
            @PathVariable Long id,
            @PathVariable Long reviewId
    ) {
        service.deleteReview(id, reviewId);
    }

    @PostMapping("/{id}/reviews/{reviewId}/documents")
    @ResponseStatus(HttpStatus.CREATED)
    public SupplierReviewResponse uploadDocument(
            @PathVariable Long id,
            @PathVariable Long reviewId,
            @RequestPart("data") UploadDocumentRequest request,
            @RequestPart("file") MultipartFile file
    ) {
        DocumentResponse doc = documentService.upload(request, file);
        return service.attachDocument(id, reviewId, doc.id());
    }

    @DeleteMapping("/{id}/reviews/{reviewId}/documents/{documentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeDocument(
            @PathVariable Long id,
            @PathVariable Long reviewId,
            @PathVariable Long documentId
    ) {
        service.removeDocument(id, reviewId, documentId);
    }
}
