package com.rodrigommfreitas.coreservice.scope;

import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentResponse;
import com.rodrigommfreitas.coreservice.document.dto.UploadDocumentRequest;
import com.rodrigommfreitas.coreservice.scope.dto.ScopeResponse;
import com.rodrigommfreitas.coreservice.scope.dto.UpdateScopeRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/scope")
@RequiredArgsConstructor
public class ScopeController {

    private final ScopeService scopeService;
    private final DocumentService documentService;

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ScopeResponse getScope() {
        return scopeService.getScope(1L);
    }

    @PatchMapping
    @ResponseStatus(HttpStatus.OK)
    public ScopeResponse updateScope(@RequestBody UpdateScopeRequest request) {
        return scopeService.updateScope(request);
    }

    /*
    @PostMapping("/document/{documentId}")
    public ScopeResponse attachDocument(@PathVariable Long documentId) {
        return scopeService.attachDocument(documentId);
    }*/

    @PostMapping("/document")
    @ResponseStatus(HttpStatus.CREATED)
    public ScopeResponse uploadDocumentForScope(
            @RequestPart("data") UploadDocumentRequest request,
            @RequestPart("file") MultipartFile file
    ) {
        DocumentResponse doc = documentService.upload(request, file);
        return scopeService.attachDocument(doc.id());
    }
}
