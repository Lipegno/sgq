package com.rodrigommfreitas.coreservice.document;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


@Repository
public interface DocumentVersionRepository extends JpaRepository<DocumentVersion, Long> {
    Optional<DocumentVersion> findByDocumentAndVersion(Document document, double version);
    Optional<DocumentVersion> findByDocumentAndStatus(Document document, DocumentStatus status);
    List<DocumentVersion> findByDocumentId(Long documentId);
    List<DocumentVersion> findByDocumentOrderByUploadedAtDesc(Document document);
}

