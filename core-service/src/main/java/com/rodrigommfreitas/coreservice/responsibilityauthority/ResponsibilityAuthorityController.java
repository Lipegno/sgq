package com.rodrigommfreitas.coreservice.responsibilityauthority;

import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentResponse;
import com.rodrigommfreitas.coreservice.document.dto.UploadDocumentRequest;
import com.rodrigommfreitas.coreservice.responsibilityauthority.dto.ResponsibilityAuthorityResponse;
import com.rodrigommfreitas.coreservice.responsibilityauthority.dto.UpdateResponsibilityAuthorityRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/responsibility-authority")
@RequiredArgsConstructor
public class ResponsibilityAuthorityController {

    private final ResponsibilityAuthorityService responsibilityAuthorityService;
    private final DocumentService documentService;

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ResponsibilityAuthorityResponse getResponsibilityAuthority() {
        return responsibilityAuthorityService.getResponsibilityAuthority(1L);
    }

    @PatchMapping
    @ResponseStatus(HttpStatus.OK)
    public ResponsibilityAuthorityResponse updateResponsibilityAuthority(@RequestBody UpdateResponsibilityAuthorityRequest request) {
        return responsibilityAuthorityService.updateResponsibilityAuthority(request);
    }

    @PostMapping("/document")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponsibilityAuthorityResponse uploadDocumentForResponsibilityAuthority(
            @RequestPart("data") UploadDocumentRequest request,
            @RequestPart("file") MultipartFile file
    ) {
        DocumentResponse doc = documentService.upload(request, file);
        return responsibilityAuthorityService.attachDocument(doc.id());
    }
}