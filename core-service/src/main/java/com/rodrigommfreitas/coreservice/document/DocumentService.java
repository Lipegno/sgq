package com.rodrigommfreitas.coreservice.document;

import com.rodrigommfreitas.coreservice.document.dto.DocumentResponse;
import com.rodrigommfreitas.coreservice.document.dto.DocumentVersionResponse;
import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;
import com.rodrigommfreitas.coreservice.document.dto.UploadDocumentRequest;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import com.rodrigommfreitas.coreservice.user.User;
import com.rodrigommfreitas.coreservice.user.UserReferenceService;
import com.rodrigommfreitas.coreservice.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository versionRepository;
    private final UserRepository userRepository;
    private final UserReferenceService userRefService;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    public DocumentWithVersionsResponse getDocumentWithVersions(Long documentId) {
        if (documentId == null) return null;
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        var versionsResponse = document.getVersions().stream()
                .map(v -> new DocumentVersionResponse(
                        v.getId(),
                        v.getVersion(),
                        v.getFileName(),
                        v.getFileType(),
                        userRefService.fromEntity(v.getUploadedBy()),
                        v.getStatus(),
                        v.getUploadedAt(),
                        v.getObsoleteAt(),
                        v.getFileUrl()
                ))
                .toList();

        return new DocumentWithVersionsResponse(
                document.getId(),
                versionsResponse
        );
    }

    @Transactional
    public DocumentResponse upload(UploadDocumentRequest request, MultipartFile file) {

        Document document;
        boolean isNewDocument = request.documentId() == null;

        if (request.documentId() != null) {
            document = documentRepository.findById(request.documentId())
                    .orElseThrow(() -> new RuntimeException("Document not found"));
            if (request.version() <= document.getCurrentVersion().getVersion()) {
                throw new IllegalArgumentException("New version must be higher than current version");
            }
        } else {
            document = Document.builder().build();
            document.setVersioned(request.versioned());
            document = documentRepository.save(document);
        }

        if (!document.getVersioned() && !document.getVersions().isEmpty()) {
            throw new RuntimeException("Non-versioned document cannot have multiple versions");
        }

        versionRepository.findByDocumentAndVersion(document, request.version())
                .ifPresent(v -> {
                    throw new RuntimeException("Version already exists");
                });

        String originalName = file.getOriginalFilename();
        String extension = "";
        String baseName = originalName;
        int dotIndex = originalName != null ? originalName.lastIndexOf('.') : -1;
        if (dotIndex > 0) {
            extension = originalName.substring(dotIndex);
            baseName = originalName.substring(0, dotIndex);
        }
        String fileName = baseName + "_" + UUID.randomUUID() + extension;
        String fileUrl = "/files/" + fileName;
        Path filePath = Paths.get("files/", fileName);

        try {
            Files.createDirectories(filePath.getParent());
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        try {
            Files.write(filePath, file.getBytes());
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        User uploadedBy = request.uploadedById() != null
                ? userRepository.findById(request.uploadedById()).orElse(null)
                : null;

        DocumentVersion version = DocumentVersion.builder()
                .document(document)
                .version(request.version())
                .fileName(fileName)
                .fileType(file.getContentType())
                .fileUrl(filePath.toString())
                .uploadedBy(uploadedBy)
                .uploadedAt(LocalDateTime.now())
                .build();

        version = versionRepository.save(version);

        boolean requiresApproval = document.getVersioned() && (request.requiresApproval() == null || request.requiresApproval());

        if (!requiresApproval) {
            autoApprove(document, version);
        } else {
            version.setStatus(DocumentStatus.UNDER_REVIEW);
        }

        version = versionRepository.save(version);

        if (document.getVersions() == null) {
            document.setVersions(new ArrayList<>());
        }
        document.getVersions().add(version);
        document.setCurrentVersion(version);

        Document savedDocument = documentRepository.save(document);

        Long userId = UserContextHolder.getUserId();
        if (isNewDocument) {
            Map<String, Object> fields = new LinkedHashMap<>();
            fields.put("versioned", document.getVersioned() != null ? document.getVersioned().toString() : "false");
            fields.put("fileName", originalName != null ? originalName : "");
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.DOCUMENT,
                    savedDocument.getId(),
                    null,
                    null,
                    originalName != null ? originalName : "Documento",
                    ActionType.CREATED,
                    logDetailsBuilder.buildCreated(fields)
            ));
        } else {
            Map<String, Object> fields = new LinkedHashMap<>();
            fields.put("version", String.valueOf(request.version()));
            fields.put("fileName", originalName != null ? originalName : "");
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.DOCUMENT,
                    savedDocument.getId(),
                    null,
                    null,
                    originalName != null ? originalName : "Documento",
                    ActionType.UPDATED,
                    logDetailsBuilder.buildCreated(fields)
            ));
        }

        return mapToResponse(savedDocument);
    }

    @Transactional
    public void deleteDocument(Long documentId) {
        Document doc = documentRepository.findById(documentId).orElse(null);
        if (doc != null) {
            Long userId = UserContextHolder.getUserId();
            String docName = doc.getCurrentVersion() != null && doc.getCurrentVersion().getFileName() != null
                    ? doc.getCurrentVersion().getFileName() : "Documento";
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.DOCUMENT,
                    documentId,
                    null,
                    null,
                    docName,
                    ActionType.DELETED,
                    logDetailsBuilder.buildDeleted(Map.of("id", documentId.toString()))
            ));
        }
        documentRepository.deleteById(documentId);
    }

    public String getDownloadUrl(Long versionId) {
        DocumentVersion version = versionRepository.findById(versionId)
                .orElseThrow(() -> new RuntimeException("Version not found"));
        return version.getFileUrl();
    }

    private void autoApprove(Document document, DocumentVersion version) {
        versionRepository.findByDocumentAndStatus(document, DocumentStatus.APPROVED)
                .ifPresent(existing -> {
                    existing.setStatus(DocumentStatus.OBSOLETE);
                    existing.setObsoleteAt(LocalDateTime.now());
                });
        version.setStatus(DocumentStatus.APPROVED);
        version.setApprovedAt(LocalDateTime.now());
        document.setCurrentVersion(version);
    }

    private DocumentResponse mapToResponse(Document document) {
        Double currentVersionValue = null;
        if (document.getCurrentVersion() != null) {
            currentVersionValue = document.getCurrentVersion().getVersion();
        }
        return new DocumentResponse(
                document.getId(),
                document.getVersioned(),
                currentVersionValue
        );
    }
}