package com.rodrigommfreitas.coreservice.year;

import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentResponse;
import com.rodrigommfreitas.coreservice.document.dto.UploadDocumentRequest;
import com.rodrigommfreitas.coreservice.year.dto.MacroProcessDiagramResponse;
import com.rodrigommfreitas.coreservice.year.dto.CreateYearRequest;
import com.rodrigommfreitas.coreservice.year.dto.YearResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/years")
public class YearController {

    private final YearService yearService;
    private final DocumentService documentService;

    public YearController(
            YearService yearService,
            DocumentService documentService
    ) {
        this.yearService = yearService;
        this.documentService = documentService;
    }
    @PostMapping
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<YearResponse> create(
            @RequestBody CreateYearRequest request
    ) {
        return ResponseEntity.ok(yearService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<YearResponse>> getAll() {
        return ResponseEntity.ok(yearService.getAll());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        yearService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{yearId}/macroprocess-diagram/{documentId}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<Void> attachMacroProcessDiagram(
            @PathVariable Long yearId,
            @PathVariable Long documentId
    ) {
        yearService.attachMacroProcessDiagram(yearId, documentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{yearId}/macroprocess-diagram")
    public ResponseEntity<MacroProcessDiagramResponse> getMacroProcessDiagram(
            @PathVariable Long yearId
    ) {
        return ResponseEntity.ok(
                yearService.getMacroProcessDiagram(yearId)
        );
    }

    @DeleteMapping("/{yearId}/macroprocess-diagram")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<Void> removeMacroProcessDiagram(
            @PathVariable Long yearId
    ) {
        yearService.removeMacroProcessDiagram(yearId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{yearId}/macroprocess-diagram")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public void uploadMacroProcessDiagram(
            @PathVariable Long yearId,
            @RequestPart("data") UploadDocumentRequest request,
            @RequestPart("file") MultipartFile file
    ) {
        DocumentResponse doc = documentService.upload(request, file);
        yearService.attachMacroProcessDiagram(yearId, doc.id());
    }
}