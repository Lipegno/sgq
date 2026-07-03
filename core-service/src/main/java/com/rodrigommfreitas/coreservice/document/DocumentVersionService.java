package com.rodrigommfreitas.coreservice.document;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DocumentVersionService {
    private final DocumentVersionRepository documentVersionRepository;

    public Optional<DocumentVersion> findById(Long versionId) {
        return documentVersionRepository.findById(versionId);
    }

    @Transactional
    public void approveVersion(Long versionId) {

        DocumentVersion version = documentVersionRepository.findById(versionId)
                .orElseThrow(() -> new RuntimeException("Version not found"));

        if (version.getStatus() == DocumentStatus.APPROVED) {
            throw new IllegalArgumentException("Version already approved");
        }

        Document document = version.getDocument();

        // Obsolete existing approved version
        documentVersionRepository
                .findByDocumentAndStatus(document, DocumentStatus.APPROVED)
                .ifPresent(existingApproved -> {
                    existingApproved.setStatus(DocumentStatus.OBSOLETE);
                    existingApproved.setObsoleteAt(LocalDateTime.now());
                });

        // Approve new version
        version.setStatus(DocumentStatus.APPROVED);
        version.setApprovedAt(LocalDateTime.now());

        // Set as current
        document.setCurrentVersion(version);
    }

    @Transactional
    public void deleteVersion(Long versionId) {

        DocumentVersion version = documentVersionRepository.findById(versionId)
                .orElseThrow(() -> new RuntimeException("Version not found"));

        Document document = version.getDocument();

        boolean isCurrent = document.getCurrentVersion() != null
                && document.getCurrentVersion().getId().equals(versionId);

        // Remove from the Document's versions collection first
        if (document.getVersions() != null) {
            document.getVersions().remove(version);
        }

        // Clear the currentVersion reference BEFORE deleting to avoid
        // TransientPropertyValueException on flush
        if (isCurrent) {
            document.setCurrentVersion(null);
        }

        // Now safe to delete the version
        documentVersionRepository.delete(version);

        if (!isCurrent) {
            return;
        }

        // Fetch remaining versions (latest first)
        List<DocumentVersion> remainingVersions =
                documentVersionRepository.findByDocumentOrderByUploadedAtDesc(document);

        if (remainingVersions.isEmpty()) {
            // No versions left — currentVersion already set to null above
            return;
        }

        // Pick latest
        DocumentVersion latest = remainingVersions.get(0);

        // Obsolete any currently approved (safety)
        documentVersionRepository.findByDocumentAndStatus(document, DocumentStatus.APPROVED)
                .ifPresent(existing -> {
                    existing.setStatus(DocumentStatus.OBSOLETE);
                    existing.setObsoleteAt(LocalDateTime.now());
                });

        // Promote latest
        latest.setStatus(DocumentStatus.APPROVED);
        latest.setApprovedAt(LocalDateTime.now());

        document.setCurrentVersion(latest);
    }
}
