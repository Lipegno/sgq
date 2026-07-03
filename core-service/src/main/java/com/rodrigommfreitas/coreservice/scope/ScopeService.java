package com.rodrigommfreitas.coreservice.scope;

import com.rodrigommfreitas.coreservice.document.Document;
import com.rodrigommfreitas.coreservice.document.DocumentRepository;
import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
import com.rodrigommfreitas.coreservice.scope.dto.ScopeResponse;
import com.rodrigommfreitas.coreservice.scope.dto.UpdateScopeRequest;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ScopeService {
    private final ScopeRepository scopeRepository;
    private final DocumentRepository documentRepository;
    private final DocumentService documentService;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    public ScopeResponse getScope(Long id) {
        Scope scope = scopeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Scope not found with id " + id));
        return mapToResponse(scope);
    }

    @Transactional
    public ScopeResponse updateScope(UpdateScopeRequest request) {
        Scope scope = scopeRepository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("Scope not found"));

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("description", scope.getDescription() != null ? scope.getDescription() : "");

        if (request.description() != null) {
            scope.setDescription(request.description());
        }

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("description", scope.getDescription() != null ? scope.getDescription() : "");

        if (!oldFields.equals(newFields)) {
            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.SCOPE,
                    1L,
                    null,
                    null,
                    "Âmbito",
                    ActionType.UPDATED,
                    logDetailsBuilder.buildUpdated(oldFields, newFields)
            ));
        }

        return mapToResponse(scope);
    }

    @Transactional
    public ScopeResponse attachDocument(Long documentId) {
        Scope scope = scopeRepository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("Scope not found"));

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        scope.setDocument(document);

        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.SCOPE,
                1L,
                null,
                null,
                "Âmbito",
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("document", document.getId().toString(), "associated")
        ));

        return mapToResponse(scope);
    }

    private ScopeResponse mapToResponse(Scope scope) {
        DocumentWithVersionsResponse document = null;
        if (scope.getDocument() != null) {
            document = documentService.getDocumentWithVersions(scope.getDocument().getId());
        }
        return new ScopeResponse(
                scope.getId(),
                scope.getDescription(),
                document
        );
    }
}