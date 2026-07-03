package com.rodrigommfreitas.coreservice.systempolicy;

import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentResponse;
import com.rodrigommfreitas.coreservice.document.dto.UploadDocumentRequest;
import com.rodrigommfreitas.coreservice.scope.dto.ScopeResponse;
import com.rodrigommfreitas.coreservice.scope.dto.UpdateScopeRequest;
import com.rodrigommfreitas.coreservice.systempolicy.dto.SystemPolicyResponse;
import com.rodrigommfreitas.coreservice.systempolicy.dto.UpdateSystemPolicyRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/system-policy")
@RequiredArgsConstructor
public class SystemPolicyController {

    private final SystemPolicyService systemPolicyService;
    private final DocumentService documentService;

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public SystemPolicyResponse getPolicy() {
        return systemPolicyService.getPolicy(1L);
    }

    @PatchMapping
    @ResponseStatus(HttpStatus.OK)
    public SystemPolicyResponse updatePolicy(@RequestBody UpdateSystemPolicyRequest request) {
        return systemPolicyService.updatePolicy(request);
    }

    /*
    @PostMapping("/document/{documentId}")
    public ScopeResponse attachDocument(@PathVariable Long documentId) {
        return scopeService.attachDocument(documentId);
    }*/

    @PostMapping("/document")
    @ResponseStatus(HttpStatus.CREATED)
    public SystemPolicyResponse uploadDocumentForPolicy(
            @RequestPart("data") UploadDocumentRequest request,
            @RequestPart("file") MultipartFile file
    ) {
        DocumentResponse doc = documentService.upload(request, file);
        return systemPolicyService.attachDocument(doc.id());
    }
}
