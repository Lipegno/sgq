package com.rodrigommfreitas.coreservice.responsibilityauthority;

import com.fasterxml.jackson.databind.JsonNode;
import com.rodrigommfreitas.coreservice.document.Document;
import com.rodrigommfreitas.coreservice.document.DocumentRepository;
import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
import com.rodrigommfreitas.coreservice.responsibilityauthority.dto.ResponsibilityAuthorityResponse;
import com.rodrigommfreitas.coreservice.responsibilityauthority.dto.UpdateResponsibilityAuthorityRequest;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ResponsibilityAuthorityService {
    private final ResponsibilityAuthorityRepository responsibilityAuthorityRepository;
    private final DocumentRepository documentRepository;
    private final DocumentService documentService;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    public ResponsibilityAuthorityResponse getResponsibilityAuthority(Long id) {
        ResponsibilityAuthority responsibilityAuthority = responsibilityAuthorityRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ResponsibilityAuthority not found with id " + id));
        return mapToResponse(responsibilityAuthority);
    }

    @Transactional
    public ResponsibilityAuthorityResponse updateResponsibilityAuthority(UpdateResponsibilityAuthorityRequest request) {
        ResponsibilityAuthority ra = responsibilityAuthorityRepository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("ResponsibilityAuthority not found"));

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("description", ra.getDescription() != null ? ra.getDescription() : "");

        if (request.description() != null) {
            ra.setDescription(request.description());
        }

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("description", ra.getDescription() != null ? ra.getDescription() : "");

        if (!oldFields.equals(newFields)) {
            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.RESPONSIBILITY_AUTHORITY,
                    1L,
                    null,
                    null,
                    "Responsabilidade e Autoridade",
                    ActionType.UPDATED,
                    logDetailsBuilder.buildUpdated(oldFields, newFields)
            ));
        }

        return mapToResponse(ra);
    }

    @Transactional
    public ResponsibilityAuthorityResponse attachDocument(Long documentId) {
        ResponsibilityAuthority ra = responsibilityAuthorityRepository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("ResponsibilityAuthority not found"));

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        ra.setDocument(document);

        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.RESPONSIBILITY_AUTHORITY,
                1L,
                null,
                null,
                "Responsabilidade e Autoridade",
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("document", document.getId().toString(), "associated")
        ));

        return mapToResponse(ra);
    }

    private ResponsibilityAuthorityResponse mapToResponse(ResponsibilityAuthority responsibilityAuthority) {
        DocumentWithVersionsResponse document = null;
        if (responsibilityAuthority.getDocument() != null) {
            document = documentService.getDocumentWithVersions(responsibilityAuthority.getDocument().getId());
        }
        return new ResponsibilityAuthorityResponse(
                responsibilityAuthority.getId(),
                responsibilityAuthority.getDescription(),
                document
        );
    }
}