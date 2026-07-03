package com.rodrigommfreitas.coreservice.improvementopportunity;

import com.rodrigommfreitas.coreservice.department.Department;
import com.rodrigommfreitas.coreservice.department.DepartmentRepository;
import com.rodrigommfreitas.coreservice.department.dto.DepartmentResponse;
import com.rodrigommfreitas.coreservice.document.Document;
import com.rodrigommfreitas.coreservice.document.DocumentRepository;
import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;
import com.rodrigommfreitas.coreservice.improvementopportunity.dto.*;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
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
public class ImprovementOpportunityService {

    private final ImprovementOpportunityRepository ioRepository;
    private final ImprovementOpportunityYearRepository ioYearRepository;
    private final ImprovementActionRepository improvementActionRepository;
    private final YearRepository yearRepo;
    private final DocumentRepository documentRepository;
    private final DocumentService documentService;
    private final UserRepository userRepository;
    private final UserReferenceService userRefService;
    private final DepartmentRepository departmentRepository;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    @Transactional
    public ImprovementOpportunityResponse create(CreateImprovementOpportunityRequest request) {
        User responsible = request.responsibleId() != null
                ? userRepository.findById(request.responsibleId()).orElse(null)
                : null;

        Department department = request.departmentId() != null
                ? departmentRepository.findById(request.departmentId()).orElse(null)
                : null;

        ImprovementOpportunity io = ImprovementOpportunity.builder()
                .name(request.name())
                .description(request.description())
                .cause(request.cause())
                .responsible(responsible)
                .department(department)
                .origin(request.origin())
                .build();

        ioRepository.save(io);

        String yearValues = "";
        if (request.yearIds() != null) {
            List<String> yearStrs = new ArrayList<>();
            for (Long yearId : request.yearIds()) {
                boolean exists = ioYearRepository.findByImprovementOpportunityIdAndYearId(io.getId(), yearId).isPresent();
                if (exists) continue;

                Year year = yearRepo.findById(yearId)
                        .orElseThrow(() -> new EntityNotFoundException("Year not found with id " + yearId));

                ImprovementOpportunityYear ioYear = ImprovementOpportunityYear.builder()
                        .improvementOpportunity(io)
                        .year(year)
                        .status(ImprovementOpportunityStatus.OPEN)
                        .build();

                ioYearRepository.save(ioYear);
                io.getYears().add(ioYear);
                yearStrs.add(String.valueOf(year.getYear()));
            }
            yearValues = String.join(", ", yearStrs);
        }

        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("name", io.getName() != null ? io.getName() : "");
        fields.put("description", io.getDescription() != null ? io.getDescription() : "");
        fields.put("cause", io.getCause() != null ? io.getCause() : "");
        fields.put("responsible", io.getResponsible() != null ? userDisplayName(io.getResponsible()) : "");
        fields.put("department", io.getDepartment() != null ? io.getDepartment().getName() : "");
        fields.put("origin", io.getOrigin() != null ? io.getOrigin().name() : "");
        if (!yearValues.isEmpty()) {
            fields.put("year", yearValues);
        }
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.IMPROVEMENT_OPPORTUNITY,
                io.getId(),
                null,
                null,
                io.getName() != null ? io.getName() : "Oportunidade de Melhoria",
                ActionType.CREATED,
                logDetailsBuilder.buildCreated(fields)
        ));

        return mapToResponse(io);
    }

    @Transactional
    public ImprovementOpportunityResponse update(Long id, UpdateImprovementOpportunityRequest request) {
        ImprovementOpportunity io = ioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ImprovementOpportunity not found with id " + id));

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("name", io.getName() != null ? io.getName() : "");
        oldFields.put("description", io.getDescription() != null ? io.getDescription() : "");
        oldFields.put("cause", io.getCause() != null ? io.getCause() : "");
        oldFields.put("responsible", io.getResponsible() != null ? userDisplayName(io.getResponsible()) : "");
        oldFields.put("department", io.getDepartment() != null ? io.getDepartment().getName() : "");
        oldFields.put("origin", io.getOrigin() != null ? io.getOrigin().name() : "");

        if (request.name() != null) io.setName(request.name());
        if (request.description() != null) io.setDescription(request.description());
        if (request.cause() != null) io.setCause(request.cause());
        if (request.responsibleId() != null) {
            User responsible = userRepository.findById(request.responsibleId()).orElse(null);
            io.setResponsible(responsible);
        }
        if (request.departmentId() != null && request.departmentId() > 0) {
            Department department = departmentRepository.findById(request.departmentId()).orElse(null);
            io.setDepartment(department);
        } else if (request.departmentId() != null && request.departmentId() == 0) {
            io.setDepartment(null);
        }
        if (request.origin() != null) io.setOrigin(request.origin());

        ioRepository.save(io);

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("name", io.getName() != null ? io.getName() : "");
        newFields.put("description", io.getDescription() != null ? io.getDescription() : "");
        newFields.put("cause", io.getCause() != null ? io.getCause() : "");
        newFields.put("responsible", io.getResponsible() != null ? userDisplayName(io.getResponsible()) : "");
        newFields.put("department", io.getDepartment() != null ? io.getDepartment().getName() : "");
        newFields.put("origin", io.getOrigin() != null ? io.getOrigin().name() : "");

        if (!oldFields.equals(newFields)) {
            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.IMPROVEMENT_OPPORTUNITY,
                    io.getId(),
                    null,
                    null,
                    io.getName() != null ? io.getName() : "Oportunidade de Melhoria",
                    ActionType.UPDATED,
                    logDetailsBuilder.buildUpdated(oldFields, newFields)
            ));
        }

        return mapToResponse(io);
    }

    @Transactional
    public void delete(Long id) {
        ImprovementOpportunity io = ioRepository.findById(id).orElse(null);
        if (io != null) {
            Long userId = UserContextHolder.getUserId();
            Map<String, Object> fields = Map.of("name", io.getName() != null ? io.getName() : "");
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.IMPROVEMENT_OPPORTUNITY,
                    id,
                    null,
                    null,
                    io.getName() != null ? io.getName() : "Oportunidade de Melhoria",
                    ActionType.DELETED,
                    logDetailsBuilder.buildDeleted(fields)
            ));
        }
        ioRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<ImprovementOpportunityResponse> getByYear(Long yearId) {
        List<ImprovementOpportunityYear> ioYears = ioYearRepository.findAllByYearId(yearId);
        return ioYears.stream()
                .map(ioYear -> mapToResponse(ioYear.getImprovementOpportunity()))
                .toList();
    }

    // --- ImprovementOpportunityYear ---

    @Transactional
    public ImprovementOpportunityYearDetail updateYear(Long ioId, Long yearId, UpdateImprovementOpportunityYearRequest request) {
        ImprovementOpportunityYear ioYear = ioYearRepository.findByImprovementOpportunityIdAndYearId(ioId, yearId)
                .orElseThrow(() -> new EntityNotFoundException("ImprovementOpportunityYear not found for IO " + ioId + " and year " + yearId));

        Long ioyId = ioYear.getId();

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("status", ioYear.getStatus() != null ? ioYear.getStatus().name() : "");
        oldFields.put("evaluation", ioYear.getEvaluation() != null ? ioYear.getEvaluation() : "");
        oldFields.put("evaluationDescription", ioYear.getEvaluationDescription() != null ? ioYear.getEvaluationDescription() : "");

        ImprovementOpportunityStatus newStatus = request.status() != null ? request.status() : ioYear.getStatus();
        String newEvaluation = request.evaluation() != null ? request.evaluation() : ioYear.getEvaluation();
        String newEvalDesc = request.evaluationDescription() != null ? request.evaluationDescription() : ioYear.getEvaluationDescription();

        ioYearRepository.updateYearFieldsById(ioyId, newStatus, newEvaluation, newEvalDesc);

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("status", newStatus != null ? newStatus.name() : "");
        newFields.put("evaluation", newEvaluation != null ? newEvaluation : "");
        newFields.put("evaluationDescription", newEvalDesc != null ? newEvalDesc : "");

        if (!oldFields.equals(newFields)) {
            Long userId = UserContextHolder.getUserId();
            ImprovementOpportunity io = ioRepository.findById(ioId).orElse(null);
            String entityName = io != null && io.getName() != null ? io.getName() : "Oportunidade de Melhoria";
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.IMPROVEMENT_OPPORTUNITY,
                    ioId,
                    ioyId,
                    yearId,
                    entityName,
                    ActionType.UPDATED,
                    logDetailsBuilder.buildUpdated(oldFields, newFields)
            ));
        }

        ImprovementOpportunityYear updated = ioYearRepository.findByImprovementOpportunityIdAndYearId(ioId, yearId)
                .orElseThrow(() -> new EntityNotFoundException("ImprovementOpportunityYear not found after update"));

        return mapToYearDetail(updated);
    }

    @Transactional
    public ImprovementOpportunityResponse updateYears(Long ioId, UpdateImprovementOpportunityYearsRequest request) {
        ImprovementOpportunity io = ioRepository.findById(ioId)
                .orElseThrow(() -> new EntityNotFoundException("ImprovementOpportunity not found with id " + ioId));

        if (request.associateYearIds() != null) {
            for (Long yearId : request.associateYearIds()) {
                boolean exists = ioYearRepository.findByImprovementOpportunityIdAndYearId(ioId, yearId).isPresent();
                if (exists) continue;

                Year year = yearRepo.findById(yearId)
                        .orElseThrow(() -> new EntityNotFoundException("Year not found with id " + yearId));

                ImprovementOpportunityYear ioYear = ImprovementOpportunityYear.builder()
                        .improvementOpportunity(io)
                        .year(year)
                        .status(ImprovementOpportunityStatus.OPEN)
                        .build();

                ioYearRepository.save(ioYear);
                io.getYears().add(ioYear);

                Long userId = UserContextHolder.getUserId();
                logService.createLog(new CreateLogRequest(
                        userId,
                        EntityType.IMPROVEMENT_OPPORTUNITY,
                        ioId,
                        ioYear.getId(),
                        yearId,
                        (io.getName() != null ? io.getName() : "Oportunidade de Melhoria") + " — " + String.valueOf(year.getYear()),
                        ActionType.ASSOCIATED,
                        logDetailsBuilder.buildAssociation("year", String.valueOf(year.getYear()), "associated")
                ));
            }
        }

        if (request.disassociateYearIds() != null) {
            List<ImprovementOpportunityYear> toRemove = new ArrayList<>();
            for (Long yearId : request.disassociateYearIds()) {
                ImprovementOpportunityYear ioYear = ioYearRepository.findByImprovementOpportunityIdAndYearId(ioId, yearId)
                        .orElseThrow(() -> new EntityNotFoundException("ImprovementOpportunityYear not found for year " + yearId));
                toRemove.add(ioYear);
            }

            for (ImprovementOpportunityYear ioYear : toRemove) {
                String yearValue = ioYear.getYear() != null ? String.valueOf(ioYear.getYear().getYear()) : String.valueOf(ioYear.getYear().getId());

                io.getYears().remove(ioYear);
                ioYearRepository.delete(ioYear);

                Long userId = UserContextHolder.getUserId();
                logService.createLog(new CreateLogRequest(
                        userId,
                        EntityType.IMPROVEMENT_OPPORTUNITY,
                        ioId,
                        null,
                        ioYear.getYear() != null ? ioYear.getYear().getId() : null,
                        (io.getName() != null ? io.getName() : "Oportunidade de Melhoria") + " — " + yearValue,
                        ActionType.DISASSOCIATED,
                        logDetailsBuilder.buildAssociation("year", yearValue, "disassociated")
                ));
            }

            if (io.getYears().isEmpty()) {
                ioRepository.delete(io);
                return null;
            }
        }

        ioRepository.save(io);
        return mapToResponse(io);
    }

    // --- Improvement Actions ---

    @Transactional
    public ImprovementActionResponse createImprovementAction(Long ioId, CreateImprovementActionRequest request) {
        ImprovementOpportunity io = ioRepository.findById(ioId)
                .orElseThrow(() -> new EntityNotFoundException("ImprovementOpportunity not found with id " + ioId));

        User responsible = request.responsibleId() != null
                ? userRepository.findById(request.responsibleId()).orElse(null)
                : null;

        ImprovementAction action = ImprovementAction.builder()
                .name(request.name())
                .description(request.description())
                .responsible(responsible)
                .status(ImprovementActionStatus.REGISTERED)
                .improvementOpportunity(io)
                .build();

        improvementActionRepository.save(action);
        io.getImprovementActions().add(action);

        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("name", action.getName() != null ? action.getName() : "");
        fields.put("description", action.getDescription() != null ? action.getDescription() : "");
        fields.put("responsible", action.getResponsible() != null ? userDisplayName(action.getResponsible()) : "");
        fields.put("status", action.getStatus() != null ? action.getStatus().name() : "");
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.IMPROVEMENT_ACTION,
                action.getId(),
                null,
                null,
                action.getName() != null ? action.getName() : "Ação de Melhoria",
                ActionType.CREATED,
                logDetailsBuilder.buildCreated(fields)
        ));

        return mapToActionResponse(action);
    }

    @Transactional
    public ImprovementActionResponse updateImprovementAction(Long ioId, Long actionId, UpdateImprovementActionRequest request) {
        ImprovementAction action = improvementActionRepository.findById(actionId)
                .orElseThrow(() -> new EntityNotFoundException("ImprovementAction not found with id " + actionId));

        if (!action.getImprovementOpportunity().getId().equals(ioId)) {
            throw new RuntimeException("ImprovementAction does not belong to ImprovementOpportunity " + ioId);
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

        improvementActionRepository.save(action);

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
                    EntityType.IMPROVEMENT_ACTION,
                    action.getId(),
                    null,
                    null,
                    action.getName() != null ? action.getName() : "Ação de Melhoria",
                    ActionType.UPDATED,
                    logDetailsBuilder.buildUpdated(oldFields, newFields)
            ));
        }

        return mapToActionResponse(action);
    }

    @Transactional
    public void deleteImprovementAction(Long ioId, Long actionId) {
        ImprovementAction action = improvementActionRepository.findById(actionId)
                .orElseThrow(() -> new EntityNotFoundException("ImprovementAction not found with id " + actionId));

        if (!action.getImprovementOpportunity().getId().equals(ioId)) {
            throw new RuntimeException("ImprovementAction does not belong to ImprovementOpportunity " + ioId);
        }

        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = Map.of("name", action.getName() != null ? action.getName() : "");
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.IMPROVEMENT_ACTION,
                actionId,
                null,
                null,
                action.getName() != null ? action.getName() : "Ação de Melhoria",
                ActionType.DELETED,
                logDetailsBuilder.buildDeleted(fields)
        ));

        ImprovementOpportunity io = ioRepository.findById(ioId)
                .orElseThrow(() -> new EntityNotFoundException("ImprovementOpportunity not found with id " + ioId));

        io.getImprovementActions().remove(action);
        improvementActionRepository.delete(action);
    }

    // --- Improvement Action Documents ---

    @Transactional
    public ImprovementActionResponse attachDocument(Long ioId, Long actionId, Long documentId) {
        ImprovementAction action = improvementActionRepository.findById(actionId)
                .orElseThrow(() -> new EntityNotFoundException("ImprovementAction not found with id " + actionId));

        if (!action.getImprovementOpportunity().getId().equals(ioId)) {
            throw new RuntimeException("ImprovementAction does not belong to ImprovementOpportunity " + ioId);
        }

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with id " + documentId));

        action.getDocuments().add(document);
        improvementActionRepository.save(action);

        return mapToActionResponse(action);
    }

    @Transactional
    public void removeDocument(Long ioId, Long actionId, Long documentId) {
        ImprovementAction action = improvementActionRepository.findById(actionId)
                .orElseThrow(() -> new EntityNotFoundException("ImprovementAction not found with id " + actionId));

        if (!action.getImprovementOpportunity().getId().equals(ioId)) {
            throw new RuntimeException("ImprovementAction does not belong to ImprovementOpportunity " + ioId);
        }

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with id " + documentId));

        action.getDocuments().remove(document);
        improvementActionRepository.save(action);

        documentService.deleteDocument(documentId);
    }

    // --- Mapping methods ---

    private ImprovementOpportunityResponse mapToResponse(ImprovementOpportunity io) {
        List<ImprovementOpportunityYearDetail> years = io.getYears() != null
                ? io.getYears().stream()
                .map(this::mapToYearDetail)
                .toList()
                : List.of();

        List<ImprovementActionResponse> actions = io.getImprovementActions() != null
                ? io.getImprovementActions().stream()
                .map(this::mapToActionResponse)
                .toList()
                : List.of();

        DepartmentResponse deptResponse = io.getDepartment() != null
                ? new DepartmentResponse(io.getDepartment().getId(), io.getDepartment().getName(), 0)
                : null;

        return new ImprovementOpportunityResponse(
                io.getId(),
                io.getName(),
                io.getDescription(),
                io.getCause(),
                userRefService.fromEntity(io.getResponsible()),
                deptResponse,
                io.getOrigin(),
                years,
                actions
        );
    }

    private ImprovementOpportunityYearDetail mapToYearDetail(ImprovementOpportunityYear ioYear) {
        return new ImprovementOpportunityYearDetail(
                ioYear.getId(),
                ioYear.getYear().getId(),
                ioYear.getYear().getYear(),
                ioYear.getStatus(),
                ioYear.getEvaluation(),
                ioYear.getEvaluationDescription()
        );
    }

    private ImprovementActionResponse mapToActionResponse(ImprovementAction action) {
        List<DocumentWithVersionsResponse> documents = action.getDocuments() != null
                ? action.getDocuments().stream()
                .map(doc -> documentService.getDocumentWithVersions(doc.getId()))
                .toList()
                : List.of();

        return new ImprovementActionResponse(
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