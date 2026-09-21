package com.rodrigommfreitas.coreservice.documentedinformation;

import com.rodrigommfreitas.coreservice.documentedinformation.dto.DocumentedInformationResponse;
import com.rodrigommfreitas.coreservice.documentedinformation.dto.UpdateDocumentedInformationRequest;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DocumentedInformationService {

    private final DocumentedInformationRepository repository;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    @Transactional(readOnly = true)
    public DocumentedInformationResponse get() {
        return mapToResponse(load());
    }

    @Transactional
    public DocumentedInformationResponse update(UpdateDocumentedInformationRequest request) {
        DocumentedInformation entity = load();

        Map<String, Object> oldFields = fields(entity);

        if (request.description() != null) {
            entity.setDescription(request.description());
        }
        if (request.url() != null) {
            entity.setUrl(normalizeUrl(request.url()));
        }

        Map<String, Object> newFields = fields(entity);

        if (!oldFields.equals(newFields)) {
            repository.save(entity);
            logService.createLog(new CreateLogRequest(
                    UserContextHolder.getUserId(),
                    EntityType.DOCUMENTED_INFORMATION,
                    entity.getId(),
                    null,
                    null,
                    "Informação Documentada",
                    ActionType.UPDATED,
                    logDetailsBuilder.buildUpdated(oldFields, newFields)
            ));
        }

        return mapToResponse(entity);
    }

    private DocumentedInformation load() {
        return repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("DocumentedInformation not found"));
    }

    private static String normalizeUrl(String raw) {
        String value = raw.trim();
        if (value.isEmpty()) {
            return null;
        }
        URI uri;
        try {
            uri = URI.create(value);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("A ligação não é um endereço válido.");
        }
        String scheme = uri.getScheme();
        boolean web = "http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme);
        if (!web || uri.getHost() == null) {
            throw new IllegalArgumentException("A ligação tem de começar por http:// ou https://.");
        }
        return value;
    }

    private static Map<String, Object> fields(DocumentedInformation entity) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("description", entity.getDescription() != null ? entity.getDescription() : "");
        fields.put("url", entity.getUrl() != null ? entity.getUrl() : "");
        return fields;
    }

    private static DocumentedInformationResponse mapToResponse(DocumentedInformation entity) {
        return new DocumentedInformationResponse(entity.getId(), entity.getDescription(), entity.getUrl());
    }
}
