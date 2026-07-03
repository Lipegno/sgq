package com.rodrigommfreitas.coreservice.process;

import com.fasterxml.jackson.databind.JsonNode;
import com.rodrigommfreitas.coreservice.department.Department;
import com.rodrigommfreitas.coreservice.department.DepartmentRepository;
import com.rodrigommfreitas.coreservice.department.UserDepartmentRepository;
import com.rodrigommfreitas.coreservice.department.dto.DepartmentResponse;
import com.rodrigommfreitas.coreservice.document.Document;
import com.rodrigommfreitas.coreservice.document.DocumentRepository;
import com.rodrigommfreitas.coreservice.indicator.IndicatorYear;
import com.rodrigommfreitas.coreservice.indicator.IndicatorYearRepository;
import com.rodrigommfreitas.coreservice.interestedparty.InterestedPartyYear;
import com.rodrigommfreitas.coreservice.interestedparty.InterestedPartyYearRepository;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
import com.rodrigommfreitas.coreservice.macroprocess.MacroProcessYear;
import com.rodrigommfreitas.coreservice.macroprocess.MacroProcessYearRepository;
import com.rodrigommfreitas.coreservice.process.dto.*;
import com.rodrigommfreitas.coreservice.qualityobjective.QualityObjectiveYear;
import com.rodrigommfreitas.coreservice.qualityobjective.QualityObjectiveYearRepository;
import com.rodrigommfreitas.coreservice.riskopportunity.RiskOpportunityYear;
import com.rodrigommfreitas.coreservice.riskopportunity.RiskOpportunityYearRepository;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import com.rodrigommfreitas.coreservice.user.User;
import com.rodrigommfreitas.coreservice.user.Role;
import com.rodrigommfreitas.coreservice.user.UserReferenceService;
import com.rodrigommfreitas.coreservice.user.UserRepository;
import com.rodrigommfreitas.coreservice.user.dto.UserSummary;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ProcessService {

    private final ProcessRepository processRepository;
    private final ProcessYearRepository processYearRepository;
    private final MacroProcessYearRepository macroProcessYearRepository;
    private final YearRepository yearRepository;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;
    private final UserRepository userRepository;
    private final UserReferenceService userRefService;
    private final DepartmentRepository departmentRepository;
    private final UserDepartmentRepository userDepartmentRepository;
    private final DocumentRepository documentRepository;
    private final IndicatorYearRepository indicatorYearRepository;
    private final InterestedPartyYearRepository interestedPartyYearRepository;
    private final RiskOpportunityYearRepository riskOpportunityYearRepository;
    private final QualityObjectiveYearRepository qualityObjectiveYearRepository;

    @Transactional
    public ProcessResponse createProcess(CreateProcessRequest request) {
        User currentUser = userRepository.findById(UserContextHolder.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

Set<Department> departments = new HashSet<>();
        List<Long> deptIds = request.departmentIds() != null ? request.departmentIds() : Collections.emptyList();
        if (!deptIds.isEmpty()) {
            for (Long deptId : deptIds) {
                Department dept = departmentRepository.findById(deptId)
                        .orElseThrow(() -> new RuntimeException("Department not found: " + deptId));
                departments.add(dept);
            }

            boolean isSuperAdmin = currentUser.getRoles().contains(Role.ROLE_SUPERADMIN);
            boolean userInAnyDept = userDepartmentRepository.findByUserId(currentUser.getId())
                    .stream().anyMatch(ud -> deptIds.contains(ud.getDepartment().getId()));
            if (!isSuperAdmin && !userInAnyDept) {
                throw new IllegalArgumentException("O utilizador deve pertencer a pelo menos um dos departamentos selecionados");
            }
        }

        Process process = processRepository.findAll()
                .stream()
                .filter(p -> p.getName().equals(request.name()))
                .findFirst()
                .orElseGet(() -> {
                    Process newProcess = new Process();
                    newProcess.setName(request.name());
                    newProcess.setObjective(request.objective());
                    if (request.fichaDocumentoId() != null) {
                        Document fichaDoc = documentRepository.findById(request.fichaDocumentoId())
                                .orElseThrow(() -> new RuntimeException("Document not found: " + request.fichaDocumentoId()));
                        newProcess.setFichaDocumento(fichaDoc);
                    }
                    newProcess.setDepartments(departments);
                    newProcess.setResponsibles(new HashSet<>(Set.of(currentUser)));
                    return processRepository.save(newProcess);
                });

        var year = yearRepository.findById(request.yearId())
                .orElseThrow(() -> new RuntimeException("Year not found"));

        var macroProcessYear = request.macroProcessYearId() != null
                ? macroProcessYearRepository.findById(request.macroProcessYearId())
                .orElseThrow(() -> new RuntimeException("MacroProcessYear not found"))
                : null;

        ProcessYear processYear = new ProcessYear();
        processYear.setProcess(process);
        processYear.setYear(year);
        processYear.setMacroProcessYear(macroProcessYear);

        processYearRepository.save(processYear);

        Long userId = UserContextHolder.getUserId();

        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("name", process.getName());
        fields.put("yearId", year.getYear());
        JsonNode detailsNode = logDetailsBuilder.buildCreated(fields);
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.PROCESS,
                process.getId(),
                processYear.getId(),
                year.getId(),
                process.getName(),
                ActionType.CREATED,
                detailsNode
        ));

        return mapToResponse(process);
    }

    @Transactional
    public ProcessResponse updateYears(Long processId, UpdateProcessYearsRequest request) {
        Process process = processRepository.findById(processId)
                .orElseThrow(() -> new RuntimeException("Process not found"));

        if (request.associateYearIds() != null) {
            for (Long yearId : request.associateYearIds()) {
                boolean exists = processYearRepository.findByProcessIdAndYearId(processId, yearId).isPresent();
                if (exists) continue;

                Year year = yearRepository.findById(yearId)
                        .orElseThrow(() -> new RuntimeException("Year not found"));

                ProcessYear processYear = ProcessYear.builder()
                        .process(process)
                        .year(year)
                        .build();

                processYearRepository.save(processYear);
                process.getProcessYears().add(processYear);

                Long userId = UserContextHolder.getUserId();
                logService.createLog(new CreateLogRequest(
                        userId,
                        EntityType.PROCESS,
                        processId,
                        processYear.getId(),
                        yearId,
                        process.getName() + " — " + year.getYear(),
                        ActionType.ASSOCIATED,
                        logDetailsBuilder.buildAssociation("year", String.valueOf(year.getYear()), "ASSOCIATED")
                ));
            }
        }

        if (request.disassociateYearIds() != null) {
            for (Long yearId : request.disassociateYearIds()) {
                ProcessYear processYear = processYearRepository.findByProcessIdAndYearId(processId, yearId)
                        .orElseThrow(() -> new RuntimeException("ProcessYear not found for year " + yearId));

                for (IndicatorYear iy : new HashSet<>(processYear.getIndicators())) {
                    iy.getProcesses().remove(processYear);
                    indicatorYearRepository.save(iy);
                }
                for (InterestedPartyYear ipy : new ArrayList<>(processYear.getInterestedParties())) {
                    ipy.getProcesses().remove(processYear);
                    interestedPartyYearRepository.save(ipy);
                }
                for (RiskOpportunityYear roy : new ArrayList<>(processYear.getRisks())) {
                    roy.getProcesses().remove(processYear);
                    riskOpportunityYearRepository.save(roy);
                }
                for (QualityObjectiveYear qoy : new HashSet<>(processYear.getQualityObjectives())) {
                    qoy.getProcesses().remove(processYear);
                    qualityObjectiveYearRepository.save(qoy);
                }

                processYear.setMacroProcessYear(null);

                processYearRepository.delete(processYear);
                process.getProcessYears().remove(processYear);

                Long userId = UserContextHolder.getUserId();
                Year year = yearRepository.findById(yearId)
                        .orElseThrow(() -> new RuntimeException("Year not found"));
                logService.createLog(new CreateLogRequest(
                        userId,
                        EntityType.PROCESS,
                        processId,
                        processYear.getId(),
                        yearId,
                        process.getName() + " — " + year.getYear(),
                        ActionType.DISASSOCIATED,
                        logDetailsBuilder.buildAssociation("year", String.valueOf(year.getYear()), "DISASSOCIATED")
                ));
            }
        }

        return mapToResponse(process);
    }

    @Transactional
    public ProcessResponse associateYearsFull(Long processId, List<Long> yearIds) {
        Process process = processRepository.findById(processId)
                .orElseThrow(() -> new RuntimeException("Process not found"));

        Set<ProcessYear> existingProcessYears = process.getProcessYears();
        if (existingProcessYears.isEmpty()) {
            throw new RuntimeException("O processo não tem anos existentes para copiar");
        }

        ProcessYear source = existingProcessYears.iterator().next();

        for (Long yearId : yearIds) {
            boolean exists = processYearRepository.findByProcessIdAndYearId(processId, yearId).isPresent();
            if (exists) continue;

            Year year = yearRepository.findById(yearId)
                    .orElseThrow(() -> new RuntimeException("Year not found"));

            ProcessYear newProcessYear = ProcessYear.builder()
                    .process(process)
                    .year(year)
                    .build();

            processYearRepository.save(newProcessYear);
            process.getProcessYears().add(newProcessYear);

            for (IndicatorYear sourceIY : source.getIndicators()) {
                IndicatorYear targetIY = indicatorYearRepository
                        .findByIndicatorIdAndYearId(sourceIY.getIndicator().getId(), yearId)
                        .orElseGet(() -> {
                            IndicatorYear newIY = IndicatorYear.builder()
                                    .indicator(sourceIY.getIndicator())
                                    .year(year)
                                    .goal(sourceIY.getGoal())
                                    .build();
                            return indicatorYearRepository.save(newIY);
                        });
                targetIY.getProcesses().add(newProcessYear);
                newProcessYear.getIndicators().add(targetIY);
            }

            for (InterestedPartyYear sourceIP : source.getInterestedParties()) {
                InterestedPartyYear targetIP = interestedPartyYearRepository
                        .findByInterestedPartyIdAndYearId(sourceIP.getInterestedParty().getId(), yearId);
                if (targetIP == null) {
                    targetIP = InterestedPartyYear.builder()
                            .interestedParty(sourceIP.getInterestedParty())
                            .year(year)
                            .needs(sourceIP.getNeeds())
                            .communicationAndMonitoringPlan(sourceIP.getCommunicationAndMonitoringPlan())
                            .build();
                    interestedPartyYearRepository.save(targetIP);
                }
                targetIP.getProcesses().add(newProcessYear);
                newProcessYear.getInterestedParties().add(targetIP);
            }

            for (RiskOpportunityYear sourceRisk : source.getRisks()) {
                RiskOpportunityYear targetRisk = riskOpportunityYearRepository
                        .findByRiskOpportunityIdAndYearId(sourceRisk.getRiskOpportunity().getId(), yearId)
                        .orElseGet(() -> {
                            RiskOpportunityYear newRisk = RiskOpportunityYear.builder()
                                    .riskOpportunity(sourceRisk.getRiskOpportunity())
                                    .year(year)
                                    .impact(sourceRisk.getImpact())
                                    .probability(sourceRisk.getProbability())
                                    .riskLevel(sourceRisk.getRiskLevel())
                                    .decision(sourceRisk.getDecision())
                                    .build();
                            return riskOpportunityYearRepository.save(newRisk);
                        });
                targetRisk.getProcesses().add(newProcessYear);
                newProcessYear.getRisks().add(targetRisk);
            }

            for (QualityObjectiveYear sourceQOY : source.getQualityObjectives()) {
                QualityObjectiveYear targetQOY = qualityObjectiveYearRepository
                        .findByQualityObjectiveIdAndYearId(sourceQOY.getQualityObjective().getId(), yearId)
                        .orElseGet(() -> {
                            QualityObjectiveYear newQOY = QualityObjectiveYear.builder()
                                    .qualityObjective(sourceQOY.getQualityObjective())
                                    .year(year)
                                    .build();
                            return qualityObjectiveYearRepository.save(newQOY);
                        });
                targetQOY.getProcesses().add(newProcessYear);
                newProcessYear.getQualityObjectives().add(targetQOY);
            }

            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.PROCESS,
                    processId,
                    newProcessYear.getId(),
                    yearId,
                    process.getName() + " — " + year.getYear(),
                    ActionType.ASSOCIATED,
                    logDetailsBuilder.buildAssociation("year", String.valueOf(year.getYear()), "ASSOCIATED")
            ));
        }

        return mapToResponse(process);
    }

    @Transactional
    public ProcessResponse updateProcess(Long id, UpdateProcessRequest request) {
        Process process = processRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Process not found"));

        Long currentUserId = UserContextHolder.getUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isSuperAdmin = currentUser.getRoles().contains(Role.ROLE_SUPERADMIN);
        boolean isResponsible = process.getResponsibles().stream()
                .anyMatch(r -> r.getId().equals(currentUserId));
        if (!isResponsible && !isSuperAdmin) {
            throw new RuntimeException("Apenas os responsáveis do processo podem editá-lo");
        }

        Map<String, Object> oldFields = new HashMap<>();
        Map<String, Object> newFields = new HashMap<>();

        if (request.name() != null && !request.name().equals(process.getName())) {
            oldFields.put("name", process.getName());
            newFields.put("name", request.name());
            process.setName(request.name());
        }

        if (request.objective() != null && !request.objective().equals(process.getObjective())) {
            oldFields.put("objective", process.getObjective());
            newFields.put("objective", request.objective());
            process.setObjective(request.objective());
        }

        if (request.fichaDocumentoId() != null) {
            Document fichaDoc = documentRepository.findById(request.fichaDocumentoId())
                    .orElseThrow(() -> new RuntimeException("Document not found: " + request.fichaDocumentoId()));
            oldFields.put("fichaDocumentoId", process.getFichaDocumento() != null ? process.getFichaDocumento().getId() : null);
            newFields.put("fichaDocumentoId", request.fichaDocumentoId());
            process.setFichaDocumento(fichaDoc);
        }

        if (!oldFields.isEmpty()) {
            JsonNode details = logDetailsBuilder.buildUpdated(oldFields, newFields);
            logService.createLog(new CreateLogRequest(
                    UserContextHolder.getUserId(),
                    EntityType.PROCESS,
                    process.getId(),
                    null,
                    null,
                    process.getName(),
                    ActionType.UPDATED,
                    details
            ));
        }

        return mapToResponse(process);
    }

    @Transactional
    public void addResponsible(Long processId, Long userId) {
        Process process = processRepository.findById(processId)
                .orElseThrow(() -> new RuntimeException("Process not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Long currentUserId = UserContextHolder.getUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isSuperAdmin = currentUser.getRoles().contains(Role.ROLE_SUPERADMIN);
        boolean isCurrentResponsible = process.getResponsibles().stream()
                .anyMatch(r -> r.getId().equals(currentUserId));
        if (!isCurrentResponsible && !isSuperAdmin) {
            throw new RuntimeException("Apenas os responsáveis do processo podem adicionar novos responsáveis");
        }

        Set<Long> deptIds = process.getDepartments().stream()
                .map(Department::getId)
                .collect(java.util.stream.Collectors.toSet());

        boolean userInDept = userDepartmentRepository.findByUserId(userId)
                .stream().anyMatch(ud -> deptIds.contains(ud.getDepartment().getId()));
        if (!userInDept) {
            throw new RuntimeException("O utilizador deve pertencer a um dos departamentos do processo");
        }

        process.getResponsibles().add(user);
        processRepository.save(process);

        logService.createLog(new CreateLogRequest(
                currentUserId,
                EntityType.PROCESS,
                processId,
                null,
                null,
                process.getName(),
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("responsible", user.getFirstName() + " " + user.getLastName(), "ASSOCIATED")
        ));
    }

    @Transactional
    public void removeResponsible(Long processId, Long userId) {
        Process process = processRepository.findById(processId)
                .orElseThrow(() -> new RuntimeException("Process not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Long currentUserId = UserContextHolder.getUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isSuperAdmin = currentUser.getRoles().contains(Role.ROLE_SUPERADMIN);
        boolean isCurrentResponsible = process.getResponsibles().stream()
                .anyMatch(r -> r.getId().equals(currentUserId));
        if (!isCurrentResponsible && !isSuperAdmin) {
            throw new RuntimeException("Apenas os responsáveis do processo podem remover responsáveis");
        }

        if (process.getResponsibles().size() <= 1) {
            throw new RuntimeException("O processo deve ter pelo menos um responsável");
        }

        process.getResponsibles().remove(user);
        processRepository.save(process);

        logService.createLog(new CreateLogRequest(
                currentUserId,
                EntityType.PROCESS,
                processId,
                null,
                null,
                process.getName(),
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("responsible", user.getFirstName() + " " + user.getLastName(), "DISASSOCIATED")
        ));
    }

    @Transactional
    public void addDepartment(Long processId, Long departmentId) {
        Process process = processRepository.findById(processId)
                .orElseThrow(() -> new RuntimeException("Process not found"));
        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new RuntimeException("Department not found"));

        Long currentUserId = UserContextHolder.getUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isSuperAdmin = currentUser.getRoles().contains(Role.ROLE_SUPERADMIN);
        boolean isResponsible = process.getResponsibles().stream()
                .anyMatch(r -> r.getId().equals(currentUserId));
        if (!isResponsible && !isSuperAdmin) {
            throw new RuntimeException("Apenas os responsáveis do processo podem gerir departamentos");
        }

        process.getDepartments().add(dept);
        processRepository.save(process);

        logService.createLog(new CreateLogRequest(
                currentUserId,
                EntityType.PROCESS,
                processId,
                null,
                null,
                process.getName(),
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("department", dept.getName(), "ASSOCIATED")
        ));
    }

    @Transactional
    public void removeDepartment(Long processId, Long departmentId) {
        Process process = processRepository.findById(processId)
                .orElseThrow(() -> new RuntimeException("Process not found"));
        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new RuntimeException("Department not found"));

        Long currentUserId = UserContextHolder.getUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isSuperAdmin = currentUser.getRoles().contains(Role.ROLE_SUPERADMIN);
        boolean isResponsible = process.getResponsibles().stream()
                .anyMatch(r -> r.getId().equals(currentUserId));
        if (!isResponsible && !isSuperAdmin) {
            throw new RuntimeException("Apenas os responsáveis do processo podem gerir departamentos");
        }

        process.getDepartments().remove(dept);
        processRepository.save(process);

        logService.createLog(new CreateLogRequest(
                currentUserId,
                EntityType.PROCESS,
                processId,
                null,
                null,
                process.getName(),
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("department", dept.getName(), "DISASSOCIATED")
        ));
    }

    @Transactional
    public void associateProcesses(AssociateProcessesRequest request) {
        var year = yearRepository.findById(request.yearId())
                .orElseThrow(() -> new RuntimeException("Year not found"));

        var macroProcessYear = macroProcessYearRepository
                .findById(request.macroProcessYearId())
                .orElseThrow(() -> new RuntimeException("MacroProcessYear not found"));

        for (Long processId : request.processIds()) {
            Process process = processRepository.findById(processId)
                    .orElseThrow(() -> new RuntimeException("Process not found"));

            boolean exists = processYearRepository
                    .existsByProcessIdAndYearId(processId, request.yearId());

            if (exists) {
                ProcessYear existing = processYearRepository
                        .findByProcessIdAndYearId(processId, request.yearId())
                        .orElseThrow();
                existing.setMacroProcessYear(macroProcessYear);
            } else {
                ProcessYear processYear = new ProcessYear();
                processYear.setProcess(process);
                processYear.setYear(year);
                processYear.setMacroProcessYear(macroProcessYear);
                processYearRepository.save(processYear);
            }
        }
    }

    @Transactional
    public void bulkRemoveFromMacroProcess(DisassociateProcessRequest request) {
        for (Long processYearId : request.processYearIds()) {
            ProcessYear processYear = processYearRepository.findById(processYearId)
                    .orElseThrow(() -> new RuntimeException("ProcessYear not found: " + processYearId));

            if (processYear.getMacroProcessYear() == null) {
                continue;
            }

            processYear.setMacroProcessYear(null);
            processYearRepository.save(processYear);
        }
    }

    @Transactional
    public void deleteProcessYear(Long processYearId) {
        ProcessYear processYear = processYearRepository.findById(processYearId)
                .orElseThrow(() -> new RuntimeException("ProcessYear not found: " + processYearId));

        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("name", processYear.getProcess().getName());
        fields.put("yearId", processYear.getYear().getYear());
        JsonNode detailsNode = logDetailsBuilder.buildDeleted(fields);
        logService.createLog(new CreateLogRequest(
                UserContextHolder.getUserId(),
                EntityType.PROCESS,
                processYear.getProcess().getId(),
                processYear.getId(),
                processYear.getYear().getId(),
                processYear.getProcess().getName(),
                ActionType.DELETED,
                detailsNode
        ));

        processYearRepository.delete(processYear);
    }

    @Transactional
    public void moveProcess(MoveProcessRequest request) {
        ProcessYear processYear = processYearRepository.findById(request.processYearId())
                .orElseThrow(() -> new RuntimeException("ProcessYear not found"));

        Long currentUserId = UserContextHolder.getUserId();
        String processName = processYear.getProcess().getName();

        if (request.targetMacroProcessYearId() == null) {
            MacroProcessYear currentMacro = processYear.getMacroProcessYear();
            String macroName = currentMacro != null ? currentMacro.getMacroProcess().getName() : "—";
            processYear.setMacroProcessYear(null);

            logService.createLog(new CreateLogRequest(
                    currentUserId,
                    EntityType.PROCESS,
                    processYear.getProcess().getId(),
                    processYear.getId(),
                    processYear.getYear().getId(),
                    processName,
                    ActionType.UPDATED,
                    logDetailsBuilder.buildAssociation("macroprocess", macroName, "DISASSOCIATED")
            ));
            return;
        }

        var targetMacroProcessYear = macroProcessYearRepository
                .findById(request.targetMacroProcessYearId())
                .orElseThrow(() -> new RuntimeException("Target MacroProcessYear not found"));

        if (!processYear.getYear().getId().equals(targetMacroProcessYear.getYear().getId())) {
            throw new RuntimeException("O processo e o macroprocesso devem pertencer ao mesmo ano");
        }

        processYear.setMacroProcessYear(targetMacroProcessYear);

        logService.createLog(new CreateLogRequest(
                currentUserId,
                EntityType.PROCESS,
                processYear.getProcess().getId(),
                processYear.getId(),
                processYear.getYear().getId(),
                processName,
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("macroprocess", targetMacroProcessYear.getMacroProcess().getName(), "ASSOCIATED")
        ));
    }

    public List<ProcessOptionResponse> getProcessOptionsByYear(Long yearId) {
        return processYearRepository.findByYearId(yearId)
                .stream()
                .map(py -> new ProcessOptionResponse(
                        py.getId(),
                        py.getProcess().getId(),
                        py.getProcess().getName(),
                        py.getMacroProcessYear() != null
                                ? py.getMacroProcessYear().getMacroProcess().getName()
                                : null
                ))
                .toList();
    }

    @Transactional
    public void addDocument(Long processId, Long documentId) {
        Process process = processRepository.findById(processId)
                .orElseThrow(() -> new RuntimeException("Process not found"));

        Long currentUserId = UserContextHolder.getUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isSuperAdmin = currentUser.getRoles().contains(Role.ROLE_SUPERADMIN);
        boolean isResponsible = process.getResponsibles().stream()
                .anyMatch(r -> r.getId().equals(currentUserId));
        if (!isResponsible && !isSuperAdmin) {
            throw new RuntimeException("Apenas os responsáveis do processo podem editá-lo");
        }

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        process.getDocuments().add(document);
        processRepository.save(process);
        String docName = document.getCurrentVersion() != null ? document.getCurrentVersion().getFileName() : documentId.toString();
        logService.createLog(new CreateLogRequest(
                currentUserId,
                EntityType.PROCESS,
                processId,
                null,
                null,
                process.getName(),
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("document", docName, "ASSOCIATED")
        ));
    }

    @Transactional
    public void removeDocument(Long processId, Long documentId) {
        Process process = processRepository.findById(processId)
                .orElseThrow(() -> new RuntimeException("Process not found"));

        Long currentUserId = UserContextHolder.getUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isSuperAdmin = currentUser.getRoles().contains(Role.ROLE_SUPERADMIN);
        boolean isResponsible = process.getResponsibles().stream()
                .anyMatch(r -> r.getId().equals(currentUserId));
        if (!isResponsible && !isSuperAdmin) {
            throw new RuntimeException("Apenas os responsáveis do processo podem editá-lo");
        }

        String docName = process.getDocuments().stream()
                .filter(d -> d.getId().equals(documentId))
                .findFirst()
                .map(d -> d.getCurrentVersion() != null ? d.getCurrentVersion().getFileName() : documentId.toString())
                .orElse(documentId.toString());
        process.getDocuments().removeIf(d -> d.getId().equals(documentId));
        processRepository.save(process);
        logService.createLog(new CreateLogRequest(
                currentUserId,
                EntityType.PROCESS,
                processId,
                null,
                null,
                process.getName(),
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("document", docName, "DISASSOCIATED")
        ));
    }

    @Transactional
    public void setFichaDocumento(Long processId, Long documentId) {
        Process process = processRepository.findById(processId)
                .orElseThrow(() -> new RuntimeException("Process not found"));

        Long currentUserId = UserContextHolder.getUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isSuperAdmin = currentUser.getRoles().contains(Role.ROLE_SUPERADMIN);
        boolean isResponsible = process.getResponsibles().stream()
                .anyMatch(r -> r.getId().equals(currentUserId));
        if (!isResponsible && !isSuperAdmin) {
            throw new RuntimeException("Apenas os responsáveis do processo podem editá-lo");
        }

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        process.setFichaDocumento(document);
        processRepository.save(process);
        String docName = document.getCurrentVersion() != null ? document.getCurrentVersion().getFileName() : documentId.toString();
        logService.createLog(new CreateLogRequest(
                currentUserId,
                EntityType.PROCESS,
                processId,
                null,
                null,
                process.getName(),
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("ficha", docName, "ASSOCIATED")
        ));
    }

    @Transactional
    public void addEntradasDocumento(Long processId, Long documentId) {
        Process process = processRepository.findById(processId)
                .orElseThrow(() -> new RuntimeException("Process not found"));

        Long currentUserId = UserContextHolder.getUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isSuperAdmin = currentUser.getRoles().contains(Role.ROLE_SUPERADMIN);
        boolean isResponsible = process.getResponsibles().stream()
                .anyMatch(r -> r.getId().equals(currentUserId));
        if (!isResponsible && !isSuperAdmin) {
            throw new RuntimeException("Apenas os responsáveis do processo podem editá-lo");
        }

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        process.getEntradasDocumentos().add(document);
        processRepository.save(process);
        String docName = document.getCurrentVersion() != null ? document.getCurrentVersion().getFileName() : documentId.toString();
        logService.createLog(new CreateLogRequest(
                currentUserId,
                EntityType.PROCESS,
                processId,
                null,
                null,
                process.getName(),
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("entrada", docName, "ASSOCIATED")
        ));
    }

    @Transactional
    public void removeEntradasDocumento(Long processId, Long documentId) {
        Process process = processRepository.findById(processId)
                .orElseThrow(() -> new RuntimeException("Process not found"));

        Long currentUserId = UserContextHolder.getUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isSuperAdmin = currentUser.getRoles().contains(Role.ROLE_SUPERADMIN);
        boolean isResponsible = process.getResponsibles().stream()
                .anyMatch(r -> r.getId().equals(currentUserId));
        if (!isResponsible && !isSuperAdmin) {
            throw new RuntimeException("Apenas os responsáveis do processo podem editá-lo");
        }

        String docName = process.getEntradasDocumentos().stream()
                .filter(d -> d.getId().equals(documentId))
                .findFirst()
                .map(d -> d.getCurrentVersion() != null ? d.getCurrentVersion().getFileName() : documentId.toString())
                .orElse(documentId.toString());
        process.getEntradasDocumentos().removeIf(d -> d.getId().equals(documentId));
        processRepository.save(process);
        logService.createLog(new CreateLogRequest(
                currentUserId,
                EntityType.PROCESS,
                processId,
                null,
                null,
                process.getName(),
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("entrada", docName, "DISASSOCIATED")
        ));
    }

    @Transactional
    public void addSaidasDocumento(Long processId, Long documentId) {
        Process process = processRepository.findById(processId)
                .orElseThrow(() -> new RuntimeException("Process not found"));

        Long currentUserId = UserContextHolder.getUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isSuperAdmin = currentUser.getRoles().contains(Role.ROLE_SUPERADMIN);
        boolean isResponsible = process.getResponsibles().stream()
                .anyMatch(r -> r.getId().equals(currentUserId));
        if (!isResponsible && !isSuperAdmin) {
            throw new RuntimeException("Apenas os responsáveis do processo podem editá-lo");
        }

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        process.getSaidasDocumentos().add(document);
        processRepository.save(process);
        String docName = document.getCurrentVersion() != null ? document.getCurrentVersion().getFileName() : documentId.toString();
        logService.createLog(new CreateLogRequest(
                currentUserId,
                EntityType.PROCESS,
                processId,
                null,
                null,
                process.getName(),
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("saida", docName, "ASSOCIATED")
        ));
    }

    @Transactional
    public void removeSaidasDocumento(Long processId, Long documentId) {
        Process process = processRepository.findById(processId)
                .orElseThrow(() -> new RuntimeException("Process not found"));

        Long currentUserId = UserContextHolder.getUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isSuperAdmin = currentUser.getRoles().contains(Role.ROLE_SUPERADMIN);
        boolean isResponsible = process.getResponsibles().stream()
                .anyMatch(r -> r.getId().equals(currentUserId));
        if (!isResponsible && !isSuperAdmin) {
            throw new RuntimeException("Apenas os responsáveis do processo podem editá-lo");
        }

        String docName = process.getSaidasDocumentos().stream()
                .filter(d -> d.getId().equals(documentId))
                .findFirst()
                .map(d -> d.getCurrentVersion() != null ? d.getCurrentVersion().getFileName() : documentId.toString())
                .orElse(documentId.toString());
        process.getSaidasDocumentos().removeIf(d -> d.getId().equals(documentId));
        processRepository.save(process);
        logService.createLog(new CreateLogRequest(
                currentUserId,
                EntityType.PROCESS,
                processId,
                null,
                null,
                process.getName(),
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("saida", docName, "DISASSOCIATED")
        ));
    }

    public ProcessResponse getProcessById(Long processId) {
        Process process = processRepository.findById(processId)
                .orElseThrow(() -> new RuntimeException("Process not found"));
        return mapToResponse(process);
    }

    @Transactional
    public void clearFichaDocumento(Long processId) {
        Process process = processRepository.findById(processId)
                .orElseThrow(() -> new RuntimeException("Process not found"));

        Long currentUserId = UserContextHolder.getUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isSuperAdmin = currentUser.getRoles().contains(Role.ROLE_SUPERADMIN);
        boolean isResponsible = process.getResponsibles().stream()
                .anyMatch(r -> r.getId().equals(currentUserId));
        if (!isResponsible && !isSuperAdmin) {
            throw new RuntimeException("Apenas os responsáveis do processo podem editá-lo");
        }

        String docName = process.getFichaDocumento() != null && process.getFichaDocumento().getCurrentVersion() != null
                ? process.getFichaDocumento().getCurrentVersion().getFileName()
                : "—";
        process.setFichaDocumento(null);
        processRepository.save(process);
        logService.createLog(new CreateLogRequest(
                currentUserId,
                EntityType.PROCESS,
                processId,
                null,
                null,
                process.getName(),
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("ficha", docName, "DISASSOCIATED")
        ));
    }

    private ProcessResponse mapToResponse(Process process) {
        List<UserSummary> responsibles = process.getResponsibles().stream()
                .map(userRefService::fromEntity)
                .toList();
        List<DepartmentResponse> departments = process.getDepartments().stream()
                .map(dept -> new DepartmentResponse(
                        dept.getId(),
                        dept.getName(),
                        userDepartmentRepository.findByDepartmentId(dept.getId()).size()
                ))
                .toList();
        return new ProcessResponse(
                process.getId(),
                process.getName(),
                process.getObjective(),
                process.getEntradasDocumentos().stream().map(this::mapDocSummary).toList(),
                process.getSaidasDocumentos().stream().map(this::mapDocSummary).toList(),
                mapDocSummary(process.getFichaDocumento()),
                process.getDocuments().stream().map(this::mapDocSummary).toList(),
                responsibles,
                departments,
                null
        );
    }

    private DocumentSummary mapDocSummary(com.rodrigommfreitas.coreservice.document.Document doc) {
        if (doc == null) return null;
        var cv = doc.getCurrentVersion();
        String uploadedByFullName = "";
        String uploadedAt = "";
        if (cv != null) {
            if (cv.getUploadedBy() != null) {
                uploadedByFullName = cv.getUploadedBy().getFirstName() + " " + cv.getUploadedBy().getLastName();
            }
            if (cv.getUploadedAt() != null) {
                uploadedAt = cv.getUploadedAt().toString();
            }
        }
        return new DocumentSummary(
                doc.getId(),
                cv != null ? cv.getFileName() : "",
                cv != null ? cv.getFileType() : "",
                cv != null ? cv.getFileUrl() : "",
                uploadedByFullName,
                uploadedAt
        );
    }
}
