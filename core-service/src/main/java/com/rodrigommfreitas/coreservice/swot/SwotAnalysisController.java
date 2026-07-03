package com.rodrigommfreitas.coreservice.swot;

import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentResponse;
import com.rodrigommfreitas.coreservice.document.dto.UploadDocumentRequest;
import com.rodrigommfreitas.coreservice.swot.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/swot-analysis")
@RequiredArgsConstructor
public class SwotAnalysisController {

    private final SwotAnalysisService service;
    private final DocumentService documentService;

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public SwotAnalysisResponse get() {
        return service.get();
    }

    @PatchMapping
    @ResponseStatus(HttpStatus.OK)
    public SwotAnalysisResponse update(@RequestBody UpdateSwotAnalysisRequest request) {
        return service.update(request);
    }

    @PostMapping("/documents")
    @ResponseStatus(HttpStatus.CREATED)
    public SwotAnalysisResponse uploadDocument(
            @RequestPart("data") UploadDocumentRequest request,
            @RequestPart("file") MultipartFile file
    ) {
        DocumentResponse doc = documentService.upload(request, file);
        return service.attachDocument(doc.id());
    }

    @DeleteMapping("/documents/{documentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeDocument(@PathVariable Long documentId) {
        service.removeDocument(documentId);
    }

    @GetMapping("/year/{yearId}")
    @ResponseStatus(HttpStatus.OK)
    public SwotYearDetail getByYear(@PathVariable Long yearId) {
        return service.getByYear(yearId);
    }

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    public SwotItemResponse createItem(@RequestBody CreateSwotItemRequest request) {
        return service.createItem(request);
    }

    @PatchMapping("/items/{itemId}")
    @ResponseStatus(HttpStatus.OK)
    public SwotItemResponse updateItem(
            @PathVariable Long itemId,
            @RequestBody UpdateSwotItemRequest request
    ) {
        return service.updateItem(itemId, request);
    }

    @DeleteMapping("/items/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteItem(@PathVariable Long itemId) {
        service.deleteItem(itemId);
    }

    @PatchMapping("/items/{itemId}/years")
    @ResponseStatus(HttpStatus.OK)
    public SwotItemResponse updateItemYears(
            @PathVariable Long itemId,
            @RequestBody UpdateItemYearsRequest request
    ) {
        return service.updateItemYears(itemId, request);
    }
}