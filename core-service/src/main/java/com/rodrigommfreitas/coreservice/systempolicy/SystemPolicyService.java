package com.rodrigommfreitas.coreservice.systempolicy;

import com.rodrigommfreitas.coreservice.document.Document;
import com.rodrigommfreitas.coreservice.document.DocumentRepository;
import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import com.rodrigommfreitas.coreservice.systempolicy.dto.SystemPolicyResponse;
import com.rodrigommfreitas.coreservice.systempolicy.dto.UpdateSystemPolicyRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SystemPolicyService {
    private final SystemPolicyRepository systemPolicyRepository;
    private final DocumentRepository documentRepository;
    private final DocumentService documentService;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    public SystemPolicyResponse getPolicy(Long id) {
        SystemPolicy policy = systemPolicyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Policy not found with id " + id));
        return mapToResponse(policy);
    }

    @Transactional
    public SystemPolicyResponse updatePolicy(UpdateSystemPolicyRequest request) {
        SystemPolicy policy = systemPolicyRepository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("Policy not found"));

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("description", policy.getDescription() != null ? policy.getDescription() : "");

        if (request.description() != null) {
            policy.setDescription(request.description());
        }

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("description", policy.getDescription() != null ? policy.getDescription() : "");

        if (!oldFields.equals(newFields)) {
            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.SYSTEM_POLICY,
                    1L,
                    null,
                    null,
                    "Política da Qualidade",
                    ActionType.UPDATED,
                    logDetailsBuilder.buildUpdated(oldFields, newFields)
            ));
        }

        return mapToResponse(policy);
    }

    @Transactional
    public SystemPolicyResponse attachDocument(Long documentId) {
        SystemPolicy policy = systemPolicyRepository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("Policy not found"));

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        policy.setDocument(document);

        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.SYSTEM_POLICY,
                1L,
                null,
                null,
                "Política da Qualidade",
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("document", document.getId().toString(), "associated")
        ));

        return mapToResponse(policy);
    }

    private SystemPolicyResponse mapToResponse(SystemPolicy policy) {
        DocumentWithVersionsResponse document = null;
        if (policy.getDocument() != null) {
            document = documentService.getDocumentWithVersions(policy.getDocument().getId());
        }
        return new SystemPolicyResponse(
                policy.getId(),
                policy.getDescription(),
                document
        );
    }
}