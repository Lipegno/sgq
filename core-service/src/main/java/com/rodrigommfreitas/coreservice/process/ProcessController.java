package com.rodrigommfreitas.coreservice.process;

import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentResponse;
import com.rodrigommfreitas.coreservice.document.dto.UploadDocumentRequest;
import com.rodrigommfreitas.coreservice.process.dto.*;
import com.rodrigommfreitas.coreservice.year.dto.AssociateYearsRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/processes")
@RequiredArgsConstructor
public class ProcessController {

    private final ProcessService processService;
    private final DocumentService documentService;

    @PostMapping
    public ResponseEntity<ProcessResponse> createProcess(@Valid @RequestBody CreateProcessRequest request) {
        return ResponseEntity.ok(processService.createProcess(request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ProcessResponse> updateProcess(@PathVariable Long id, @Valid @RequestBody UpdateProcessRequest request) {
        return ResponseEntity.ok(processService.updateProcess(id, request));
    }

    @PostMapping("/{processId}/editors")
    public ResponseEntity<Void> addResponsible(@PathVariable Long processId, @RequestBody EditorRequest request) {
        processService.addEditor(processId, request.userId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{processId}/editors/{userId}")
    public ResponseEntity<Void> removeResponsible(@PathVariable Long processId, @PathVariable Long userId) {
        processService.removeEditor(processId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{processId}/departments")
    public ResponseEntity<Void> addDepartment(@PathVariable Long processId, @RequestBody DepartmentIdRequest request) {
        processService.addDepartment(processId, request.departmentId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{processId}/departments/{departmentId}")
    public ResponseEntity<Void> removeDepartment(@PathVariable Long processId, @PathVariable Long departmentId) {
        processService.removeDepartment(processId, departmentId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/associate")
    public ResponseEntity<Void> associateProcesses(@Valid @RequestBody AssociateProcessesRequest request) {
        processService.associateProcesses(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/bulk-remove")
    public ResponseEntity<Void> bulkRemoveFromMacroProcess(@Valid @RequestBody DisassociateProcessRequest request) {
        processService.bulkRemoveFromMacroProcess(request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/process-year/{processYearId}")
    public ResponseEntity<Void> deleteProcessYear(@PathVariable Long processYearId) {
        processService.deleteProcessYear(processYearId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/move")
    public ResponseEntity<Void> moveProcess(@Valid @RequestBody MoveProcessRequest request) {
        processService.moveProcess(request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/options")
    public ResponseEntity<List<ProcessOptionResponse>> getProcessOptionsByYear(@RequestParam Long yearId) {
        return ResponseEntity.ok(processService.getProcessOptionsByYear(yearId));
    }

    @PatchMapping("/{id}/years")
    public ResponseEntity<ProcessResponse> updateYears(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProcessYearsRequest request
    ) {
        return ResponseEntity.ok(processService.updateYears(id, request));
    }

    @PostMapping("/{id}/years/full")
    public ResponseEntity<ProcessResponse> associateYearsFull(
            @PathVariable Long id,
            @Valid @RequestBody AssociateYearsRequest request
    ) {
        return ResponseEntity.ok(processService.associateYearsFull(id, request.yearIds()));
    }

    @PostMapping("/{processId}/documents")
    public ResponseEntity<Void> addDocument(@PathVariable Long processId, @RequestBody DocumentIdRequest request) {
        processService.addDocument(processId, request.documentId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{processId}/documents/{documentId}")
    public ResponseEntity<Void> removeDocument(@PathVariable Long processId, @PathVariable Long documentId) {
        processService.removeDocument(processId, documentId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{processId}/documents/upload")
    public ResponseEntity<ProcessResponse> uploadDocument(
            @PathVariable Long processId,
            @RequestPart("data") UploadDocumentRequest request,
            @RequestPart("file") MultipartFile file
    ) {
        DocumentResponse doc = documentService.upload(request, file);
        processService.addDocument(processId, doc.id());
        return ResponseEntity.ok(processService.getProcessById(processId));
    }

    @PostMapping("/{processId}/ficha-documento/upload")
    public ResponseEntity<ProcessResponse> uploadFichaDocumento(
            @PathVariable Long processId,
            @RequestPart("data") UploadDocumentRequest request,
            @RequestPart("file") MultipartFile file
    ) {
        DocumentResponse doc = documentService.upload(request, file);
        processService.setFichaDocumento(processId, doc.id());
        return ResponseEntity.ok(processService.getProcessById(processId));
    }

    @DeleteMapping("/{processId}/ficha-documento")
    public ResponseEntity<Void> clearFichaDocumento(@PathVariable Long processId) {
        processService.clearFichaDocumento(processId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{processId}/entradas-documentos/upload")
    public ResponseEntity<ProcessResponse> uploadEntradasDocumento(
            @PathVariable Long processId,
            @RequestPart("data") UploadDocumentRequest request,
            @RequestPart("file") MultipartFile file
    ) {
        DocumentResponse doc = documentService.upload(request, file);
        processService.addEntradasDocumento(processId, doc.id());
        return ResponseEntity.ok(processService.getProcessById(processId));
    }

    @PostMapping("/{processId}/entradas-documentos/{documentId}")
    public ResponseEntity<Void> removeEntradasDocumento(@PathVariable Long processId, @PathVariable Long documentId) {
        processService.removeEntradasDocumento(processId, documentId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{processId}/saidas-documentos/upload")
    public ResponseEntity<ProcessResponse> uploadSaidasDocumento(
            @PathVariable Long processId,
            @RequestPart("data") UploadDocumentRequest request,
            @RequestPart("file") MultipartFile file
    ) {
        DocumentResponse doc = documentService.upload(request, file);
        processService.addSaidasDocumento(processId, doc.id());
        return ResponseEntity.ok(processService.getProcessById(processId));
    }

    @PostMapping("/{processId}/saidas-documentos/{documentId}")
    public ResponseEntity<Void> removeSaidasDocumento(@PathVariable Long processId, @PathVariable Long documentId) {
        processService.removeSaidasDocumento(processId, documentId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/process-year/{processYearId}/formal-responsibles/{humanResourceYearId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addFormalResponsible(
            @PathVariable Long processYearId,
            @PathVariable Long humanResourceYearId
    ) {
        processService.addFormalResponsible(
                processYearId,
                humanResourceYearId
        );
    }

    @DeleteMapping("/process-year/{processYearId}/formal-responsibles/{humanResourceYearId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeFormalResponsible(
            @PathVariable Long processYearId,
            @PathVariable Long humanResourceYearId
    ) {
        processService.removeFormalResponsible(
                processYearId,
                humanResourceYearId
        );
    }
}
