package com.rodrigommfreitas.coreservice.riskopportunity;

import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
import com.rodrigommfreitas.coreservice.process.ProcessYear;
import com.rodrigommfreitas.coreservice.process.ProcessYearRepository;
import com.rodrigommfreitas.coreservice.process.dto.ProcessOptionResponse;
import com.rodrigommfreitas.coreservice.riskopportunity.dto.CreateRiskActionRequest;
import com.rodrigommfreitas.coreservice.riskopportunity.dto.RiskActionResponse;
import com.rodrigommfreitas.coreservice.riskopportunity.dto.RiskOpportunityCreateRequest;
import com.rodrigommfreitas.coreservice.riskopportunity.dto.RiskOpportunityGroupedResponse;
import com.rodrigommfreitas.coreservice.riskopportunity.dto.RiskOpportunityResponse;
import com.rodrigommfreitas.coreservice.riskopportunity.dto.UpdateRiskActionRequest;
import com.rodrigommfreitas.coreservice.riskopportunity.dto.UpdateRiskOpportunityRequest;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import com.rodrigommfreitas.coreservice.user.Role;
import com.rodrigommfreitas.coreservice.user.User;
import com.rodrigommfreitas.coreservice.user.UserReferenceService;
import com.rodrigommfreitas.coreservice.user.UserRepository;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import com.rodrigommfreitas.coreservice.year.dto.YearResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class RiskOpportunityService {

    private final RiskOpportunityYearRepository riskOpportunityYearRepository;
    private final RiskOpportunityRepository riskOpportunityRepository;
    private final RiskActionRepository riskActionRepository;
    private final ProcessYearRepository processYearRepository;
    private final YearRepository yearRepository;
    private final UserRepository userRepository;
    private final UserReferenceService userRefService;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    @Transactional
    public void create(RiskOpportunityCreateRequest request) {

        if (request.yearIds() == null || request.yearIds().isEmpty()) {
            throw new IllegalArgumentException("At least one year must be provided");
        }

        RiskOpportunity riskOpportunity = RiskOpportunity.builder()
                .origin(request.origin())
                .description(request.description())
                .category(request.category())
                .type(request.type())
                .build();

        riskOpportunityRepository.save(riskOpportunity);

        List<String> yearStrs = new ArrayList<>();
        for (Long yearId : request.yearIds()) {
            Year year = yearRepository.findById(yearId)
                    .orElseThrow(() -> new RuntimeException("Year not found"));
            yearStrs.add(String.valueOf(year.getYear()));

            RiskOpportunityYear riskYear = RiskOpportunityYear.builder()
                    .riskOpportunity(riskOpportunity)
                    .year(year)
                    .impact(request.impact())
                    .probability(request.probability())
                    .riskLevel(calculateRiskLevel(request.impact(), request.probability()))
                    .decision(request.decision())
                    .build();

            if (request.processYearIds() != null && !request.processYearIds().isEmpty()) {
                List<ProcessYear> processes = processYearRepository.findAllById(request.processYearIds());
                for (ProcessYear py : processes) {
                    py.getRisks().add(riskYear);
                }
                riskYear.setProcesses(processes);
            }

            riskOpportunityYearRepository.save(riskYear);
        }

        String entityName = request.type() == RiskOpportunityType.RISK ? "Risco" : "Oportunidade";
        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("description", riskOpportunity.getDescription() != null ? riskOpportunity.getDescription() : "");
        fields.put("type", riskOpportunity.getType() != null ? riskOpportunity.getType().name() : "");
        fields.put("origin", riskOpportunity.getOrigin() != null ? riskOpportunity.getOrigin() : "");
        fields.put("category", riskOpportunity.getCategory() != null ? riskOpportunity.getCategory() : "");
        fields.put("impact", request.impact() != null ? request.impact().toString() : "");
        fields.put("probability", request.probability() != null ? request.probability().toString() : "");
        fields.put("decision", request.decision() != null ? request.decision().name() : "");
        fields.put("year", String.join(", ", yearStrs));
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.RISK_OPPORTUNITY,
                riskOpportunity.getId(),
                null,
                null,
                entityName,
                ActionType.CREATED,
                logDetailsBuilder.buildCreated(fields)
        ));
    }

    @Transactional
    public void update(Long id, UpdateRiskOpportunityRequest request) {

        var riskOpportunity = riskOpportunityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RiskOpportunity not found"));

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("origin", riskOpportunity.getOrigin() != null ? riskOpportunity.getOrigin() : "");
        oldFields.put("description", riskOpportunity.getDescription() != null ? riskOpportunity.getDescription() : "");
        oldFields.put("category", riskOpportunity.getCategory() != null ? riskOpportunity.getCategory() : "");

        if (request.origin() != null) riskOpportunity.setOrigin(request.origin());
        if (request.description() != null) riskOpportunity.setDescription(request.description());
        if (request.category() != null) riskOpportunity.setCategory(request.category());

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("origin", riskOpportunity.getOrigin() != null ? riskOpportunity.getOrigin() : "");
        newFields.put("description", riskOpportunity.getDescription() != null ? riskOpportunity.getDescription() : "");
        newFields.put("category", riskOpportunity.getCategory() != null ? riskOpportunity.getCategory() : "");

        boolean baseChanged = !oldFields.equals(newFields);

        if (request.yearId() != null) {
            RiskOpportunityYear yearEntity = riskOpportunityYearRepository
                    .findByRiskOpportunityIdAndYearId(id, request.yearId())
                    .orElseThrow(() -> new RuntimeException("RiskOpportunityYear not found for year"));

            Map<String, Object> oldYearFields = new LinkedHashMap<>();
            oldYearFields.put("impact", yearEntity.getImpact() != null ? yearEntity.getImpact().toString() : "");
            oldYearFields.put("probability", yearEntity.getProbability() != null ? yearEntity.getProbability().toString() : "");
            oldYearFields.put("decision", yearEntity.getDecision() != null ? yearEntity.getDecision().name() : "");

            if (request.impact() != null) yearEntity.setImpact(request.impact());
            if (request.probability() != null) yearEntity.setProbability(request.probability());
            if (request.decision() != null) yearEntity.setDecision(request.decision());
            if (request.impact() != null || request.probability() != null) {
                yearEntity.setRiskLevel(calculateRiskLevel(yearEntity.getImpact(), yearEntity.getProbability()));
            }

            riskOpportunityYearRepository.save(yearEntity);

            Map<String, Object> newYearFields = new LinkedHashMap<>();
            newYearFields.put("impact", yearEntity.getImpact() != null ? yearEntity.getImpact().toString() : "");
            newYearFields.put("probability", yearEntity.getProbability() != null ? yearEntity.getProbability().toString() : "");
            newYearFields.put("decision", yearEntity.getDecision() != null ? yearEntity.getDecision().name() : "");

            if (!oldYearFields.equals(newYearFields)) {
                Long userId = UserContextHolder.getUserId();
                String entityName = riskOpportunity.getType() == RiskOpportunityType.RISK ? "Risco" : "Oportunidade";
                logService.createLog(new CreateLogRequest(
                        userId,
                        EntityType.RISK_OPPORTUNITY,
                        id,
                        yearEntity.getId(),
                        request.yearId(),
                        entityName,
                        ActionType.UPDATED,
                        logDetailsBuilder.buildUpdated(oldYearFields, newYearFields)
                ));
            }
        }

        riskOpportunityRepository.save(riskOpportunity);

        if (baseChanged) {
            Long userId = UserContextHolder.getUserId();
            String entityName = riskOpportunity.getType() == RiskOpportunityType.RISK ? "Risco" : "Oportunidade";
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.RISK_OPPORTUNITY,
                    id,
                    null,
                    null,
                    entityName,
                    ActionType.UPDATED,
                    logDetailsBuilder.buildUpdated(oldFields, newFields)
            ));
        }
    }

    @Transactional
    public void delete(Long id) {
        RiskOpportunity ro = riskOpportunityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RiskOpportunity not found with id " + id));

        Long userId = UserContextHolder.getUserId();
        String entityName = ro.getType() == RiskOpportunityType.RISK ? "Risco" : "Oportunidade";
        Map<String, Object> fields = Map.of("description", ro.getDescription() != null ? ro.getDescription() : "");
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.RISK_OPPORTUNITY,
                id,
                null,
                null,
                entityName,
                ActionType.DELETED,
                logDetailsBuilder.buildDeleted(fields)
        ));

        for (RiskOpportunityYear ry : new ArrayList<>(ro.getYears())) {
            for (ProcessYear py : new ArrayList<>(ry.getProcesses())) {
                py.getRisks().remove(ry);
            }
            ry.getProcesses().clear();
        }

        riskOpportunityRepository.delete(ro);
    }

    @Transactional
    public void associateYears(Set<Long> yearIds, Long id, boolean copyAttributes, boolean copyProcesses) {
        var riskOpportunity = riskOpportunityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RiskOpportunity not found"));
        String entityName = riskOpportunity.getType() == RiskOpportunityType.RISK ? "Risco" : "Oportunidade";

        RiskOpportunityYear source = null;
        if (copyAttributes && !riskOpportunity.getYears().isEmpty()) {
            source = riskOpportunity.getYears().getFirst();
        }

        for (Long yearId : yearIds) {
            Year year = yearRepository.findById(yearId)
                    .orElseThrow(() -> new RuntimeException("Year not found"));

            boolean exists = riskOpportunityYearRepository.existsByRiskOpportunityIdAndYearId(id, yearId);
            if (exists) continue;

            RiskOpportunityYear riskOpportunityYear = RiskOpportunityYear.builder()
                    .riskOpportunity(riskOpportunity)
                    .year(year)
                    .impact(copyAttributes && source != null ? source.getImpact() : null)
                    .probability(copyAttributes && source != null ? source.getProbability() : null)
                    .decision(copyAttributes && source != null ? source.getDecision() : null)
                    .build();

            riskOpportunityYear = riskOpportunityYearRepository.save(riskOpportunityYear);

            if (copyProcesses && source != null && source.getProcesses() != null) {
                for (ProcessYear sourceProcessYear : source.getProcesses()) {
                    ProcessYear targetProcessYear = processYearRepository
                            .findByProcessIdAndYearId(sourceProcessYear.getProcess().getId(), year.getId())
                            .orElseGet(() -> processYearRepository.save(
                                    ProcessYear.builder()
                                            .process(sourceProcessYear.getProcess())
                                            .year(year)
                                            .build()
                            ));
                    if (targetProcessYear.getRisks() == null) targetProcessYear.setRisks(new ArrayList<>());
                    RiskOpportunityYear finalRiskOpportunityYear = riskOpportunityYear;
                    if (targetProcessYear.getRisks().stream().noneMatch(r -> r.getId().equals(finalRiskOpportunityYear.getId()))) {
                        targetProcessYear.getRisks().add(riskOpportunityYear);
                    }
                    if (riskOpportunityYear.getProcesses() == null) riskOpportunityYear.setProcesses(new ArrayList<>());
                    if (riskOpportunityYear.getProcesses().stream().noneMatch(p -> p.getId().equals(targetProcessYear.getId()))) {
                        riskOpportunityYear.getProcesses().add(targetProcessYear);
                    }
                }
            }

            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.RISK_OPPORTUNITY,
                    id,
                    riskOpportunityYear.getId(),
                    yearId,
                    entityName + " — " + String.valueOf(year.getYear()),
                    ActionType.ASSOCIATED,
                    logDetailsBuilder.buildAssociation("year", String.valueOf(year.getYear()), "associated")
            ));
        }
    }

    @Transactional
    public void disassociateYears(Long id, Set<Long> yearIds) {
        var riskOpportunity = riskOpportunityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RiskOpportunity not found"));
        String entityName = riskOpportunity.getType() == RiskOpportunityType.RISK ? "Risco" : "Oportunidade";

        long totalYears = riskOpportunityYearRepository.countByRiskOpportunityId(id);
        if (totalYears - yearIds.size() < 1) {
            throw new IllegalArgumentException("A risk or opportunity must be associated with at least one year.");
        }

        for (Long yearId : yearIds) {
            RiskOpportunityYear riskOpportunityYear = riskOpportunityYearRepository
                    .findByRiskOpportunityIdAndYearId(id, yearId)
                    .orElseThrow(() -> new RuntimeException("RiskOpportunityYear not found"));

            String yearValue = riskOpportunityYear.getYear() != null ? String.valueOf(riskOpportunityYear.getYear().getYear()) : String.valueOf(yearId);

            for (ProcessYear py : new ArrayList<>(riskOpportunityYear.getProcesses())) {
                py.getRisks().remove(riskOpportunityYear);
            }
            riskOpportunityYear.getProcesses().clear();
            riskOpportunityYearRepository.delete(riskOpportunityYear);

            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.RISK_OPPORTUNITY,
                    id,
                    null,
                    yearId,
entityName + " — " + yearValue,
                        ActionType.DISASSOCIATED,
                    logDetailsBuilder.buildAssociation("year", yearValue, "disassociated")
            ));
        }
    }

    @Transactional
    public void associateProcesses(Set<Long> processIds, Long id) {
        RiskOpportunityYear riskOpportunityYear = riskOpportunityYearRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RiskOpportunityYear not found"));

        Long currentUserId = UserContextHolder.getUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isSuperAdmin = currentUser.getRoles().contains(Role.ROLE_SUPERADMIN);
        String typeLabel = riskOpportunityYear.getRiskOpportunity().getType() == RiskOpportunityType.RISK ? "Risco" : "Oportunidade";
        String entityName = typeLabel + " — " + riskOpportunityYear.getRiskOpportunity().getDescription() + " — " + riskOpportunityYear.getYear().getYear();

        for (Long processYearId : processIds) {
            ProcessYear processYear = processYearRepository.findById(processYearId)
                    .orElseThrow(() -> new RuntimeException("ProcessYear not found"));

            if (!processYear.getYear().getId().equals(riskOpportunityYear.getYear().getId())) {
                throw new RuntimeException("ProcessYear must belong to the same year as RiskOpportunityYear");
            }

            boolean isResponsible = processYear.getProcess().getEditors().stream()
                    .anyMatch(r -> r.getId().equals(currentUserId));
            if (!isResponsible && !isSuperAdmin) {
                throw new RuntimeException("Apenas os responsáveis do processo podem editar associações");
            }

            if (!riskOpportunityYear.getProcesses().contains(processYear)) {
                riskOpportunityYear.getProcesses().add(processYear);
                processYear.getRisks().add(riskOpportunityYear);
            }

            logService.createLog(new CreateLogRequest(
                    currentUserId,
                    EntityType.RISK_OPPORTUNITY,
                    riskOpportunityYear.getRiskOpportunity().getId(),
                    riskOpportunityYear.getId(),
                    riskOpportunityYear.getYear().getId(),
                    entityName,
                    ActionType.UPDATED,
                    logDetailsBuilder.buildAssociation("process", processYear.getProcess().getName(), "ASSOCIATED")
            ));
        }
        riskOpportunityYearRepository.save(riskOpportunityYear);
    }

    @Transactional
    public void disassociateProcesses(Long id, Set<Long> processIds) {
        RiskOpportunityYear riskOpportunityYear = riskOpportunityYearRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RiskOpportunityYear not found"));

        Long currentUserId = UserContextHolder.getUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isSuperAdmin = currentUser.getRoles().contains(Role.ROLE_SUPERADMIN);
        String typeLabel = riskOpportunityYear.getRiskOpportunity().getType() == RiskOpportunityType.RISK ? "Risco" : "Oportunidade";
        String entityName = typeLabel + " — " + riskOpportunityYear.getRiskOpportunity().getDescription() + " — " + riskOpportunityYear.getYear().getYear();

        for (Long processYearId : processIds) {
            ProcessYear processYear = processYearRepository.findById(processYearId)
                    .orElseThrow(() -> new RuntimeException("ProcessYear not found: " + processYearId));

            boolean isResponsible = processYear.getProcess().getEditors().stream()
                    .anyMatch(r -> r.getId().equals(currentUserId));
            if (!isResponsible && !isSuperAdmin) {
                throw new RuntimeException("Apenas os responsáveis do processo podem editar associações");
            }

            if (riskOpportunityYear.getProcesses().contains(processYear)) {
                riskOpportunityYear.getProcesses().remove(processYear);
                processYear.getRisks().remove(riskOpportunityYear);
            }

            logService.createLog(new CreateLogRequest(
                    currentUserId,
                    EntityType.RISK_OPPORTUNITY,
                    riskOpportunityYear.getRiskOpportunity().getId(),
                    riskOpportunityYear.getId(),
                    riskOpportunityYear.getYear().getId(),
                    entityName,
                    ActionType.UPDATED,
                    logDetailsBuilder.buildAssociation("process", processYear.getProcess().getName(), "DISASSOCIATED")
            ));
        }
        riskOpportunityYearRepository.save(riskOpportunityYear);
    }

    @Transactional(readOnly = true)
    public List<YearResponse> getAssociatedYears(Long id) {
        return riskOpportunityYearRepository.findByRiskOpportunityId(id)
                .stream()
                .map(ry -> new YearResponse(ry.getYear().getId(), ry.getYear().getYear()))
                .toList();
    }

    @Transactional(readOnly = true)
    public RiskOpportunityGroupedResponse getByYear(Long yearId) {
        List<RiskOpportunityYear> list = riskOpportunityYearRepository.findByYearId(yearId);

        List<RiskOpportunityResponse> risks = new ArrayList<>();
        List<RiskOpportunityResponse> opportunities = new ArrayList<>();

        for (RiskOpportunityYear ry : list) {
            RiskOpportunityResponse response = mapToResponse(ry);
            if (ry.getRiskOpportunity().getType() == RiskOpportunityType.RISK) {
                risks.add(response);
            } else {
                opportunities.add(response);
            }
        }

        return new RiskOpportunityGroupedResponse(risks, opportunities);
    }

    private RiskOpportunityResponse mapToResponse(RiskOpportunityYear ry) {
        RiskOpportunity ro = ry.getRiskOpportunity();
        String code = "RO-" + ro.getId();
        List<ProcessOptionResponse> processes = ry.getProcesses() != null
                ? ry.getProcesses().stream()
                .map(py -> new ProcessOptionResponse(
                        py.getId(),
                        py.getProcess().getId(),
                        py.getProcess().getName(),
                        py.getMacroProcessYear() != null ? py.getMacroProcessYear().getMacroProcess().getName() : null
                ))
                .toList()
                : List.of();

        return new RiskOpportunityResponse(
                ro.getId(),
                ry.getId(),
                code,
                ro.getType(),
                ro.getOrigin(),
                ro.getDescription(),
                ro.getCategory(),
                ry.getYear().getId(),
                ry.getYear().getYear(),
                ry.getImpact(),
                ry.getProbability(),
                ry.getRiskLevel(),
                ry.getDecision(),
                processes,
                ry.getActions() != null
                        ? ry.getActions().stream().map(this::mapToActionResponse).toList()
                        : List.of()
        );
    }

    private RiskActionResponse mapToActionResponse(RiskAction action) {
        return new RiskActionResponse(
                action.getId(),
                action.getTitle(),
                userRefService.fromEntity(action.getResponsible()),
                action.getEffectivenessEvaluationMethod(),
                action.getStatus(),
                action.getNotes(),
                action.getMonitoringQ1(),
                action.getMonitoringQ2(),
                action.getMonitoringQ3(),
                action.getMonitoringQ4()
        );
    }

    @Transactional
    public RiskActionResponse createAction(Long riskOpportunityYearId, CreateRiskActionRequest request) {
        RiskOpportunityYear riskOpportunityYear = riskOpportunityYearRepository.findById(riskOpportunityYearId)
                .orElseThrow(() -> new RuntimeException("RiskOpportunityYear not found"));

        User responsible = request.responsibleId() != null
                ? userRepository.findById(request.responsibleId()).orElse(null)
                : null;

        RiskAction action = RiskAction.builder()
                .title(request.title())
                .responsible(responsible)
                .effectivenessEvaluationMethod(request.effectivenessEvaluationMethod())
                .status(ActionStatus.OPEN)
                .riskOpportunityYear(riskOpportunityYear)
                .build();

        riskActionRepository.save(action);
        riskOpportunityYear.getActions().add(action);

        String typeLabel = riskOpportunityYear.getRiskOpportunity().getType() == RiskOpportunityType.RISK ? "Risco" : "Oportunidade";
        String entityName = typeLabel + " — " + riskOpportunityYear.getRiskOpportunity().getDescription();

        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("title", action.getTitle() != null ? action.getTitle() : "");
        fields.put("responsible", action.getResponsible() != null ? userDisplayName(action.getResponsible()) : "");
        fields.put("effectivenessEvaluationMethod", action.getEffectivenessEvaluationMethod() != null ? action.getEffectivenessEvaluationMethod() : "");
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.RISK_ACTION,
                action.getId(),
                riskOpportunityYear.getId(),
                riskOpportunityYear.getYear().getId(),
                entityName,
                ActionType.CREATED,
                logDetailsBuilder.buildCreated(fields)
        ));

        return mapToActionResponse(action);
    }

    @Transactional
    public RiskActionResponse updateAction(Long riskOpportunityYearId, Long actionId, UpdateRiskActionRequest request) {
        RiskAction action = riskActionRepository.findById(actionId)
                .orElseThrow(() -> new RuntimeException("RiskAction not found"));

        if (!action.getRiskOpportunityYear().getId().equals(riskOpportunityYearId)) {
            throw new RuntimeException("RiskAction does not belong to RiskOpportunityYear " + riskOpportunityYearId);
        }

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("title", action.getTitle() != null ? action.getTitle() : "");
        oldFields.put("responsible", action.getResponsible() != null ? userDisplayName(action.getResponsible()) : "");
        oldFields.put("effectivenessEvaluationMethod", action.getEffectivenessEvaluationMethod() != null ? action.getEffectivenessEvaluationMethod() : "");
        oldFields.put("status", action.getStatus() != null ? action.getStatus().name() : "");
        oldFields.put("notes", action.getNotes() != null ? action.getNotes() : "");
        oldFields.put("monitoringQ1", action.getMonitoringQ1() != null ? action.getMonitoringQ1() : "");
        oldFields.put("monitoringQ2", action.getMonitoringQ2() != null ? action.getMonitoringQ2() : "");
        oldFields.put("monitoringQ3", action.getMonitoringQ3() != null ? action.getMonitoringQ3() : "");
        oldFields.put("monitoringQ4", action.getMonitoringQ4() != null ? action.getMonitoringQ4() : "");

        if (request.title() != null) action.setTitle(request.title());
        if (request.responsibleId() != null) {
            User responsible = userRepository.findById(request.responsibleId()).orElse(null);
            action.setResponsible(responsible);
        }
        if (request.effectivenessEvaluationMethod() != null) action.setEffectivenessEvaluationMethod(request.effectivenessEvaluationMethod());
        if (request.status() != null) action.setStatus(request.status());
        if (request.notes() != null) action.setNotes(request.notes());
        if (request.monitoringQ1() != null) action.setMonitoringQ1(request.monitoringQ1());
        if (request.monitoringQ2() != null) action.setMonitoringQ2(request.monitoringQ2());
        if (request.monitoringQ3() != null) action.setMonitoringQ3(request.monitoringQ3());
        if (request.monitoringQ4() != null) action.setMonitoringQ4(request.monitoringQ4());

        riskActionRepository.save(action);

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("title", action.getTitle() != null ? action.getTitle() : "");
        newFields.put("responsible", action.getResponsible() != null ? userDisplayName(action.getResponsible()) : "");
        newFields.put("effectivenessEvaluationMethod", action.getEffectivenessEvaluationMethod() != null ? action.getEffectivenessEvaluationMethod() : "");
        newFields.put("status", action.getStatus() != null ? action.getStatus().name() : "");
        newFields.put("notes", action.getNotes() != null ? action.getNotes() : "");
        newFields.put("monitoringQ1", action.getMonitoringQ1() != null ? action.getMonitoringQ1() : "");
        newFields.put("monitoringQ2", action.getMonitoringQ2() != null ? action.getMonitoringQ2() : "");
        newFields.put("monitoringQ3", action.getMonitoringQ3() != null ? action.getMonitoringQ3() : "");
        newFields.put("monitoringQ4", action.getMonitoringQ4() != null ? action.getMonitoringQ4() : "");

        if (!oldFields.equals(newFields)) {
            RiskOpportunityYear riskOpportunityYear = action.getRiskOpportunityYear();
            String typeLabel = riskOpportunityYear.getRiskOpportunity().getType() == RiskOpportunityType.RISK ? "Risco" : "Oportunidade";
            String entityName = typeLabel + " — " + riskOpportunityYear.getRiskOpportunity().getDescription();
            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.RISK_ACTION,
                    action.getId(),
                    riskOpportunityYear.getId(),
                    riskOpportunityYear.getYear().getId(),
                    entityName,
                    ActionType.UPDATED,
                    logDetailsBuilder.buildUpdated(oldFields, newFields)
            ));
        }

        return mapToActionResponse(action);
    }

    @Transactional
    public void deleteAction(Long riskOpportunityYearId, Long actionId) {
        RiskAction action = riskActionRepository.findById(actionId)
                .orElseThrow(() -> new RuntimeException("RiskAction not found"));

        if (!action.getRiskOpportunityYear().getId().equals(riskOpportunityYearId)) {
            throw new RuntimeException("RiskAction does not belong to RiskOpportunityYear " + riskOpportunityYearId);
        }

        RiskOpportunityYear riskOpportunityYear = action.getRiskOpportunityYear();
        String typeLabel = riskOpportunityYear.getRiskOpportunity().getType() == RiskOpportunityType.RISK ? "Risco" : "Oportunidade";
        String entityName = typeLabel + " — " + riskOpportunityYear.getRiskOpportunity().getDescription();

        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = Map.of("title", action.getTitle() != null ? action.getTitle() : "");
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.RISK_ACTION,
                action.getId(),
                riskOpportunityYear.getId(),
                riskOpportunityYear.getYear().getId(),
                entityName,
                ActionType.DELETED,
                logDetailsBuilder.buildDeleted(fields)
        ));

        riskOpportunityYear.getActions().remove(action);
        riskActionRepository.delete(action);
    }

    private String userDisplayName(User user) {
        if (user == null) return "";
        String first = user.getFirstName() != null ? user.getFirstName() : "";
        String last = user.getLastName() != null ? user.getLastName() : "";
        return (first + " " + last).trim();
    }

    private int calculateRiskLevel(Integer impact, Integer probability) {
        if (impact == null || probability == null) return 0;
        return impact * probability;
    }
}