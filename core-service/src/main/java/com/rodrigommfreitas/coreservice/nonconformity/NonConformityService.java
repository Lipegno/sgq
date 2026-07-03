package com.rodrigommfreitas.coreservice.nonconformity;

import com.fasterxml.jackson.databind.JsonNode;
import com.rodrigommfreitas.coreservice.department.Department;
import com.rodrigommfreitas.coreservice.department.DepartmentRepository;
import com.rodrigommfreitas.coreservice.department.dto.DepartmentResponse;
import com.rodrigommfreitas.coreservice.document.Document;
import com.rodrigommfreitas.coreservice.document.DocumentRepository;
import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
import com.rodrigommfreitas.coreservice.nonconformity.dto.*;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import com.rodrigommfreitas.coreservice.user.User;
import com.rodrigommfreitas.coreservice.user.UserReferenceService;
import com.rodrigommfreitas.coreservice.user.UserRepository;
import com.rodrigommfreitas.coreservice.user.dto.UserSummary;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class NonConformityService {

    private final NonConformityRepository ncRepository;
    private final NonConformityYearRepository ncYearRepository;
    private final CorrectiveActionRepository correctiveActionRepository;
    private final YearRepository yearRepo;
    private final DocumentRepository documentRepository;
    private final DocumentService documentService;
    private final UserRepository userRepository;
    private final UserReferenceService userRefService;
    private final DepartmentRepository departmentRepository;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    // --- NonConformity CRUD ---

    @Transactional
    public NonConformityResponse create(CreateNonConformityRequest request) {
        User responsible = request.responsibleId() != null
                ? userRepository.findById(request.responsibleId()).orElse(null)
                : null;

        Department department = request.departmentId() != null
                ? departmentRepository.findById(request.departmentId()).orElse(null)
                : null;

        NonConformity nc = NonConformity.builder()
                .name(request.name())
                .description(request.description())
                .cause(request.cause())
                .responsible(responsible)
                .department(department)
                .origin(request.origin())
                .build();

        ncRepository.save(nc);

        String yearValues = "";
        if (request.yearIds() != null) {
            List<String> yearStrs = new ArrayList<>();
            for (Long yearId : request.yearIds()) {
                boolean exists = ncYearRepository.findByNonConformityIdAndYearId(nc.getId(), yearId).isPresent();
                if (exists) continue;

                Year year = yearRepo.findById(yearId)
                        .orElseThrow(() -> new EntityNotFoundException("Year not found with id " + yearId));

                NonConformityYear ncYear = NonConformityYear.builder()
                        .nonConformity(nc)
                        .year(year)
                        .status(NonConformityStatus.OPEN)
                        .build();

                ncYearRepository.save(ncYear);
                nc.getYears().add(ncYear);
                yearStrs.add(String.valueOf(year.getYear()));
            }
            yearValues = String.join(", ", yearStrs);
        }

        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("name", nc.getName() != null ? nc.getName() : "");
        fields.put("description", nc.getDescription() != null ? nc.getDescription() : "");
        fields.put("cause", nc.getCause() != null ? nc.getCause() : "");
        fields.put("responsible", nc.getResponsible() != null ? userDisplayName(nc.getResponsible()) : "");
        fields.put("department", nc.getDepartment() != null ? nc.getDepartment().getName() : "");
        fields.put("origin", nc.getOrigin() != null ? nc.getOrigin().name() : "");
        if (!yearValues.isEmpty()) {
            fields.put("year", yearValues);
        }
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.NON_CONFORMITY,
                nc.getId(),
                null,
                null,
                nc.getName() != null ? nc.getName() : "Não Conformidade",
                ActionType.CREATED,
                logDetailsBuilder.buildCreated(fields)
        ));

        return mapToResponse(nc);
    }

    @Transactional
    public NonConformityResponse update(Long id, UpdateNonConformityRequest request) {
        NonConformity nc = ncRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("NonConformity not found with id " + id));

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("name", nc.getName() != null ? nc.getName() : "");
        oldFields.put("description", nc.getDescription() != null ? nc.getDescription() : "");
        oldFields.put("cause", nc.getCause() != null ? nc.getCause() : "");
        oldFields.put("responsible", nc.getResponsible() != null ? userDisplayName(nc.getResponsible()) : "");
        oldFields.put("department", nc.getDepartment() != null ? nc.getDepartment().getName() : "");
        oldFields.put("origin", nc.getOrigin() != null ? nc.getOrigin().name() : "");

        if (request.name() != null) nc.setName(request.name());
        if (request.description() != null) nc.setDescription(request.description());
        if (request.cause() != null) nc.setCause(request.cause());
        if (request.responsibleId() != null) {
            User responsible = userRepository.findById(request.responsibleId()).orElse(null);
            nc.setResponsible(responsible);
        }
        if (request.departmentId() != null && request.departmentId() > 0) {
            Department department = departmentRepository.findById(request.departmentId()).orElse(null);
            nc.setDepartment(department);
        } else if (request.departmentId() != null && request.departmentId() == 0) {
            nc.setDepartment(null);
        }
        if (request.origin() != null) nc.setOrigin(request.origin());

        ncRepository.save(nc);

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("name", nc.getName() != null ? nc.getName() : "");
        newFields.put("description", nc.getDescription() != null ? nc.getDescription() : "");
        newFields.put("cause", nc.getCause() != null ? nc.getCause() : "");
        newFields.put("responsible", nc.getResponsible() != null ? userDisplayName(nc.getResponsible()) : "");
        newFields.put("department", nc.getDepartment() != null ? nc.getDepartment().getName() : "");
        newFields.put("origin", nc.getOrigin() != null ? nc.getOrigin().name() : "");

        if (!oldFields.equals(newFields)) {
            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.NON_CONFORMITY,
                    nc.getId(),
                    null,
                    null,
                    nc.getName() != null ? nc.getName() : "Não Conformidade",
                    ActionType.UPDATED,
                    logDetailsBuilder.buildUpdated(oldFields, newFields)
            ));
        }

        return mapToResponse(nc);
    }

    @Transactional
    public void delete(Long id) {
        NonConformity nc = ncRepository.findById(id).orElse(null);
        if (nc != null) {
            Long userId = UserContextHolder.getUserId();
            Map<String, Object> fields = Map.of("name", nc.getName() != null ? nc.getName() : "");
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.NON_CONFORMITY,
                    id,
                    null,
                    null,
                    nc.getName() != null ? nc.getName() : "Não Conformidade",
                    ActionType.DELETED,
                    logDetailsBuilder.buildDeleted(fields)
            ));
        }
        ncRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<NonConformityResponse> getByYear(Long yearId) {
        List<NonConformityYear> ncYears = ncYearRepository.findAllByYearId(yearId);
        return ncYears.stream()
                .map(ncYear -> mapToResponse(ncYear.getNonConformity()))
                .toList();
    }

    // --- NonConformityYear ---

    @Transactional
    public NonConformityYearDetail updateYear(Long ncId, Long yearId, UpdateNonConformityYearRequest request) {
        NonConformityYear ncYear = ncYearRepository.findByNonConformityIdAndYearId(ncId, yearId)
                .orElseThrow(() -> new EntityNotFoundException("NonConformityYear not found for NC " + ncId + " and year " + yearId));

        Long ncyId = ncYear.getId();

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("status", ncYear.getStatus() != null ? ncYear.getStatus().name() : "");
        oldFields.put("evaluation", ncYear.getEvaluation() != null ? ncYear.getEvaluation() : "");
        oldFields.put("evaluationDescription", ncYear.getEvaluationDescription() != null ? ncYear.getEvaluationDescription() : "");

        NonConformityStatus newStatus = request.status() != null ? request.status() : ncYear.getStatus();
        String newEvaluation = request.evaluation() != null ? request.evaluation() : ncYear.getEvaluation();
        String newEvalDesc = request.evaluationDescription() != null ? request.evaluationDescription() : ncYear.getEvaluationDescription();

        ncYearRepository.updateYearFieldsById(ncyId, newStatus, newEvaluation, newEvalDesc);

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("status", newStatus != null ? newStatus.name() : "");
        newFields.put("evaluation", newEvaluation != null ? newEvaluation : "");
        newFields.put("evaluationDescription", newEvalDesc != null ? newEvalDesc : "");

        if (!oldFields.equals(newFields)) {
            Long userId = UserContextHolder.getUserId();
            NonConformity nc = ncRepository.findById(ncId).orElse(null);
            String entityName = nc != null && nc.getName() != null ? nc.getName() : "Não Conformidade";
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.NON_CONFORMITY,
                    ncId,
                    ncyId,
                    yearId,
                    entityName,
                    ActionType.UPDATED,
                    logDetailsBuilder.buildUpdated(oldFields, newFields)
            ));
        }

        NonConformityYear updated = ncYearRepository.findByNonConformityIdAndYearId(ncId, yearId)
                .orElseThrow(() -> new EntityNotFoundException("NonConformityYear not found after update"));

        return mapToYearDetail(updated);
    }

    @Transactional
    public NonConformityResponse updateYears(Long ncId, UpdateNonConformityYearsRequest request) {
        NonConformity nc = ncRepository.findById(ncId)
                .orElseThrow(() -> new EntityNotFoundException("NonConformity not found with id " + ncId));

        // Associate years
        if (request.associateYearIds() != null) {
            for (Long yearId : request.associateYearIds()) {
                boolean exists = ncYearRepository.findByNonConformityIdAndYearId(ncId, yearId).isPresent();
                if (exists) continue;

                Year year = yearRepo.findById(yearId)
                        .orElseThrow(() -> new EntityNotFoundException("Year not found with id " + yearId));

                NonConformityYear ncYear = NonConformityYear.builder()
                        .nonConformity(nc)
                        .year(year)
                        .status(NonConformityStatus.OPEN)
                        .build();

                ncYearRepository.save(ncYear);
                nc.getYears().add(ncYear);

                Long userId = UserContextHolder.getUserId();
                logService.createLog(new CreateLogRequest(
                        userId,
                        EntityType.NON_CONFORMITY,
                        ncId,
                        ncYear.getId(),
                        yearId,
                        (nc.getName() != null ? nc.getName() : "Não Conformidade") + " — " + String.valueOf(year.getYear()),
                        ActionType.ASSOCIATED,
                        logDetailsBuilder.buildAssociation("year", String.valueOf(year.getYear()), "associated")
                ));
            }
        }

        // Disassociate years
        if (request.disassociateYearIds() != null) {
            List<NonConformityYear> toRemove = new ArrayList<>();
            for (Long yearId : request.disassociateYearIds()) {
                NonConformityYear ncYear = ncYearRepository.findByNonConformityIdAndYearId(ncId, yearId)
                        .orElseThrow(() -> new EntityNotFoundException("NonConformityYear not found for year " + yearId));
                toRemove.add(ncYear);
            }

            for (NonConformityYear ncYear : toRemove) {
                String yearValue = ncYear.getYear() != null ? String.valueOf(ncYear.getYear().getYear()) : String.valueOf(ncYear.getYear().getId());

                nc.getYears().remove(ncYear);
                ncYearRepository.delete(ncYear);

                Long userId = UserContextHolder.getUserId();
                logService.createLog(new CreateLogRequest(
                        userId,
                        EntityType.NON_CONFORMITY,
                        ncId,
                        null,
                        ncYear.getYear() != null ? ncYear.getYear().getId() : null,
                        (nc.getName() != null ? nc.getName() : "Não Conformidade") + " — " + yearValue,
                        ActionType.DISASSOCIATED,
                        logDetailsBuilder.buildAssociation("year", yearValue, "disassociated")
                ));
            }

            if (nc.getYears().isEmpty()) {
                ncRepository.delete(nc);
                return null;
            }
        }

        ncRepository.save(nc);
        return mapToResponse(nc);
    }

    // --- Corrective Actions ---

    @Transactional
    public CorrectiveActionResponse createCorrectiveAction(Long ncId, CreateCorrectiveActionRequest request) {
        NonConformity nc = ncRepository.findById(ncId)
                .orElseThrow(() -> new EntityNotFoundException("NonConformity not found with id " + ncId));

        User responsible = request.responsibleId() != null
                ? userRepository.findById(request.responsibleId()).orElse(null)
                : null;

        CorrectiveAction action = CorrectiveAction.builder()
                .name(request.name())
                .description(request.description())
                .responsible(responsible)
                .status(CorrectiveActionStatus.REGISTERED)
                .nonConformity(nc)
                .build();

        correctiveActionRepository.save(action);
        nc.getCorrectiveActions().add(action);

        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("name", action.getName() != null ? action.getName() : "");
        fields.put("description", action.getDescription() != null ? action.getDescription() : "");
        fields.put("responsible", action.getResponsible() != null ? userDisplayName(action.getResponsible()) : "");
        fields.put("status", action.getStatus() != null ? action.getStatus().name() : "");
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.CORRECTIVE_ACTION,
                action.getId(),
                null,
                null,
                action.getName() != null ? action.getName() : "Ação Corretiva",
                ActionType.CREATED,
                logDetailsBuilder.buildCreated(fields)
        ));

        return mapToActionResponse(action);
    }

    @Transactional
    public CorrectiveActionResponse updateCorrectiveAction(Long ncId, Long actionId, UpdateCorrectiveActionRequest request) {
        CorrectiveAction action = correctiveActionRepository.findById(actionId)
                .orElseThrow(() -> new EntityNotFoundException("CorrectiveAction not found with id " + actionId));

        if (!action.getNonConformity().getId().equals(ncId)) {
            throw new RuntimeException("CorrectiveAction does not belong to NonConformity " + ncId);
        }

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("name", action.getName() != null ? action.getName() : "");
        oldFields.put("description", action.getDescription() != null ? action.getDescription() : "");
        oldFields.put("responsible", action.getResponsible() != null ? userDisplayName(action.getResponsible()) : "");
        oldFields.put("status", action.getStatus() != null ? action.getStatus().name() : "");
        oldFields.put("progressDescription", action.getProgressDescription() != null ? action.getProgressDescription() : "");

        if (request.name() != null) action.setName(request.name());
        if (request.description() != null) action.setDescription(request.description());
        if (request.responsibleId() != null) {
            User responsible = userRepository.findById(request.responsibleId()).orElse(null);
            action.setResponsible(responsible);
        }
        if (request.status() != null) action.setStatus(request.status());
        if (request.progressDescription() != null) action.setProgressDescription(request.progressDescription());

        correctiveActionRepository.save(action);

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("name", action.getName() != null ? action.getName() : "");
        newFields.put("description", action.getDescription() != null ? action.getDescription() : "");
        newFields.put("responsible", action.getResponsible() != null ? userDisplayName(action.getResponsible()) : "");
        newFields.put("status", action.getStatus() != null ? action.getStatus().name() : "");
        newFields.put("progressDescription", action.getProgressDescription() != null ? action.getProgressDescription() : "");

        if (!oldFields.equals(newFields)) {
            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.CORRECTIVE_ACTION,
                    action.getId(),
                    null,
                    null,
                    action.getName() != null ? action.getName() : "Ação Corretiva",
                    ActionType.UPDATED,
                    logDetailsBuilder.buildUpdated(oldFields, newFields)
            ));
        }

        return mapToActionResponse(action);
    }

    @Transactional
    public void deleteCorrectiveAction(Long ncId, Long actionId) {
        CorrectiveAction action = correctiveActionRepository.findById(actionId)
                .orElseThrow(() -> new EntityNotFoundException("CorrectiveAction not found with id " + actionId));

        if (!action.getNonConformity().getId().equals(ncId)) {
            throw new RuntimeException("CorrectiveAction does not belong to NonConformity " + ncId);
        }

        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = Map.of("name", action.getName() != null ? action.getName() : "");
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.CORRECTIVE_ACTION,
                actionId,
                null,
                null,
                action.getName() != null ? action.getName() : "Ação Corretiva",
                ActionType.DELETED,
                logDetailsBuilder.buildDeleted(fields)
        ));

        NonConformity nc = ncRepository.findById(ncId)
                .orElseThrow(() -> new EntityNotFoundException("NonConformity not found with id " + ncId));

        nc.getCorrectiveActions().remove(action);
        correctiveActionRepository.delete(action);
    }

    // --- Corrective Action Documents ---

    @Transactional
    public CorrectiveActionResponse attachDocument(Long ncId, Long actionId, Long documentId) {
        CorrectiveAction action = correctiveActionRepository.findById(actionId)
                .orElseThrow(() -> new EntityNotFoundException("CorrectiveAction not found with id " + actionId));

        if (!action.getNonConformity().getId().equals(ncId)) {
            throw new RuntimeException("CorrectiveAction does not belong to NonConformity " + ncId);
        }

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with id " + documentId));

        action.getDocuments().add(document);
        correctiveActionRepository.save(action);

        return mapToActionResponse(action);
    }

    @Transactional
    public void removeDocument(Long ncId, Long actionId, Long documentId) {
        CorrectiveAction action = correctiveActionRepository.findById(actionId)
                .orElseThrow(() -> new EntityNotFoundException("CorrectiveAction not found with id " + actionId));

        if (!action.getNonConformity().getId().equals(ncId)) {
            throw new RuntimeException("CorrectiveAction does not belong to NonConformity " + ncId);
        }

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with id " + documentId));

        action.getDocuments().remove(document);
        correctiveActionRepository.save(action);

        documentService.deleteDocument(documentId);
    }

    // --- Mapping methods ---

    private NonConformityResponse mapToResponse(NonConformity nc) {
        List<NonConformityYearDetail> years = nc.getYears() != null
                ? nc.getYears().stream()
                .map(this::mapToYearDetail)
                .toList()
                : List.of();

        List<CorrectiveActionResponse> actions = nc.getCorrectiveActions() != null
                ? nc.getCorrectiveActions().stream()
                .map(this::mapToActionResponse)
                .toList()
                : List.of();

        DepartmentResponse deptResponse = nc.getDepartment() != null
                ? new DepartmentResponse(nc.getDepartment().getId(), nc.getDepartment().getName(), 0)
                : null;

        return new NonConformityResponse(
                nc.getId(),
                nc.getName(),
                nc.getDescription(),
                nc.getCause(),
                userRefService.fromEntity(nc.getResponsible()),
                deptResponse,
                nc.getOrigin(),
                years,
                actions
        );
    }

    private NonConformityYearDetail mapToYearDetail(NonConformityYear ncYear) {
        return new NonConformityYearDetail(
                ncYear.getId(),
                ncYear.getYear().getId(),
                ncYear.getYear().getYear(),
                ncYear.getStatus(),
                ncYear.getEvaluation(),
                ncYear.getEvaluationDescription()
        );
    }

    private CorrectiveActionResponse mapToActionResponse(CorrectiveAction action) {
        List<DocumentWithVersionsResponse> documents = action.getDocuments() != null
                ? action.getDocuments().stream()
                .map(doc -> documentService.getDocumentWithVersions(doc.getId()))
                .toList()
                : List.of();

        return new CorrectiveActionResponse(
                action.getId(),
                action.getName(),
                action.getDescription(),
                userRefService.fromEntity(action.getResponsible()),
                action.getStatus(),
                action.getProgressDescription(),
                documents
        );
    }

    private String userDisplayName(User user) {
        if (user == null) return "";
        String first = user.getFirstName() != null ? user.getFirstName() : "";
        String last = user.getLastName() != null ? user.getLastName() : "";
        return (first + " " + last).trim();
    }
}