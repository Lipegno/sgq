package com.rodrigommfreitas.coreservice.qualityobjective;

import com.fasterxml.jackson.databind.JsonNode;
import com.rodrigommfreitas.coreservice.indicator.IndicatorYear;
import com.rodrigommfreitas.coreservice.indicator.IndicatorYearRepository;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
import com.rodrigommfreitas.coreservice.measurement.dto.MeasurementResponse;
import com.rodrigommfreitas.coreservice.process.ProcessYear;
import com.rodrigommfreitas.coreservice.process.ProcessYearRepository;
import com.rodrigommfreitas.coreservice.process.dto.ProcessOptionResponse;
import com.rodrigommfreitas.coreservice.qualityobjective.dto.*;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import com.rodrigommfreitas.coreservice.user.Role;
import com.rodrigommfreitas.coreservice.user.User;
import com.rodrigommfreitas.coreservice.user.UserReferenceService;
import com.rodrigommfreitas.coreservice.user.UserRepository;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import com.rodrigommfreitas.coreservice.year.dto.YearOption;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QualityObjectiveService {

    private final QualityObjectiveRepository repository;
    private final QualityObjectiveYearRepository yearRepository;
    private final YearRepository yearRepo;
    private final ProcessYearRepository processYearRepository;
    private final IndicatorYearRepository indicatorYearRepository;
    private final UserRepository userRepository;
    private final UserReferenceService userRefService;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    @Transactional
    public void create(CreateQualityObjectiveRequest request) {

        QualityObjective qualityObjective = QualityObjective.builder()
                .objectiveTitle(request.objectiveTitle())
                .description(request.description())
                .responsible(request.responsibleId() != null
                        ? userRepository.findById(request.responsibleId()).orElse(null)
                        : null)
                .build();

        repository.save(qualityObjective);

        Year firstYear = yearRepo.findById(request.yearIds().iterator().next())
                .orElseThrow(() -> new RuntimeException("Year not found"));

        Set<ProcessYear> processes = new HashSet<>();
        Set<IndicatorYear> indicators = new HashSet<>();

        if (request.processYearIds() != null) {
            for (Long processYearId : request.processYearIds()) {
                ProcessYear py = processYearRepository.findById(processYearId)
                        .orElseThrow(() -> new RuntimeException("ProcessYear not found"));
                processes.add(py);
            }
        }

        if (request.indicatorYearIds() != null) {
            for (Long indicatorYearId : request.indicatorYearIds()) {
                IndicatorYear iy = indicatorYearRepository.findById(indicatorYearId)
                        .orElseThrow(() -> new RuntimeException("IndicatorYear not found"));
                indicators.add(iy);
            }
        }

        List<String> yearStrs = new ArrayList<>();
        for (Long yearId : request.yearIds()) {
            Year year = yearRepo.findById(yearId)
                    .orElseThrow(() -> new RuntimeException("Year not found"));

            QualityObjectiveYear qoy = QualityObjectiveYear.builder()
                    .qualityObjective(qualityObjective)
                    .year(year)
                    .status(request.status() != null ? request.status() : QualityObjectiveStatus.IN_PROGRESS)
                    .processes(new HashSet<>())
                    .indicators(new HashSet<>())
                    .build();

            yearRepository.save(qoy);
            qualityObjective.getYears().add(qoy);
            yearStrs.add(String.valueOf(year.getYear()));
        }

        QualityObjectiveYear firstYearQoy = yearRepository
                .findByQualityObjectiveIdAndYearId(qualityObjective.getId(), firstYear.getId())
                .orElseThrow(() -> new RuntimeException("QualityObjectiveYear not found"));

        for (ProcessYear py : processes) {
            if (py.getYear().getId().equals(firstYear.getId())) {
                firstYearQoy.getProcesses().add(py);
                py.getQualityObjectives().add(firstYearQoy);
            }
        }

        for (IndicatorYear iy : indicators) {
            if (iy.getYear().getId().equals(firstYear.getId())) {
                firstYearQoy.getIndicators().add(iy);
                iy.getQualityObjectives().add(firstYearQoy);
            }
        }

        yearRepository.save(firstYearQoy);

        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("objectiveTitle", qualityObjective.getObjectiveTitle() != null ? qualityObjective.getObjectiveTitle() : "");
        fields.put("description", qualityObjective.getDescription() != null ? qualityObjective.getDescription() : "");
        fields.put("responsible", qualityObjective.getResponsible() != null ? userDisplayName(qualityObjective.getResponsible()) : "");
        fields.put("status", request.status() != null ? request.status().name() : QualityObjectiveStatus.IN_PROGRESS.name());
        fields.put("year", String.join(", ", yearStrs));
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.QUALITY_OBJECTIVE,
                qualityObjective.getId(),
                null,
                null,
                qualityObjective.getObjectiveTitle() != null ? qualityObjective.getObjectiveTitle() : "Objetivo de Qualidade",
                ActionType.CREATED,
                logDetailsBuilder.buildCreated(fields)
        ));
    }

    @Transactional
    public void update(Long id, UpdateQualityObjectiveRequest request) {

        QualityObjective qualityObjective = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("QualityObjective not found"));

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("objectiveTitle", qualityObjective.getObjectiveTitle() != null ? qualityObjective.getObjectiveTitle() : "");
        oldFields.put("description", qualityObjective.getDescription() != null ? qualityObjective.getDescription() : "");
        oldFields.put("responsible", qualityObjective.getResponsible() != null ? userDisplayName(qualityObjective.getResponsible()) : "");

        if (request.objectiveTitle() != null) qualityObjective.setObjectiveTitle(request.objectiveTitle());
        if (request.description() != null) qualityObjective.setDescription(request.description());
        if (request.responsibleId() != null) qualityObjective.setResponsible(
                userRepository.findById(request.responsibleId()).orElse(null));

        repository.save(qualityObjective);

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("objectiveTitle", qualityObjective.getObjectiveTitle() != null ? qualityObjective.getObjectiveTitle() : "");
        newFields.put("description", qualityObjective.getDescription() != null ? qualityObjective.getDescription() : "");
        newFields.put("responsible", qualityObjective.getResponsible() != null ? userDisplayName(qualityObjective.getResponsible()) : "");

        boolean baseChanged = !oldFields.equals(newFields);

        boolean yearFieldsChanged = false;
        if (request.yearId() != null && request.status() != null) {
            QualityObjectiveYear qoy = yearRepository
                    .findByQualityObjectiveIdAndYearId(id, request.yearId())
                    .orElseThrow(() -> new RuntimeException("QualityObjectiveYear not found"));
            qoy.setStatus(request.status());
            yearRepository.save(qoy);
            yearFieldsChanged = true;
        }

        if (request.yearId() != null && request.processYearIds() != null) {
            QualityObjectiveYear qoy = yearRepository
                    .findByQualityObjectiveIdAndYearId(id, request.yearId())
                    .orElseThrow(() -> new RuntimeException("QualityObjectiveYear not found"));
            for (ProcessYear py : new HashSet<>(qoy.getProcesses())) {
                py.getQualityObjectives().remove(qoy);
            }
            qoy.getProcesses().clear();
            for (Long processYearId : request.processYearIds()) {
                ProcessYear py = processYearRepository.findById(processYearId)
                        .orElseThrow(() -> new RuntimeException("ProcessYear not found"));
                if (!py.getYear().getId().equals(request.yearId())) {
                    throw new RuntimeException("Process must belong to the same year");
                }
                qoy.getProcesses().add(py);
                py.getQualityObjectives().add(qoy);
            }
            yearRepository.save(qoy);
        }

        if (request.yearId() != null && request.indicatorYearIds() != null) {
            QualityObjectiveYear qoy = yearRepository
                    .findByQualityObjectiveIdAndYearId(id, request.yearId())
                    .orElseThrow(() -> new RuntimeException("QualityObjectiveYear not found"));
            for (IndicatorYear iy : new HashSet<>(qoy.getIndicators())) {
                iy.getQualityObjectives().remove(qoy);
            }
            qoy.getIndicators().clear();
            for (Long indicatorYearId : request.indicatorYearIds()) {
                IndicatorYear iy = indicatorYearRepository.findById(indicatorYearId)
                        .orElseThrow(() -> new RuntimeException("IndicatorYear not found"));
                if (!iy.getYear().getId().equals(request.yearId())) {
                    throw new RuntimeException("Indicator must belong to the same year");
                }
                qoy.getIndicators().add(iy);
                iy.getQualityObjectives().add(qoy);
            }
            yearRepository.save(qoy);
        }

        if (baseChanged || yearFieldsChanged) {
            Long userId = UserContextHolder.getUserId();
            if (baseChanged) {
                logService.createLog(new CreateLogRequest(
                        userId,
                        EntityType.QUALITY_OBJECTIVE,
                        id,
                        null,
                        null,
                        qualityObjective.getObjectiveTitle() != null ? qualityObjective.getObjectiveTitle() : "Objetivo de Qualidade",
                        ActionType.UPDATED,
                        logDetailsBuilder.buildUpdated(oldFields, newFields)
                ));
            }
        }
    }

    @Transactional
    public void deleteAll(Long id) {
        QualityObjective qo = repository.findById(id).orElse(null);
        if (qo != null) {
            Long userId = UserContextHolder.getUserId();
            Map<String, Object> fields = Map.of("objectiveTitle", qo.getObjectiveTitle() != null ? qo.getObjectiveTitle() : "");
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.QUALITY_OBJECTIVE,
                    id,
                    null,
                    null,
                    qo.getObjectiveTitle() != null ? qo.getObjectiveTitle() : "Objetivo de Qualidade",
                    ActionType.DELETED,
                    logDetailsBuilder.buildDeleted(fields)
            ));
        }
        repository.deleteById(id);
    }

    @Transactional
    public void deleteFromYear(Long id, Long yearId) {
        QualityObjectiveYear qoy = yearRepository
                .findByQualityObjectiveIdAndYearId(id, yearId)
                .orElseThrow(() -> new RuntimeException("Relation not found"));

        String yearValue = qoy.getYear() != null ? String.valueOf(qoy.getYear().getYear()) : String.valueOf(yearId);

        for (ProcessYear py : qoy.getProcesses()) {
            py.getQualityObjectives().remove(qoy);
        }
        for (IndicatorYear iy : qoy.getIndicators()) {
            iy.getQualityObjectives().remove(qoy);
        }

        QualityObjective qualityObjective = qoy.getQualityObjective();
        String entityName = qualityObjective.getObjectiveTitle() != null ? qualityObjective.getObjectiveTitle() : "Objetivo de Qualidade";

        qualityObjective.getYears().remove(qoy);
        yearRepository.delete(qoy);

        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.QUALITY_OBJECTIVE,
                id,
                null,
                yearId,
entityName + " — " + yearValue,
                        ActionType.DISASSOCIATED,
                logDetailsBuilder.buildAssociation("year", yearValue, "disassociated")
        ));

        if (qualityObjective.getYears().isEmpty()) {
            repository.delete(qualityObjective);
        }
    }

    @Transactional
    public void associateYears(Long id, AssociateYearsRequest request) {

        QualityObjective qualityObjective = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("QualityObjective not found"));

        String entityName = qualityObjective.getObjectiveTitle() != null ? qualityObjective.getObjectiveTitle() : "Objetivo de Qualidade";

        for (Long yearId : request.yearIds()) {

            boolean exists = yearRepository.existsByQualityObjectiveIdAndYearId(id, yearId);
            if (exists) continue;

            Year year = yearRepo.findById(yearId)
                    .orElseThrow(() -> new RuntimeException("Year not found"));

            QualityObjectiveYear sourceQoy = qualityObjective.getYears().stream().findFirst()
                    .orElseThrow(() -> new RuntimeException("No existing year found"));

            QualityObjectiveYear newQoy = QualityObjectiveYear.builder()
                    .qualityObjective(qualityObjective)
                    .year(year)
                    .status(sourceQoy.getStatus())
                    .processes(new HashSet<>())
                    .indicators(new HashSet<>())
                    .build();

            yearRepository.save(newQoy);
            qualityObjective.getYears().add(newQoy);

            if (request.copyProcessesAndIndicators()) {
                for (ProcessYear sourcePy : sourceQoy.getProcesses()) {
                    ProcessYear targetPy = processYearRepository
                            .findByProcessIdAndYearId(sourcePy.getProcess().getId(), year.getId())
                            .orElseGet(() -> processYearRepository.save(
                                    ProcessYear.builder()
                                            .process(sourcePy.getProcess())
                                            .year(year)
                                            .qualityObjectives(new HashSet<>())
                                            .build()
                            ));
                    newQoy.getProcesses().add(targetPy);
                    targetPy.getQualityObjectives().add(newQoy);
                }
                for (IndicatorYear sourceIy : sourceQoy.getIndicators()) {
                    IndicatorYear targetIy = indicatorYearRepository
                            .findByIndicatorIdAndYearId(sourceIy.getIndicator().getId(), year.getId())
                            .orElseGet(() -> indicatorYearRepository.save(
                                    IndicatorYear.builder()
                                            .indicator(sourceIy.getIndicator())
                                            .year(year)
                                            .goal(sourceIy.getGoal())
                                            .qualityObjectives(new HashSet<>())
                                            .build()
                            ));
                    newQoy.getIndicators().add(targetIy);
                    targetIy.getQualityObjectives().add(newQoy);
                }
                yearRepository.save(newQoy);
            }

            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.QUALITY_OBJECTIVE,
                    id,
                    newQoy.getId(),
                    yearId,
entityName + " — " + String.valueOf(year.getYear()),
                        ActionType.ASSOCIATED,
                    logDetailsBuilder.buildAssociation("year", String.valueOf(year.getYear()), "associated")
            ));
        }
    }

    @Transactional(readOnly = true)
    public List<QualityObjectiveResponse> getByYear(Long yearId) {

        List<QualityObjectiveYear> list = yearRepository.findAllByYearId(yearId);

        return list.stream()
                .map(this::mapToResponse)
                .toList();
    }

    private QualityObjectiveResponse mapToResponse(QualityObjectiveYear qoy) {

        QualityObjective qo = qoy.getQualityObjective();

        List<YearOption> years = qo.getYears() != null
                ? qo.getYears().stream()
                .map(y -> new YearOption(
                        y.getYear().getId(),
                        y.getYear().getYear(),
                        y.getYear().getId().equals(qoy.getYear().getId())
                ))
                .toList()
                : List.of();

        List<ProcessOptionResponse> processes = qoy.getProcesses().stream()
                .map(py -> new ProcessOptionResponse(
                        py.getId(),
                        py.getProcess().getId(),
                        py.getProcess().getName(),
                        py.getMacroProcessYear() != null ? py.getMacroProcessYear().getMacroProcess().getName() : null
                ))
                .toList();

        List<QualityObjectiveIndicatorResponse> indicators = qoy.getIndicators().stream()
                .map(this::mapToIndicatorResponse)
                .toList();

        return new QualityObjectiveResponse(
                qo.getId(),
                qoy.getId(),
                qo.getObjectiveTitle(),
                qo.getDescription(),
                userRefService.fromEntity(qo.getResponsible()),
                qoy.getYear().getId(),
                qoy.getYear().getYear(),
                qoy.getStatus(),
                years,
                processes,
                indicators
        );
    }

    private QualityObjectiveIndicatorResponse mapToIndicatorResponse(IndicatorYear iy) {
        List<MeasurementResponse> measurements = iy.getMeasurements().stream()
                .map(m -> new MeasurementResponse(
                        m.getId(),
                        m.getMeasurementDate(),
                        m.getMeasurementValue(),
                        m.getNotes(),
                        m.getIndicatorYear().getId()
                ))
                .toList();

        return new QualityObjectiveIndicatorResponse(
                iy.getId(),
                iy.getIndicator().getId(),
                iy.getIndicator().getName(),
                iy.getIndicator().getFormula(),
                iy.getIndicator().getFrequency(),
                iy.getIndicator().getValueType() != null ? iy.getIndicator().getValueType().name() : null,
                userRefService.fromEntity(iy.getIndicator().getResponsible()),
                iy.getIndicator().getNotes(),
                iy.getGoal(),
                measurements
        );
    }

    @Transactional
    public void associateProcesses(Long qualityObjectiveYearId, Set<Long> processIds) {
        QualityObjectiveYear qoy = yearRepository.findById(qualityObjectiveYearId)
                .orElseThrow(() -> new RuntimeException("QualityObjectiveYear not found"));

        Long currentUserId = UserContextHolder.getUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isSuperAdmin = currentUser.getRoles().contains(Role.ROLE_SUPERADMIN);
        String entityName = qoy.getQualityObjective().getObjectiveTitle() + " — " + qoy.getYear().getYear();

        for (Long processYearId : processIds) {
            ProcessYear py = processYearRepository.findById(processYearId)
                    .orElseThrow(() -> new RuntimeException("ProcessYear not found"));
            if (!py.getYear().getId().equals(qoy.getYear().getId())) {
                throw new RuntimeException("Process must belong to the same year");
            }
            boolean isResponsible = py.getProcess().getResponsibles().stream()
                    .anyMatch(r -> r.getId().equals(currentUserId));
            if (!isResponsible && !isSuperAdmin) {
                throw new RuntimeException("Apenas os responsáveis do processo podem editar associações");
            }
            if (qoy.getProcesses().add(py)) {
                py.getQualityObjectives().add(qoy);
            }

            logService.createLog(new CreateLogRequest(
                    currentUserId,
                    EntityType.QUALITY_OBJECTIVE,
                    qoy.getQualityObjective().getId(),
                    qoy.getId(),
                    qoy.getYear().getId(),
                    entityName,
                    ActionType.UPDATED,
                    logDetailsBuilder.buildAssociation("process", py.getProcess().getName(), "ASSOCIATED")
            ));
        }
        yearRepository.save(qoy);
    }

    @Transactional
    public void disassociateProcesses(Long qualityObjectiveYearId, Set<Long> processIds) {
        QualityObjectiveYear qoy = yearRepository.findById(qualityObjectiveYearId)
                .orElseThrow(() -> new RuntimeException("QualityObjectiveYear not found"));

        Long currentUserId = UserContextHolder.getUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isSuperAdmin = currentUser.getRoles().contains(Role.ROLE_SUPERADMIN);
        String entityName = qoy.getQualityObjective().getObjectiveTitle() + " — " + qoy.getYear().getYear();

        for (Long processYearId : processIds) {
            ProcessYear py = processYearRepository.findById(processYearId)
                    .orElseThrow(() -> new RuntimeException("ProcessYear not found"));
            boolean isResponsible = py.getProcess().getResponsibles().stream()
                    .anyMatch(r -> r.getId().equals(currentUserId));
            if (!isResponsible && !isSuperAdmin) {
                throw new RuntimeException("Apenas os responsáveis do processo podem editar associações");
            }
            if (qoy.getProcesses().remove(py)) {
                py.getQualityObjectives().remove(qoy);
            }

            logService.createLog(new CreateLogRequest(
                    currentUserId,
                    EntityType.QUALITY_OBJECTIVE,
                    qoy.getQualityObjective().getId(),
                    qoy.getId(),
                    qoy.getYear().getId(),
                    entityName,
                    ActionType.UPDATED,
                    logDetailsBuilder.buildAssociation("process", py.getProcess().getName(), "DISASSOCIATED")
            ));
        }
        yearRepository.save(qoy);
    }

    private String userDisplayName(User user) {
        if (user == null) return "";
        String first = user.getFirstName() != null ? user.getFirstName() : "";
        String last = user.getLastName() != null ? user.getLastName() : "";
        return (first + " " + last).trim();
    }
}