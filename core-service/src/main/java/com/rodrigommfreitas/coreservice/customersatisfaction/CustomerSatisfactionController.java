package com.rodrigommfreitas.coreservice.customersatisfaction;

import com.rodrigommfreitas.coreservice.customersatisfaction.dto.CustomerSatisfactionResponse;
import com.rodrigommfreitas.coreservice.customersatisfaction.dto.CustomerSatisfactionYearDetail;
import com.rodrigommfreitas.coreservice.customersatisfaction.dto.UpdateCustomerSatisfactionRequest;
import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentResponse;
import com.rodrigommfreitas.coreservice.document.dto.UploadDocumentRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/customer-satisfactions")
@RequiredArgsConstructor
public class CustomerSatisfactionController {

    private final CustomerSatisfactionService service;
    private final DocumentService documentService;

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public CustomerSatisfactionResponse get() {
        return service.get();
    }

    @PatchMapping
    @ResponseStatus(HttpStatus.OK)
    public CustomerSatisfactionResponse update(@RequestBody UpdateCustomerSatisfactionRequest request) {
        return service.update(request);
    }

    @GetMapping("/year/{yearId}")
    @ResponseStatus(HttpStatus.OK)
    public CustomerSatisfactionYearDetail getByYear(@PathVariable Long yearId) {
        return service.getByYear(yearId);
    }

    @PostMapping("/years/{yearId}/documents")
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerSatisfactionYearDetail uploadDocument(
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
