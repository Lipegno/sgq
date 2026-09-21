package com.rodrigommfreitas.coreservice.documentedinformation;

import com.rodrigommfreitas.coreservice.documentedinformation.dto.DocumentedInformationResponse;
import com.rodrigommfreitas.coreservice.documentedinformation.dto.UpdateDocumentedInformationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/documented-information")
@RequiredArgsConstructor
public class DocumentedInformationController {

    private final DocumentedInformationService service;

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public DocumentedInformationResponse get() {
        return service.get();
    }

    @PatchMapping
    @PreAuthorize("hasRole('SUPERADMIN')")
    @ResponseStatus(HttpStatus.OK)
    public DocumentedInformationResponse update(@RequestBody UpdateDocumentedInformationRequest request) {
        return service.update(request);
    }
}
