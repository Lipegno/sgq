package com.rodrigommfreitas.coreservice.swot;

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
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import com.rodrigommfreitas.coreservice.swot.dto.*;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SwotAnalysisService {

    private final SwotAnalysisRepository repository;
    private final SwotYearRepository swotYearRepository;
    private final SwotItemRepository swotItemRepository;
    private final YearRepository yearRepo;
    private final DocumentRepository documentRepository;
    private final DocumentService documentService;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    @Transactional(readOnly = true)
    public SwotAnalysisResponse get() {
        SwotAnalysis analysis = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("SwotAnalysis not found"));
        return mapToAnalysisResponse(analysis);
    }

    @Transactional
    public SwotAnalysisResponse update(UpdateSwotAnalysisRequest request) {
        SwotAnalysis analysis = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("SwotAnalysis not found"));

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("description", analysis.getDescription() != null ? analysis.getDescription() : "");

        if (request.description() != null) {
            analysis.setDescription(request.description());
        }

        repository.save(analysis);

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("description", analysis.getDescription() != null ? analysis.getDescription() : "");

        boolean hasChanges = !oldFields.equals(newFields);
        if (hasChanges) {
            Long userId = UserContextHolder.getUserId();
            JsonNode detailsNode = logDetailsBuilder.buildUpdated(oldFields, newFields);
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.SWOT_ANALYSIS,
                    analysis.getId(),
                    null,
                    null,
                    "Análise SWOT",
                    ActionType.UPDATED,
                    detailsNode
            ));
        }

        return mapToAnalysisResponse(analysis);
    }

    @Transactional
    public SwotAnalysisResponse attachDocument(Long documentId) {
        SwotAnalysis analysis = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("SwotAnalysis not found"));

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with id " + documentId));

        analysis.getDocuments().add(document);
        repository.save(analysis);

        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.SWOT_ANALYSIS,
                analysis.getId(),
                null,
                null,
                "Análise SWOT",
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("document", document.getCurrentVersion() != null
                        ? document.getCurrentVersion().getFileName()
                        : "Documento", "ASSOCIATED")
        ));

        return mapToAnalysisResponse(analysis);
    }

    @Transactional
    public void removeDocument(Long documentId) {
        SwotAnalysis analysis = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("SwotAnalysis not found"));

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with id " + documentId));

        String docName = document.getCurrentVersion() != null
                ? document.getCurrentVersion().getFileName()
                : "Documento";

        analysis.getDocuments().remove(document);
        repository.save(analysis);

        documentService.deleteDocument(documentId);

        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.SWOT_ANALYSIS,
                analysis.getId(),
                null,
                null,
                "Análise SWOT",
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("document", docName, "DISASSOCIATED")
        ));
    }

    @Transactional(readOnly = true)
    public SwotYearDetail getByYear(Long yearId) {
        SwotYear swotYear = swotYearRepository.findByYearId(yearId)
                .orElseThrow(() -> new EntityNotFoundException("No SWOT analysis found for year " + yearId));
        return mapToYearDetail(swotYear);
    }

    @Transactional
    public SwotItemResponse createItem(CreateSwotItemRequest request) {
        SwotAnalysis analysis = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("SwotAnalysis not found"));

        SwotItem item = SwotItem.builder()
                .text(request.text())
                .type(request.type())
                .build();

        Set<SwotYear> swotYears = new HashSet<>();
        if (request.yearIds() != null) {
            for (Long yearId : request.yearIds()) {
                SwotYear swotYear = getOrCreateSwotYear(analysis, yearId);
                swotYears.add(swotYear);
            }
        }

        item.setSwotYears(swotYears);
        swotItemRepository.save(item);

        for (SwotYear sy : swotYears) {
            sy.getItems().add(item);
        }

        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("text", item.getText() != null ? item.getText() : "");
        fields.put("type", item.getType() != null ? item.getType().name() : "");
        if (!swotYears.isEmpty()) {
            fields.put("year", swotYears.stream()
                    .map(sy -> String.valueOf(sy.getYear().getYear()))
                    .reduce((a, b) -> a + ", " + b)
                    .orElse(""));
        }
        Long yearId = swotYears.isEmpty() ? null : swotYears.iterator().next().getYear().getId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.SWOT_ITEM,
                item.getId(),
                null,
                yearId,
                "Item SWOT #" + item.getId(),
                ActionType.CREATED,
                logDetailsBuilder.buildCreated(fields)
        ));

        return mapToItemResponse(item);
    }

    @Transactional
    public SwotItemResponse updateItem(Long itemId, UpdateSwotItemRequest request) {
        SwotItem item = swotItemRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("SwotItem not found with id " + itemId));

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("text", item.getText() != null ? item.getText() : "");

        if (request.text() != null) {
            item.setText(request.text());
        }

        swotItemRepository.save(item);

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("text", item.getText() != null ? item.getText() : "");

        boolean hasChanges = !oldFields.equals(newFields);
        if (hasChanges) {
            Long userId = UserContextHolder.getUserId();
            JsonNode detailsNode = logDetailsBuilder.buildUpdated(oldFields, newFields);
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.SWOT_ITEM,
                    item.getId(),
                    null,
                    null,
                    "Item SWOT #" + item.getId(),
                    ActionType.UPDATED,
                    detailsNode
            ));
        }

        return mapToItemResponse(item);
    }

    @Transactional
    public void deleteItem(Long itemId) {
        SwotItem item = swotItemRepository.findById(itemId).orElse(null);
        if (item != null) {
            Long userId = UserContextHolder.getUserId();
            Map<String, Object> fields = new LinkedHashMap<>();
            fields.put("text", item.getText() != null ? item.getText() : "");
            fields.put("type", item.getType() != null ? item.getType().name() : "");
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.SWOT_ITEM,
                    itemId,
                    null,
                    null,
                    item.getText() != null ? item.getText() : "Item SWOT",
                    ActionType.DELETED,
                    logDetailsBuilder.buildDeleted(fields)
            ));
        }

        SwotItem itemToDelete = swotItemRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("SwotItem not found with id " + itemId));
        for (SwotYear sy : itemToDelete.getSwotYears()) {
            sy.getItems().remove(itemToDelete);
        }
        swotItemRepository.delete(itemToDelete);
    }

    @Transactional
    public SwotItemResponse updateItemYears(Long itemId, UpdateItemYearsRequest request) {
        SwotItem item = swotItemRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("SwotItem not found with id " + itemId));

        SwotAnalysis analysis = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("SwotAnalysis not found"));

        Long userId = UserContextHolder.getUserId();
        String entityName = item.getText() != null ? item.getText() : "Item SWOT";

        if (request.associateYearIds() != null) {
            for (Long yearId : request.associateYearIds()) {
                SwotYear swotYear = getOrCreateSwotYear(analysis, yearId);
                item.getSwotYears().add(swotYear);
                swotYear.getItems().add(item);

                logService.createLog(new CreateLogRequest(
                        userId,
                        EntityType.SWOT_ITEM,
                        itemId,
                        swotYear.getId(),
                        yearId,
                        entityName + " — " + String.valueOf(swotYear.getYear().getYear()),
                        ActionType.ASSOCIATED,
                        logDetailsBuilder.buildAssociation("year", String.valueOf(swotYear.getYear().getYear()), "associated")
                ));
            }
        }

        if (request.disassociateYearIds() != null) {
            for (Long yearId : request.disassociateYearIds()) {
                SwotYear swotYear = swotYearRepository.findByYearId(yearId)
                        .orElseThrow(() -> new EntityNotFoundException("No SWOT analysis found for year " + yearId));

                String yearValue = String.valueOf(swotYear.getYear().getYear());
                item.getSwotYears().remove(swotYear);
                swotYear.getItems().remove(item);

                logService.createLog(new CreateLogRequest(
                        userId,
                        EntityType.SWOT_ITEM,
                        itemId,
                        null,
                        yearId,
                        entityName + " — " + yearValue,
                        ActionType.DISASSOCIATED,
                        logDetailsBuilder.buildAssociation("year", yearValue, "disassociated")
                ));
            }
        }

        swotItemRepository.save(item);
        return mapToItemResponse(item);
    }

    private SwotYear getOrCreateSwotYear(SwotAnalysis analysis, Long yearId) {
        return swotYearRepository.findByYearId(yearId)
                .orElseGet(() -> {
                    Year year = yearRepo.findById(yearId)
                            .orElseThrow(() -> new EntityNotFoundException("Year not found with id " + yearId));

                    SwotYear newSwotYear = SwotYear.builder()
                            .swotAnalysis(analysis)
                            .year(year)
                            .build();
                    swotYearRepository.save(newSwotYear);
                    analysis.getYears().add(newSwotYear);
                    return newSwotYear;
                });
    }

    private SwotAnalysisResponse mapToAnalysisResponse(SwotAnalysis analysis) {
        List<DocumentWithVersionsResponse> documents = analysis.getDocuments() != null
                ? analysis.getDocuments().stream()
                .map(doc -> documentService.getDocumentWithVersions(doc.getId()))
                .toList()
                : List.of();

        List<SwotYearSummary> years = analysis.getYears() != null
                ? analysis.getYears().stream()
                .map(sy -> new SwotYearSummary(
                        sy.getId(),
                        sy.getYear().getId(),
                        sy.getYear().getYear()
                ))
                .toList()
                : List.of();

        return new SwotAnalysisResponse(
                analysis.getId(),
                analysis.getDescription(),
                documents,
                years
        );
    }

    private SwotYearDetail mapToYearDetail(SwotYear swotYear) {
        List<SwotItemResponse> allItems = swotYear.getItems() != null
                ? swotYear.getItems().stream()
                .map(this::mapToItemResponse)
                .toList()
                : List.of();

        List<SwotItemResponse> strengths = allItems.stream()
                .filter(i -> i.type() == SwotItemType.STRENGTH).toList();
        List<SwotItemResponse> weaknesses = allItems.stream()
                .filter(i -> i.type() == SwotItemType.WEAKNESS).toList();
        List<SwotItemResponse> opportunities = allItems.stream()
                .filter(i -> i.type() == SwotItemType.OPPORTUNITY).toList();
        List<SwotItemResponse> threats = allItems.stream()
                .filter(i -> i.type() == SwotItemType.THREAT).toList();

        return new SwotYearDetail(
                swotYear.getId(),
                swotYear.getYear().getId(),
                swotYear.getYear().getYear(),
                strengths,
                weaknesses,
                opportunities,
                threats
        );
    }

    private SwotItemResponse mapToItemResponse(SwotItem item) {
        List<SwotYearSummary> years = item.getSwotYears() != null
                ? item.getSwotYears().stream()
                .map(sy -> new SwotYearSummary(
                        sy.getId(),
                        sy.getYear().getId(),
                        sy.getYear().getYear()
                ))
                .toList()
                : List.of();

        return new SwotItemResponse(
                item.getId(),
                item.getText(),
                item.getType(),
                years
        );
    }
}