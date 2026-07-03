package com.rodrigommfreitas.coreservice.awareness;

import com.rodrigommfreitas.coreservice.awareness.dto.AwarenessResponse;
import com.rodrigommfreitas.coreservice.awareness.dto.AwarenessYearDetail;
import com.rodrigommfreitas.coreservice.awareness.dto.UpdateAwarenessRequest;
import com.rodrigommfreitas.coreservice.awareness.dto.UpdateDocumentYearsRequest;
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
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AwarenessService {

    private final AwarenessRepository repository;
    private final AwarenessYearRepository yearRepository;
    private final YearRepository yearRepo;
    private final DocumentRepository documentRepository;
    private final DocumentService documentService;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    @Transactional(readOnly = true)
    public AwarenessResponse get() {
        Awareness awareness = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("Awareness not found"));
        return mapToSingletonResponse(awareness);
    }

    @Transactional
    public AwarenessResponse update(UpdateAwarenessRequest request) {
        Awareness awareness = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("Awareness not found"));

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("description", awareness.getDescription() != null ? awareness.getDescription() : "");

        if (request.description() != null) {
            awareness.setDescription(request.description());
        }

        repository.save(awareness);

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("description", awareness.getDescription() != null ? awareness.getDescription() : "");

        if (!oldFields.equals(newFields)) {
            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.AWARENESS,
                    1L,
                    null,
                    null,
                    "Consciência",
                    ActionType.UPDATED,
                    logDetailsBuilder.buildUpdated(oldFields, newFields)
            ));
        }

        return mapToSingletonResponse(awareness);
    }

    @Transactional
    public AwarenessYearDetail attachDocument(Long yearId, Long documentId) {
        Awareness awareness = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("Awareness not found"));

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with id " + documentId));

        AwarenessYear ay = yearRepository.findByAwarenessIdAndYearId(1L, yearId)
                .orElseGet(() -> {
                    Year year = yearRepo.findById(yearId)
                            .orElseThrow(() -> new EntityNotFoundException("Year not found with id " + yearId));
                    AwarenessYear newAy = AwarenessYear.builder()
                            .awareness(awareness)
                            .year(year)
                            .build();
                    yearRepository.save(newAy);
                    awareness.getYears().add(newAy);
                    return newAy;
                });

        ay.getDocuments().add(document);
        yearRepository.save(ay);

        String yearValue = ay.getYear() != null ? String.valueOf(ay.getYear().getYear()) : String.valueOf(yearId);
        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.AWARENESS,
                1L,
                ay.getId(),
                yearId,
                "Consciência — " + yearValue,
                ActionType.ASSOCIATED,
                logDetailsBuilder.buildAssociation("document", document.getId().toString(), "associated")
        ));

        return mapToYearDetail(ay);
    }

    @Transactional
    public void deleteDocument(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with id " + documentId));

        Awareness awareness = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("Awareness not found"));

        List<AwarenessYear> yearsToRemove = new ArrayList<>();
        for (AwarenessYear ay : awareness.getYears()) {
            if (ay.getDocuments().remove(document)) {
                if (ay.getDocuments().isEmpty()) {
                    yearsToRemove.add(ay);
                } else {
                    yearRepository.save(ay);
                }
            }
        }

        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.AWARENESS,
                1L,
                null,
                null,
                "Consciência",
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("document", document.getId().toString(), "disassociated")
        ));

        for (AwarenessYear ay : yearsToRemove) {
            awareness.getYears().remove(ay);
            yearRepository.delete(ay);
        }

        documentService.deleteDocument(documentId);
    }

    @Transactional
    public AwarenessYearDetail updateDocumentYears(Long documentId, UpdateDocumentYearsRequest request) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with id " + documentId));

        Awareness awareness = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("Awareness not found"));

        if (request.associateYearIds() != null) {
            for (Long yearId : request.associateYearIds()) {
                AwarenessYear ay = yearRepository.findByAwarenessIdAndYearId(1L, yearId)
                        .orElseGet(() -> {
                            Year year = yearRepo.findById(yearId)
                                    .orElseThrow(() -> new EntityNotFoundException("Year not found with id " + yearId));
                            AwarenessYear newAy = AwarenessYear.builder()
                                    .awareness(awareness)
                                    .year(year)
                                    .build();
                            yearRepository.save(newAy);
                            awareness.getYears().add(newAy);
                            return newAy;
                        });

                ay.getDocuments().add(document);
                yearRepository.save(ay);

                String yearValue = ay.getYear() != null ? String.valueOf(ay.getYear().getYear()) : String.valueOf(yearId);
                Long userId = UserContextHolder.getUserId();
                logService.createLog(new CreateLogRequest(
                        userId,
                        EntityType.AWARENESS,
                        1L,
                        ay.getId(),
                        yearId,
                        "Consciência — " + yearValue,
                        ActionType.ASSOCIATED,
                        logDetailsBuilder.buildAssociation("year", yearValue, "associated")
                ));
            }
        }

        if (request.disassociateYearIds() != null) {
            List<AwarenessYear> yearsToRemove = new ArrayList<>();
            for (Long yearId : request.disassociateYearIds()) {
                AwarenessYear ay = yearRepository.findByAwarenessIdAndYearId(1L, yearId)
                        .orElseThrow(() -> new EntityNotFoundException("AwarenessYear not found for year " + yearId));

                String yearValue = ay.getYear() != null ? String.valueOf(ay.getYear().getYear()) : String.valueOf(yearId);

                ay.getDocuments().remove(document);

                if (ay.getDocuments().isEmpty()) {
                    yearsToRemove.add(ay);
                } else {
                    yearRepository.save(ay);
                }

                Long userId = UserContextHolder.getUserId();
                logService.createLog(new CreateLogRequest(
                        userId,
                        EntityType.AWARENESS,
                        1L,
                        null,
                        yearId,
                        "Consciência — " + yearValue,
                        ActionType.DISASSOCIATED,
                        logDetailsBuilder.buildAssociation("year", yearValue, "disassociated")
                ));
            }

            for (AwarenessYear ay : yearsToRemove) {
                awareness.getYears().remove(ay);
                yearRepository.delete(ay);
            }
        }

        return yearRepository.findAll().stream()
                .filter(ay -> ay.getDocuments().contains(document))
                .findFirst()
                .map(this::mapToYearDetail)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public AwarenessYearDetail getByYear(Long yearId) {
        AwarenessYear ay = yearRepository.findByAwarenessIdAndYearId(1L, yearId)
                .orElseThrow(() -> new EntityNotFoundException("No awareness actions found for year " + yearId));
        return mapToYearDetail(ay);
    }

    private AwarenessResponse mapToSingletonResponse(Awareness awareness) {
        List<AwarenessYearDetail> yearDetails = awareness.getYears() != null
                ? awareness.getYears().stream()
                .map(this::mapToYearDetail)
                .toList()
                : List.of();

        return new AwarenessResponse(
                awareness.getId(),
                awareness.getDescription(),
                yearDetails
        );
    }

    private AwarenessYearDetail mapToYearDetail(AwarenessYear ay) {
        List<DocumentWithVersionsResponse> documents = ay.getDocuments() != null
                ? ay.getDocuments().stream()
                .map(doc -> documentService.getDocumentWithVersions(doc.getId()))
                .toList()
                : List.of();

        return new AwarenessYearDetail(
                ay.getId(),
                ay.getYear().getId(),
                ay.getYear().getYear(),
                documents
        );
    }
}