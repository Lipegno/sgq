package com.rodrigommfreitas.coreservice.document;

import com.rodrigommfreitas.coreservice.document.dto.DocumentResponse;
import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;
import com.rodrigommfreitas.coreservice.document.dto.UploadDocumentRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final DocumentVersionService documentVersionService;


    @PostMapping("/upload")
    @ResponseStatus(HttpStatus.CREATED)
    public DocumentResponse upload(
            @RequestPart("data") UploadDocumentRequest request,
            @RequestPart("file") MultipartFile file
    ) {
        return documentService.upload(request, file);
    }

    @ResponseStatus(HttpStatus.OK)
    @PostMapping("/versions/{versionId}/approve")
    public void approve(@PathVariable Long versionId) {
        documentVersionService.approveVersion(versionId);
    }

    @DeleteMapping("/{documentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long documentId) {
        documentService.deleteDocument(documentId);
    }

    @GetMapping("/versions/{versionId}/download/{fileName}")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<Resource> download(@PathVariable Long versionId, @PathVariable String fileName) throws IOException {
        DocumentVersion version = documentVersionService.findById(versionId)
                .orElseThrow(() -> new RuntimeException("Version not found"));

        Path path = Paths.get("files/", fileName);
        Resource resource;
        try {
            resource = new UrlResource(path.toUri());
        } catch (MalformedURLException e) {
            throw new RuntimeException(e);
        }

        String downloadName = version.getFileName();
        int underscoreIdx = downloadName.lastIndexOf('_');
        int dotIdx = downloadName.lastIndexOf('.');
        if (underscoreIdx > 0 && dotIdx > underscoreIdx) {
            downloadName = downloadName.substring(0, underscoreIdx) + downloadName.substring(dotIdx);
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + downloadName + "\"")
                .body(resource);
    }

    @DeleteMapping("/versions/{versionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteVersion(@PathVariable Long versionId) {
        documentVersionService.deleteVersion(versionId);
    }

    @GetMapping("/{documentId}/with-versions")
    @ResponseStatus(HttpStatus.OK)
    public DocumentWithVersionsResponse getDocumentWithVersions(
            @PathVariable Long documentId
    ) {
        return documentService.getDocumentWithVersions(documentId);
    }
}
