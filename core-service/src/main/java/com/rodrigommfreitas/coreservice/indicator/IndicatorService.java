package com.rodrigommfreitas.coreservice.indicator;

import com.rodrigommfreitas.coreservice.indicator.dto.*;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
import com.rodrigommfreitas.coreservice.measurement.dto.MeasurementResponse;
import com.rodrigommfreitas.coreservice.process.ProcessYear;
import com.rodrigommfreitas.coreservice.process.ProcessYearRepository;
import com.rodrigommfreitas.coreservice.process.dto.ProcessOptionResponse;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import com.rodrigommfreitas.coreservice.user.Role;
import com.rodrigommfreitas.coreservice.user.User;
import com.rodrigommfreitas.coreservice.user.UserReferenceService;
import com.rodrigommfreitas.coreservice.user.UserRepository;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class IndicatorService {

    private final IndicatorRepository indicatorRepository;
    private final IndicatorYearRepository indicatorYearRepository;
    private final YearRepository yearRepository;
    private final ProcessYearRepository processYearRepository;
    private final UserRepository userRepository;
    private final UserReferenceService userRefService;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    private String userDisplayName(User user) {
        if (user == null) return "";
        String first = user.getFirstName() != null ? user.getFirstName() : "";
        String last = user.getLastName() != null ? user.getLastName() : "";
        return (first + " " + last).trim();
    }

    @Transactional
    public IndicatorYearResponse createIndicator(CreateIndicatorRequest request) {
        Year year = yearRepository.findById(request.yearId())
                .orElseThrow(() -> new IllegalArgumentException("Year not found"));

        Indicator indicator = Indicator.builder()
                .name(request.name())
                .formula(request.formula())
                .frequency(request.frequency())
                .valueType(request.valueType())
                .responsible(request.responsibleId() != null
                        ? userRepository.findById(request.responsibleId()).orElse(null)
                        : null)
                .notes(request.notes())
                .build();

        indicatorRepository.save(indicator);

        IndicatorYear indicatorYear = IndicatorYear.builder()
                .indicator(indicator)
                .year(year)
                .goal(request.goal())
                .build();

        indicatorYearRepository.save(indicatorYear);

        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("name", indicator.getName() != null ? indicator.getName() : "");
        fields.put("formula", indicator.getFormula() != null ? indicator.getFormula() : "");
        fields.put("frequency", indicator.getFrequency() != null ? indicator.getFrequency().name() : "");
        fields.put("valueType", indicator.getValueType() != null ? indicator.getValueType().name() : "");
        fields.put("responsible", indicator.getResponsible() != null ? userDisplayName(indicator.getResponsible()) : "");
        fields.put("goal", indicatorYear.getGoal() != null ? indicatorYear.getGoal().stripTrailingZeros().toPlainString() : "");
        fields.put("notes", indicator.getNotes() != null ? indicator.getNotes() : "");
        fields.put("year", String.valueOf(year.getYear()));
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.INDICATOR,
                indicator.getId(),
                null,
                null,
                indicator.getName() != null ? indicator.getName() : "Indicador",
                ActionType.CREATED,
                logDetailsBuilder.buildCreated(fields)
        ));

        return mapToResponse(indicatorYear);
    }

    @Transactional
    public IndicatorYearResponse createIndicatorInProcess(Long processYearId, CreateIndicatorInProcessRequest request) {
        ProcessYear processYear = processYearRepository.findById(processYearId)
                .orElseThrow(() -> new IllegalArgumentException("ProcessYear not found"));

        Indicator indicator = Indicator.builder()
                .name(request.name())
                .formula(request.formula())
                .frequency(request.frequency())
                .valueType(request.valueType())
                .responsible(request.responsibleId() != null
                        ? userRepository.findById(request.responsibleId()).orElse(null)
                        : null)
                .notes(request.notes())
                .build();

        indicatorRepository.save(indicator);

        IndicatorYear indicatorYear = IndicatorYear.builder()
                .indicator(indicator)
                .year(processYear.getYear())
                .goal(request.goal())
                .build();

        indicatorYear.getProcesses().add(processYear);
        indicatorYearRepository.save(indicatorYear);

        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("name", indicator.getName() != null ? indicator.getName() : "");
        fields.put("formula", indicator.getFormula() != null ? indicator.getFormula() : "");
        fields.put("frequency", indicator.getFrequency() != null ? indicator.getFrequency().name() : "");
        fields.put("valueType", indicator.getValueType() != null ? indicator.getValueType().name() : "");
        fields.put("responsible", indicator.getResponsible() != null ? userDisplayName(indicator.getResponsible()) : "");
        fields.put("goal", indicatorYear.getGoal() != null ? indicatorYear.getGoal().stripTrailingZeros().toPlainString() : "");
        fields.put("notes", indicator.getNotes() != null ? indicator.getNotes() : "");
        fields.put("year", String.valueOf(processYear.getYear().getYear()));
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.INDICATOR,
                indicator.getId(),
                null,
                null,
                indicator.getName() != null ? indicator.getName() : "Indicador",
                ActionType.CREATED,
                logDetailsBuilder.buildCreated(fields)
        ));

        return mapToResponse(indicatorYear);
    }

    @Transactional
    public IndicatorYearResponse updateIndicator(Long indicatorYearId, UpdateIndicatorRequest request) {
        IndicatorYear indicatorYear = indicatorYearRepository.findById(indicatorYearId)
                .orElseThrow(() -> new IllegalArgumentException("IndicatorYear not found"));
        Indicator indicator = indicatorYear.getIndicator();

        Map<String, Object> before = new LinkedHashMap<>();
        before.put("name", indicator.getName() != null ? indicator.getName() : "");
        before.put("formula", indicator.getFormula() != null ? indicator.getFormula() : "");
        before.put("frequency", indicator.getFrequency() != null ? indicator.getFrequency().name() : "");
        before.put("valueType", indicator.getValueType() != null ? indicator.getValueType().name() : "");
        before.put("responsible", indicator.getResponsible() != null ? userDisplayName(indicator.getResponsible()) : "");
        before.put("goal", indicatorYear.getGoal() != null ? indicatorYear.getGoal().stripTrailingZeros().toPlainString() : "");
        before.put("notes", indicator.getNotes() != null ? indicator.getNotes() : "");

        if (request.name() != null) indicator.setName(request.name());
        if (request.formula() != null) indicator.setFormula(request.formula());
        if (request.frequency() != null) indicator.setFrequency(request.frequency());
        if (request.valueType() != null) indicator.setValueType(request.valueType());
        if (request.responsibleId() != null) {
            User responsible = userRepository.findById(request.responsibleId()).orElse(null);
            indicator.setResponsible(responsible);
        }
        if (request.notes() != null) indicator.setNotes(request.notes());
        if (request.goal() != null) indicatorYear.setGoal(BigDecimal.valueOf(request.goal()));

        indicatorRepository.save(indicator);
        indicatorYearRepository.save(indicatorYear);

        Map<String, Object> after = new LinkedHashMap<>();
        after.put("name", indicator.getName() != null ? indicator.getName() : "");
        after.put("formula", indicator.getFormula() != null ? indicator.getFormula() : "");
        after.put("frequency", indicator.getFrequency() != null ? indicator.getFrequency().name() : "");
        after.put("valueType", indicator.getValueType() != null ? indicator.getValueType().name() : "");
        after.put("responsible", indicator.getResponsible() != null ? userDisplayName(indicator.getResponsible()) : "");
        after.put("goal", indicatorYear.getGoal() != null ? indicatorYear.getGoal().stripTrailingZeros().toPlainString() : "");
        after.put("notes", indicator.getNotes() != null ? indicator.getNotes() : "");

        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.INDICATOR,
                indicator.getId(),
                null,
                null,
                indicator.getName() != null ? indicator.getName() : "Indicador",
                ActionType.UPDATED,
                logDetailsBuilder.buildUpdated(before, after)
        ));

        return mapToResponse(indicatorYear);
    }

    @Transactional
    public void associateIndicatorsToProcess(AssociateIndicatorsRequest request) {
        ProcessYear processYear = processYearRepository.findById(request.processYearId())
                .orElseThrow(() -> new RuntimeException("ProcessYear not found"));

        Long currentUserId = UserContextHolder.getUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isSuperAdmin = currentUser.getRoles().contains(Role.ROLE_SUPERADMIN);
        boolean isResponsible = processYear.getProcess().getResponsibles().stream()
                .anyMatch(r -> r.getId().equals(currentUserId));
        if (!isResponsible && !isSuperAdmin) {
            throw new RuntimeException("Apenas os responsáveis do processo podem editar associações");
        }

        String processName = processYear.getProcess().getName();

        for (Long indicatorYearId : request.indicatorYearIds()) {
            IndicatorYear indicatorYear = indicatorYearRepository.findById(indicatorYearId)
                    .orElseThrow(() -> new RuntimeException("IndicatorYear not found: " + indicatorYearId));
            if (!indicatorYear.getYear().getId().equals(processYear.getYear().getId())) {
                throw new RuntimeException("Indicator and Process must belong to the same year");
            }
            indicatorYear.getProcesses().add(processYear);

            logService.createLog(new CreateLogRequest(
                    currentUserId,
                    EntityType.INDICATOR,
                    indicatorYear.getIndicator().getId(),
                    null,
                    indicatorYear.getYear().getId(),
                    indicatorYear.getIndicator().getName(),
                    ActionType.UPDATED,
                    logDetailsBuilder.buildAssociation("process", processName, "ASSOCIATED")
            ));
            logService.createLog(new CreateLogRequest(
                    currentUserId,
                    EntityType.PROCESS,
                    processYear.getProcess().getId(),
                    null,
                    processYear.getYear().getId(),
                    processName,
                    ActionType.UPDATED,
                    logDetailsBuilder.buildAssociation("indicator", indicatorYear.getIndicator().getName(), "ASSOCIATED")
            ));
        }
    }

    @Transactional
    public void removeIndicatorsFromProcess(DisassociateIndicatorsRequest request) {
        ProcessYear processYear = processYearRepository.findById(request.processYearId())
                .orElseThrow(() -> new RuntimeException("ProcessYear not found"));

        Long currentUserId = UserContextHolder.getUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isSuperAdmin = currentUser.getRoles().contains(Role.ROLE_SUPERADMIN);
        boolean isResponsible = processYear.getProcess().getResponsibles().stream()
                .anyMatch(r -> r.getId().equals(currentUserId));
        if (!isResponsible && !isSuperAdmin) {
            throw new RuntimeException("Apenas os responsáveis do processo podem editar associações");
        }

        String processName = processYear.getProcess().getName();

        for (Long indicatorYearId : request.indicatorYearIds()) {
            IndicatorYear indicatorYear = indicatorYearRepository.findById(indicatorYearId)
                    .orElseThrow(() -> new RuntimeException("IndicatorYear not found: " + indicatorYearId));
            if (!indicatorYear.getProcesses().contains(processYear)) continue;
            indicatorYear.getProcesses().remove(processYear);

            logService.createLog(new CreateLogRequest(
                    currentUserId,
                    EntityType.INDICATOR,
                    indicatorYear.getIndicator().getId(),
                    null,
                    indicatorYear.getYear().getId(),
                    indicatorYear.getIndicator().getName(),
                    ActionType.UPDATED,
                    logDetailsBuilder.buildAssociation("process", processName, "DISASSOCIATED")
            ));
            logService.createLog(new CreateLogRequest(
                    currentUserId,
                    EntityType.PROCESS,
                    processYear.getProcess().getId(),
                    null,
                    processYear.getYear().getId(),
                    processName,
                    ActionType.UPDATED,
                    logDetailsBuilder.buildAssociation("indicator", indicatorYear.getIndicator().getName(), "DISASSOCIATED")
            ));
        }
    }

    private IndicatorYearResponse mapToResponse(IndicatorYear iy) {
        return new IndicatorYearResponse(
                iy.getId(),
                iy.getIndicator().getId(),
                iy.getIndicator().getName(),
                iy.getIndicator().getFormula(),
                iy.getIndicator().getFrequency().name(),
                iy.getIndicator().getValueType().name(),
                userRefService.fromEntity(iy.getIndicator().getResponsible()),
                iy.getIndicator().getNotes(),
                iy.getYear().getId(),
                iy.getGoal()
        );
    }

    @Transactional
    public void associateIndicatorToProcesses(AssociateProcessesRequest request) {
        IndicatorYear indicatorYear = indicatorYearRepository.findById(request.indicatorYearId())
                .orElseThrow(() -> new RuntimeException("IndicatorYear not found"));

        Long currentUserId = UserContextHolder.getUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isSuperAdmin = currentUser.getRoles().contains(Role.ROLE_SUPERADMIN);
        String indicatorName = indicatorYear.getIndicator().getName();

        for (Long processYearId : request.processYearIds()) {
            ProcessYear processYear = processYearRepository.findById(processYearId)
                    .orElseThrow(() -> new RuntimeException("ProcessYear not found: " + processYearId));
            if (!processYear.getYear().getId().equals(indicatorYear.getYear().getId())) {
                throw new RuntimeException("Process and Indicator must belong to the same year");
            }
            boolean isResponsible = processYear.getProcess().getResponsibles().stream()
                    .anyMatch(r -> r.getId().equals(currentUserId));
            if (!isResponsible && !isSuperAdmin) {
                throw new RuntimeException("Apenas os responsáveis do processo podem editar associações");
            }
            indicatorYear.getProcesses().add(processYear);

            logService.createLog(new CreateLogRequest(
                    currentUserId,
                    EntityType.PROCESS,
                    processYear.getProcess().getId(),
                    null,
                    processYear.getYear().getId(),
                    processYear.getProcess().getName(),
                    ActionType.UPDATED,
                    logDetailsBuilder.buildAssociation("indicator", indicatorName, "ASSOCIATED")
            ));
            logService.createLog(new CreateLogRequest(
                    currentUserId,
                    EntityType.INDICATOR,
                    indicatorYear.getIndicator().getId(),
                    null,
                    indicatorYear.getYear().getId(),
                    indicatorName,
                    ActionType.UPDATED,
                    logDetailsBuilder.buildAssociation("process", processYear.getProcess().getName(), "ASSOCIATED")
            ));
        }
    }

    @Transactional
    public void removeIndicatorFromProcesses(DisassociateProcessesRequest request) {
        IndicatorYear indicatorYear = indicatorYearRepository.findById(request.indicatorYearId())
                .orElseThrow(() -> new RuntimeException("IndicatorYear not found"));

        Long currentUserId = UserContextHolder.getUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isSuperAdmin = currentUser.getRoles().contains(Role.ROLE_SUPERADMIN);
        String indicatorName = indicatorYear.getIndicator().getName();

        for (Long processYearId : request.processYearIds()) {
            ProcessYear processYear = processYearRepository.findById(processYearId)
                    .orElseThrow(() -> new RuntimeException("ProcessYear not found: " + processYearId));
            boolean isResponsible = processYear.getProcess().getResponsibles().stream()
                    .anyMatch(r -> r.getId().equals(currentUserId));
            if (!isResponsible && !isSuperAdmin) {
                throw new RuntimeException("Apenas os responsáveis do processo podem editar associações");
            }
            if (!indicatorYear.getProcesses().contains(processYear)) continue;
            indicatorYear.getProcesses().remove(processYear);

            logService.createLog(new CreateLogRequest(
                    currentUserId,
                    EntityType.PROCESS,
                    processYear.getProcess().getId(),
                    null,
                    processYear.getYear().getId(),
                    processYear.getProcess().getName(),
                    ActionType.UPDATED,
                    logDetailsBuilder.buildAssociation("indicator", indicatorName, "DISASSOCIATED")
            ));
            logService.createLog(new CreateLogRequest(
                    currentUserId,
                    EntityType.INDICATOR,
                    indicatorYear.getIndicator().getId(),
                    null,
                    indicatorYear.getYear().getId(),
                    indicatorName,
                    ActionType.UPDATED,
                    logDetailsBuilder.buildAssociation("process", processYear.getProcess().getName(), "DISASSOCIATED")
            ));
        }
    }

    @Transactional(readOnly = true)
    public List<IndicatorFullResponse> getIndicatorsByYear(Long yearId) {
        return indicatorYearRepository.findByYearId(yearId)
                .stream()
                .map(indicatorYear -> {
                    var processes = indicatorYear.getProcesses().stream()
                            .map(processYear -> new ProcessOptionResponse(
                                    processYear.getId(),
                                    processYear.getProcess().getId(),
                                    processYear.getProcess().getName(),
                                    processYear.getMacroProcessYear() != null
                                            ? processYear.getMacroProcessYear().getMacroProcess().getName()
                                            : null
                            ))
                            .toList();

                    var measurements = indicatorYear.getMeasurements().stream()
                            .map(m -> new MeasurementResponse(
                                    m.getId(),
                                    m.getMeasurementDate(),
                                    m.getMeasurementValue(),
                                    m.getNotes(),
                                    m.getIndicatorYear().getId()
                            ))
                            .toList();

                    return new IndicatorFullResponse(
                            indicatorYear.getId(),
                            indicatorYear.getIndicator().getId(),
                            indicatorYear.getIndicator().getName(),
                            indicatorYear.getIndicator().getFormula(),
                            indicatorYear.getIndicator().getFrequency(),
                            indicatorYear.getIndicator().getValueType().name(),
                            userRefService.fromEntity(indicatorYear.getIndicator().getResponsible()),
                            indicatorYear.getIndicator().getNotes(),
                            indicatorYear.getGoal(),
                            processes,
                            measurements
                    );
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<IndicatorOptionResponse> getIndicatorOptionsByYear(Long yearId) {
        return indicatorYearRepository.findByYearId(yearId)
                .stream()
                .map(iy -> new IndicatorOptionResponse(
                        iy.getId(),
                        iy.getIndicator().getId(),
                        iy.getIndicator().getName(),
                        iy.getIndicator().getFrequency(),
                        userRefService.fromEntity(iy.getIndicator().getResponsible())
                ))
                .toList();
    }

    @Transactional
    public void associateYears(Long indicatorId, List<Long> yearIds) {
        Indicator indicator = indicatorRepository.findById(indicatorId)
                .orElseThrow(() -> new IllegalArgumentException("Indicator not found"));

        for (Long yearId : yearIds) {
            if (indicatorYearRepository.findByIndicatorIdAndYearId(indicatorId, yearId).isPresent()) {
                continue;
            }
            Year year = yearRepository.findById(yearId)
                    .orElseThrow(() -> new IllegalArgumentException("Year not found: " + yearId));

            IndicatorYear indicatorYear = IndicatorYear.builder()
                    .indicator(indicator)
                    .year(year)
                    .build();
            indicatorYearRepository.save(indicatorYear);

            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.INDICATOR,
                    indicator.getId(),
                    null,
                    yearId,
                    (indicator.getName() != null ? indicator.getName() : "Indicador") + " — " + year.getYear(),
                    ActionType.ASSOCIATED,
                    logDetailsBuilder.buildAssociation("year", String.valueOf(year.getYear()), "associated")
            ));
        }
    }

    @Transactional
    public void disassociateYears(Long indicatorId, List<Long> yearIds) {
        Indicator indicator = indicatorRepository.findById(indicatorId)
                .orElseThrow(() -> new IllegalArgumentException("Indicator not found"));

        long totalYears = indicatorYearRepository.findByIndicatorId(indicatorId).size();
        if (totalYears - yearIds.size() < 1) {
            throw new IllegalArgumentException("Indicator must belong to at least one year");
        }

        for (Long yearId : yearIds) {
            IndicatorYear indicatorYear = indicatorYearRepository.findByIndicatorIdAndYearId(indicatorId, yearId)
                    .orElseThrow(() -> new IllegalArgumentException("IndicatorYear not found for year: " + yearId));

            Year year = indicatorYear.getYear();
            indicatorYear.getProcesses().clear();
            if (indicator.getIndicatorYears() != null) {
                indicator.getIndicatorYears().remove(indicatorYear);
            }
            indicatorYearRepository.delete(indicatorYear);

            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.INDICATOR,
                    indicator.getId(),
                    null,
                    yearId,
                    (indicator.getName() != null ? indicator.getName() : "Indicador") + " — " + year.getYear(),
                    ActionType.DISASSOCIATED,
                    logDetailsBuilder.buildAssociation("year", String.valueOf(year.getYear()), "disassociated")
            ));
        }

        if (indicatorYearRepository.findByIndicatorId(indicatorId).isEmpty()) {
            Long userId = UserContextHolder.getUserId();
            Map<String, Object> fields = new LinkedHashMap<>();
            fields.put("name", indicator.getName() != null ? indicator.getName() : "");
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.INDICATOR,
                    indicator.getId(),
                    null,
                    null,
                    indicator.getName() != null ? indicator.getName() : "Indicador",
                    ActionType.DELETED,
                    logDetailsBuilder.buildDeleted(fields)
            ));
            indicatorRepository.delete(indicator);
        }
    }

    @Transactional
    public void deleteIndicatorYear(Long indicatorYearId) {
        IndicatorYear indicatorYear = indicatorYearRepository.findById(indicatorYearId)
                .orElseThrow(() -> new IllegalArgumentException("IndicatorYear not found"));

        Indicator indicator = indicatorYear.getIndicator();
        String yearValue = indicatorYear.getYear() != null ? String.valueOf(indicatorYear.getYear().getYear()) : String.valueOf(indicatorYearId);

        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.INDICATOR,
                indicator.getId(),
                null,
                indicatorYear.getYear() != null ? indicatorYear.getYear().getId() : null,
                (indicator.getName() != null ? indicator.getName() : "Indicador") + " — " + yearValue,
                ActionType.DISASSOCIATED,
                logDetailsBuilder.buildAssociation("year", yearValue, "disassociated")
        ));

        indicatorYear.getProcesses().clear();
        if (indicator.getIndicatorYears() != null) {
            indicator.getIndicatorYears().remove(indicatorYear);
        }
        indicatorYearRepository.delete(indicatorYear);

        if (indicator.getIndicatorYears() == null || indicator.getIndicatorYears().isEmpty()) {
            Map<String, Object> fields = new LinkedHashMap<>();
            fields.put("name", indicator.getName() != null ? indicator.getName() : "");
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.INDICATOR,
                    indicator.getId(),
                    null,
                    null,
                    indicator.getName() != null ? indicator.getName() : "Indicador",
                    ActionType.DELETED,
                    logDetailsBuilder.buildDeleted(fields)
            ));
            indicatorRepository.delete(indicator);
        }
    }}
