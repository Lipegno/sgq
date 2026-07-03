package com.rodrigommfreitas.coreservice.leadershipcommitment;

import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentResponse;
import com.rodrigommfreitas.coreservice.document.dto.UploadDocumentRequest;
import com.rodrigommfreitas.coreservice.leadershipcommitment.dto.LeadershipCommitmentResponse;
import com.rodrigommfreitas.coreservice.leadershipcommitment.dto.LeadershipCommitmentYearDetail;
import com.rodrigommfreitas.coreservice.leadershipcommitment.dto.UpdateDocumentYearsRequest;
import com.rodrigommfreitas.coreservice.leadershipcommitment.dto.UpdateLeadershipCommitmentRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/leadership-commitments")
@RequiredArgsConstructor
public class LeadershipCommitmentController {

    private final LeadershipCommitmentService service;
    private final DocumentService documentService;

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public LeadershipCommitmentResponse get() {
        return service.get();
    }

    @PatchMapping
    @ResponseStatus(HttpStatus.OK)
    public LeadershipCommitmentResponse update(@RequestBody UpdateLeadershipCommitmentRequest request) {
        return service.update(request);
    }

    @GetMapping("/year/{yearId}")
    @ResponseStatus(HttpStatus.OK)
    public LeadershipCommitmentYearDetail getByYear(@PathVariable Long yearId) {
        return service.getByYear(yearId);
    }

    @PostMapping("/years/{yearId}/documents")
    @ResponseStatus(HttpStatus.CREATED)
    public LeadershipCommitmentYearDetail uploadDocument(
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

    @PatchMapping("/documents/{documentId}/years")
    @ResponseStatus(HttpStatus.OK)
    public LeadershipCommitmentYearDetail updateDocumentYears(
            @PathVariable Long documentId,
            @RequestBody UpdateDocumentYearsRequest request
    ) {
        return service.updateDocumentYears(documentId, request);
    }
}