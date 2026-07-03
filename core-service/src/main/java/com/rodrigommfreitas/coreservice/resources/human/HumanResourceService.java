package com.rodrigommfreitas.coreservice.resources.human;

import com.fasterxml.jackson.databind.JsonNode;
import com.rodrigommfreitas.coreservice.document.Document;
import com.rodrigommfreitas.coreservice.document.DocumentRepository;
import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentResponse;
import com.rodrigommfreitas.coreservice.document.dto.UploadDocumentRequest;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
import com.rodrigommfreitas.coreservice.resources.human.dto.*;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import com.rodrigommfreitas.coreservice.year.dto.YearOption;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Service
@RequiredArgsConstructor
public class HumanResourceService {

    private final HumanResourceRepository repository;
    private final HumanResourceYearRepository yearRepository;
    private final YearRepository yearRepo;
    private final DocumentService documentService;
    private final DocumentRepository documentRepository;
    private final CompetencyRepository competencyRepository;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;


    @Transactional
    public void create(CreateHumanResourceRequest request) {

        if (request.yearIds() == null || request.yearIds().isEmpty()) {
            throw new IllegalArgumentException("At least one year must be provided");
        }

        // 🔹 Create base entity
        HumanResource hr = HumanResource.builder()
                .name(request.name())
                .function(request.function())
                .department(request.department())
                .build();

        // 🔹 Create year entities
        for (Long yearId : request.yearIds()) {

            Year year = yearRepo.findById(yearId)
                    .orElseThrow(() -> new RuntimeException("Year not found: " + yearId));

            HumanResourceYear hry = HumanResourceYear.builder()
                    .humanResource(hr)
                    .year(year)
                    .isActive(true)
                    .build();

            // initialize collections (safe)
            if (hry.getCompetencies() == null) {
                hry.setCompetencies(new ArrayList<>());
            }

            hr.getYears().add(hry);
        }

        repository.save(hr);

        Long userId = UserContextHolder.getUserId();
        for (HumanResourceYear hry : hr.getYears()) {
            Map<String, Object> fields = Map.of(
                    "name", hr.getName(),
                    "function", hr.getFunction() != null ? hr.getFunction() : "",
                    "department", hr.getDepartment() != null ? hr.getDepartment() : "",
                    "year", hry.getYear().getYear()
            );
            JsonNode detailsNode = logDetailsBuilder.buildCreated(fields);
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.HUMAN_RESOURCE,
                    hr.getId(),
                    hry.getId(),
                    hry.getYear().getId(),
                    hr.getName(),
                    ActionType.CREATED,
                    detailsNode
            ));
        }
    }

    @Transactional
    public HumanResourceResponse createCompetency(
            Long hryId,
            String name,
            String details,
            UploadDocumentRequest request,
            MultipartFile file
    ) {

        HumanResourceYear hry = yearRepository.findById(hryId)
                .orElseThrow(() -> new RuntimeException("HumanResourceYear not found"));

        Competency competency = Competency.builder()
                .name(name)
                .details(details)
                .humanResourceYear(hry)
                .build();

        competencyRepository.save(competency);

        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = Map.of("name", name, "details", details != null ? details : "");
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.COMPETENCY,
                hry.getHumanResource().getId(),
                hry.getId(),
                hry.getYear().getId(),
                name,
                ActionType.CREATED,
                logDetailsBuilder.buildCreated(fields)
        ));

        // 👉 If file exists → reuse document upload logic
        if (file != null && !file.isEmpty() && request != null) {
            uploadAndAttachDocumentInternal(competency, request, file);
        }

        return mapToResponse(hry);
    }

    @Transactional
    public HumanResourceResponse uploadAndAttachDocument(
            Long competencyId,
            UploadDocumentRequest request,
            MultipartFile file
    ) {

        Competency competency = competencyRepository.findById(competencyId)
                .orElseThrow(() -> new RuntimeException("Competency not found"));

        uploadAndAttachDocumentInternal(competency, request, file);

        return mapToResponse(competency.getHumanResourceYear());
    }

    private void uploadAndAttachDocumentInternal(
            Competency competency,
            UploadDocumentRequest request,
            MultipartFile file
    ) {

        DocumentResponse docResponse = documentService.upload(request, file);

        Document document = documentRepository.findById(docResponse.id())
                .orElseThrow(() -> new RuntimeException("Document not found"));

        competency.setDocument(document);
    }

    // =========================
    // UPDATE (PATCH)
    // =========================
    @Transactional
    public void update(Long id, UpdateHumanResourceRequest request) {

        HumanResource hr = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("HumanResource not found"));

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("name", hr.getName());
        oldFields.put("function", hr.getFunction() != null ? hr.getFunction() : "");
        oldFields.put("department", hr.getDepartment() != null ? hr.getDepartment() : "");

        if (request.name() != null) hr.setName(request.name());
        if (request.function() != null) hr.setFunction(request.function());
        if (request.department() != null) hr.setDepartment(request.department());

        Long yearId = request.yearId();
        if (yearId != null) {

            HumanResourceYear hry = yearRepository
                    .findByHumanResourceIdAndYearId(id, yearId)
                    .orElseThrow(() -> new RuntimeException("Year relation not found"));

            if (hry.isActive() != request.isActive()) {
                oldFields.put("isActive", hry.isActive());
                hry.setActive(request.isActive());
            }

            yearRepository.save(hry);
        }

        repository.save(hr);

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("name", hr.getName());
        newFields.put("function", hr.getFunction() != null ? hr.getFunction() : "");
        newFields.put("department", hr.getDepartment() != null ? hr.getDepartment() : "");
        if (yearId != null) {
            newFields.put("isActive", request.isActive());
        }

        boolean hasChanges = !oldFields.equals(newFields);
        if (hasChanges) {
            Long userId = UserContextHolder.getUserId();
            JsonNode detailsNode = logDetailsBuilder.buildUpdated(oldFields, newFields);
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.HUMAN_RESOURCE,
                    hr.getId(),
                    null,
                    yearId,
                    hr.getName(),
                    ActionType.UPDATED,
                    detailsNode
            ));
        }
    }

    @Transactional
    public void deleteAll(Long id) {
        HumanResource hr = repository.findById(id).orElse(null);
        if (hr != null) {
            Long userId = UserContextHolder.getUserId();
            Map<String, Object> fields = Map.of("name", hr.getName());
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.HUMAN_RESOURCE,
                    id,
                    null,
                    null,
                    hr.getName(),
                    ActionType.DELETED,
                    logDetailsBuilder.buildDeleted(fields)
            ));
        }
        repository.deleteById(id);
    }

    @Transactional
    public void deleteFromYear(Long humanResourceId, Long yearId) {

        HumanResourceYear hry = yearRepository
                .findByHumanResourceIdAndYearId(humanResourceId, yearId)
                .orElseThrow(() -> new RuntimeException("Relation not found"));

        HumanResource hr = hry.getHumanResource();

        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.HUMAN_RESOURCE,
                humanResourceId,
                hry.getId(),
                yearId,
hr.getName() + " — " + String.valueOf(hry.getYear().getYear()),
                        ActionType.DISASSOCIATED,
                logDetailsBuilder.buildAssociation("year", String.valueOf(hry.getYear().getYear()), "disassociated")
        ));

        hr.getYears().remove(hry); // important
        yearRepository.delete(hry);

        // optional: if no years left → delete base
        if (hr.getYears().isEmpty()) {
            repository.delete(hr);
        }
    }

    @Transactional
    public void associateYears(Long id, Set<Long> yearIds) {

        HumanResource hr = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("HumanResource not found"));

        for (Long yearId : yearIds) {

            boolean exists = yearRepository
                    .existsByHumanResourceIdAndYearId(id, yearId);

            if (exists) continue;

            Year year = yearRepo.findById(yearId)
                    .orElseThrow(() -> new RuntimeException("Year not found"));

            HumanResourceYear hry = HumanResourceYear.builder()
                    .humanResource(hr)
                    .year(year)
                    .isActive(true)
                    .build();

            yearRepository.save(hry);
            hr.getYears().add(hry);

            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.HUMAN_RESOURCE,
                    hr.getId(),
                    hry.getId(),
                    yearId,
hr.getName() + " — " + String.valueOf(year.getYear()),
                        ActionType.ASSOCIATED,
                    logDetailsBuilder.buildAssociation("year", String.valueOf(year.getYear()), "associated")
            ));
        }
    }

    @Transactional(readOnly = true)
    public List<HumanResourceResponse> getByYear(Long yearId) {

        List<HumanResourceYear> list =
                yearRepository.findAllByYearId(yearId);

        return list.stream()
                .map(this::mapToResponse)
                .toList();
    }

    private HumanResourceResponse mapToResponse(HumanResourceYear hry) {

        HumanResource hr = hry.getHumanResource();

        // 🔹 Competencies (YEAR-based)
        List<CompetencyResponse> competencies = hry.getCompetencies() != null
                ? hry.getCompetencies().stream()
                .map(c -> new CompetencyResponse(
                        c.getId(),
                        c.getName(),
                        c.getDetails(),
                        c.getDocument() != null
                                ? documentService.getDocumentWithVersions(c.getDocument().getId())
                                : null
                ))
                .toList()
                : List.of();

        // 🔹 Years (selected logic)
        List<YearOption> years = hr.getYears() != null
                ? hr.getYears().stream()
                .map(y -> new YearOption(
                        y.getYear().getId(),
                        y.getYear().getYear(),
                        y.getYear().getId().equals(hry.getYear().getId())
                ))
                .toList()
                : List.of();

        return new HumanResourceResponse(
                hr.getId(),
                hr.getName(),
                hr.getFunction(),
                hr.getDepartment(),

                competencies,

                hry.getYear().getId(),
                hry.getYear().getYear(),
                hry.isActive(),

                years,

                hry.getId()
        );
    }
}