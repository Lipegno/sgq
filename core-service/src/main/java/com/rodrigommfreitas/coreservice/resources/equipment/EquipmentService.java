package com.rodrigommfreitas.coreservice.resources.equipment;

import com.fasterxml.jackson.databind.JsonNode;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
import com.rodrigommfreitas.coreservice.resources.equipment.dto.*;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import com.rodrigommfreitas.coreservice.user.User;
import com.rodrigommfreitas.coreservice.user.UserReferenceService;
import com.rodrigommfreitas.coreservice.user.UserRepository;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import com.rodrigommfreitas.coreservice.year.dto.YearOption;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class EquipmentService {

    private final EquipmentRepository repository;
    private final EquipmentYearRepository yearRepository;
    private final YearRepository yearRepo;
    private final MaintenanceRecordRepository maintenanceRecordRepository;
    private final CalibrationRecordRepository calibrationRecordRepository;
    private final UserRepository userRepository;
    private final UserReferenceService userRefService;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    @Transactional
    public void create(CreateEquipmentRequest request) {

        Equipment equipment = Equipment.builder()
                .name(request.name())
                .type(request.type())
                .location(request.location())
                .responsible(request.responsibleId() != null
                        ? userRepository.findById(request.responsibleId()).orElse(null)
                        : null)
                .build();

        repository.save(equipment);

        for (Long yearId : request.yearIds()) {

            Year year = yearRepo.findById(yearId)
                    .orElseThrow(() -> new RuntimeException("Year not found"));

            EquipmentYear ey = EquipmentYear.builder()
                    .equipment(equipment)
                    .year(year)
                    .isActive(request.isActive())
                    .build();

            yearRepository.save(ey);
            equipment.getYears().add(ey);
        }

        Long userId = UserContextHolder.getUserId();
        for (EquipmentYear ey : equipment.getYears()) {
            Map<String, Object> fields = Map.of(
                    "name", equipment.getName(),
                    "type", equipment.getType() != null ? equipment.getType() : "",
                    "location", equipment.getLocation() != null ? equipment.getLocation() : "",
                    "year", ey.getYear().getYear()
            );
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.EQUIPMENT,
                    equipment.getId(),
                    ey.getId(),
                    ey.getYear().getId(),
                    equipment.getName(),
                    ActionType.CREATED,
                    logDetailsBuilder.buildCreated(fields)
            ));
        }
    }

    @Transactional
    public void update(Long id, UpdateEquipmentRequest request) {

        Equipment equipment = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipment not found"));

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("name", equipment.getName());
        oldFields.put("type", equipment.getType() != null ? equipment.getType() : "");
        oldFields.put("location", equipment.getLocation() != null ? equipment.getLocation() : "");

        if (request.name() != null) equipment.setName(request.name());
        if (request.type() != null) equipment.setType(request.type());
        if (request.location() != null) equipment.setLocation(request.location());
        if (request.responsibleId() != null) equipment.setResponsible(
                userRepository.findById(request.responsibleId()).orElse(null));

        if (request.yearId() != null) {

            EquipmentYear ey = yearRepository
                    .findByEquipmentIdAndYearId(id, request.yearId())
                    .orElseThrow(() -> new RuntimeException("Year relation not found"));
            if (ey.isActive() != request.isActive()) {
                oldFields.put("isActive", ey.isActive());
                ey.setActive(request.isActive());
            }
            yearRepository.save(ey);
        }

        repository.save(equipment);

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("name", equipment.getName());
        newFields.put("type", equipment.getType() != null ? equipment.getType() : "");
        newFields.put("location", equipment.getLocation() != null ? equipment.getLocation() : "");

        boolean hasChanges = !oldFields.equals(newFields);
        if (hasChanges) {
            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.EQUIPMENT,
                    equipment.getId(),
                    null,
                    request.yearId(),
                    equipment.getName(),
                    ActionType.UPDATED,
                    logDetailsBuilder.buildUpdated(oldFields, newFields)
            ));
        }
    }

    @Transactional
    public void deleteAll(Long id) {
        Equipment equipment = repository.findById(id).orElse(null);
        if (equipment != null) {
            Long userId = UserContextHolder.getUserId();
            Map<String, Object> fields = Map.of("name", equipment.getName());
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.EQUIPMENT,
                    id,
                    null,
                    null,
                    equipment.getName(),
                    ActionType.DELETED,
                    logDetailsBuilder.buildDeleted(fields)
            ));
        }
        repository.deleteById(id);
    }

    @Transactional
    public void deleteFromYear(Long id, Long yearId) {

        EquipmentYear ey = yearRepository
                .findByEquipmentIdAndYearId(id, yearId)
                .orElseThrow(() -> new RuntimeException("Relation not found"));

        Equipment equipment = ey.getEquipment();

        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.EQUIPMENT,
                id,
                ey.getId(),
                yearId,
equipment.getName() + " — " + String.valueOf(ey.getYear().getYear()),
                        ActionType.DISASSOCIATED,
                logDetailsBuilder.buildAssociation("year", String.valueOf(ey.getYear().getYear()), "disassociated")
        ));

        equipment.getYears().remove(ey);
        yearRepository.delete(ey);

        if (equipment.getYears().isEmpty()) {
            repository.delete(equipment);
        }
    }

    @Transactional
    public void associateYears(Long id, Set<Long> yearIds, boolean isActive) {

        Equipment equipment = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipment not found"));

        for (Long yearId : yearIds) {

            boolean exists = yearRepository
                    .existsByEquipmentIdAndYearId(id, yearId);

            if (exists) continue;

            Year year = yearRepo.findById(yearId)
                    .orElseThrow(() -> new RuntimeException("Year not found"));

            EquipmentYear ey = EquipmentYear.builder()
                    .equipment(equipment)
                    .year(year)
                    .isActive(isActive)
                    .build();

            yearRepository.save(ey);
            equipment.getYears().add(ey);

            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.EQUIPMENT,
                    equipment.getId(),
                    ey.getId(),
                    yearId,
equipment.getName() + " — " + String.valueOf(year.getYear()),
                        ActionType.ASSOCIATED,
                    logDetailsBuilder.buildAssociation("year", String.valueOf(year.getYear()), "associated")
            ));
        }
    }

    @Transactional(readOnly = true)
    public List<EquipmentResponse> getByYear(Long yearId) {

        List<EquipmentYear> list =
                yearRepository.findAllByYearId(yearId);

        return list.stream()
                .map(this::mapToResponse)
                .toList();
    }

    // Maintenance Record methods

    @Transactional
    public void addMaintenanceRecord(Long equipmentId, CreateMaintenanceRecordRequest request) {

        Equipment equipment = repository.findById(equipmentId)
                .orElseThrow(() -> new RuntimeException("Equipment not found"));

        MaintenanceRecord record = MaintenanceRecord.builder()
                .equipment(equipment)
                .date(request.date())
                .type(request.type())
                .performedBy(request.performedBy())
                .description(request.description())
                .build();

        maintenanceRecordRepository.save(record);
        equipment.getMaintenanceHistory().add(record);

        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = Map.of(
                "date", request.date(),
                "type", request.type() != null ? request.type() : "",
                "performedBy", request.performedBy() != null ? request.performedBy() : "",
                "equipmentName", equipment.getName()
        );
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.MAINTENANCE_RECORD,
                equipmentId,
                null,
                null,
                equipment.getName(),
                ActionType.CREATED,
                logDetailsBuilder.buildCreated(fields)
        ));
    }

    @Transactional(readOnly = true)
    public List<MaintenanceRecordResponse> getMaintenanceRecords(Long equipmentId) {

        return maintenanceRecordRepository.findAllByEquipmentId(equipmentId)
                .stream()
                .map(this::mapToMaintenanceResponse)
                .toList();
    }

    @Transactional
    public void deleteMaintenanceRecord(Long equipmentId, Long recordId) {

        MaintenanceRecord record = maintenanceRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Maintenance record not found"));

        if (!record.getEquipment().getId().equals(equipmentId)) {
            throw new RuntimeException("Maintenance record does not belong to this equipment");
        }

        Equipment equipment = record.getEquipment();
        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = Map.of(
                "date", record.getDate(),
                "type", record.getType() != null ? record.getType() : "",
                "equipmentName", equipment.getName()
        );
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.MAINTENANCE_RECORD,
                equipmentId,
                null,
                null,
                equipment.getName(),
                ActionType.DELETED,
                logDetailsBuilder.buildDeleted(fields)
        ));

        maintenanceRecordRepository.delete(record);
    }

    // Calibration Record methods

    @Transactional
    public void addCalibrationRecord(Long equipmentId, CreateCalibrationRecordRequest request) {

        Equipment equipment = repository.findById(equipmentId)
                .orElseThrow(() -> new RuntimeException("Equipment not found"));

        CalibrationRecord record = CalibrationRecord.builder()
                .equipment(equipment)
                .date(request.date())
                .performedBy(request.performedBy())
                .result(request.result())
                .description(request.description())
                .build();

        calibrationRecordRepository.save(record);
        equipment.getCalibrationHistory().add(record);

        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = Map.of(
                "date", request.date(),
                "result", request.result() != null ? request.result() : "",
                "performedBy", request.performedBy() != null ? request.performedBy() : "",
                "equipmentName", equipment.getName()
        );
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.CALIBRATION_RECORD,
                equipmentId,
                null,
                null,
                equipment.getName(),
                ActionType.CREATED,
                logDetailsBuilder.buildCreated(fields)
        ));
    }

    @Transactional(readOnly = true)
    public List<CalibrationRecordResponse> getCalibrationRecords(Long equipmentId) {

        return calibrationRecordRepository.findAllByEquipmentId(equipmentId)
                .stream()
                .map(this::mapToCalibrationResponse)
                .toList();
    }

    @Transactional
    public void deleteCalibrationRecord(Long equipmentId, Long recordId) {

        CalibrationRecord record = calibrationRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Calibration record not found"));

        if (!record.getEquipment().getId().equals(equipmentId)) {
            throw new RuntimeException("Calibration record does not belong to this equipment");
        }

        Equipment equipment = record.getEquipment();
        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = Map.of(
                "date", record.getDate(),
                "result", record.getResult() != null ? record.getResult() : "",
                "equipmentName", equipment.getName()
        );
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.CALIBRATION_RECORD,
                equipmentId,
                null,
                null,
                equipment.getName(),
                ActionType.DELETED,
                logDetailsBuilder.buildDeleted(fields)
        ));

        calibrationRecordRepository.delete(record);
    }

    private EquipmentResponse mapToResponse(EquipmentYear ey) {

        Equipment equipment = ey.getEquipment();

        List<YearOption> years = equipment.getYears() != null
                ? equipment.getYears().stream()
                .map(y -> new YearOption(
                        y.getYear().getId(),
                        y.getYear().getYear(),
                        y.getYear().getId().equals(ey.getYear().getId())
                ))
                .toList()
                : List.of();

        List<MaintenanceRecordResponse> maintenanceHistory = equipment.getMaintenanceHistory() != null
                ? equipment.getMaintenanceHistory().stream()
                .map(this::mapToMaintenanceResponse)
                .toList()
                : List.of();

        List<CalibrationRecordResponse> calibrationHistory = equipment.getCalibrationHistory() != null
                ? equipment.getCalibrationHistory().stream()
                .map(this::mapToCalibrationResponse)
                .toList()
                : List.of();

        return new EquipmentResponse(
                equipment.getId(),
                equipment.getName(),
                equipment.getType(),
                equipment.getLocation(),
                userRefService.fromEntity(equipment.getResponsible()),
                ey.getYear().getId(),
                ey.getYear().getYear(),
                ey.isActive(),
                years,
                maintenanceHistory,
                calibrationHistory
        );
    }

    private MaintenanceRecordResponse mapToMaintenanceResponse(MaintenanceRecord record) {
        return new MaintenanceRecordResponse(
                record.getId(),
                record.getDate(),
                record.getType(),
                record.getPerformedBy(),
                record.getDescription()
        );
    }

    private CalibrationRecordResponse mapToCalibrationResponse(CalibrationRecord record) {
        return new CalibrationRecordResponse(
                record.getId(),
                record.getDate(),
                record.getPerformedBy(),
                record.getResult(),
                record.getDescription()
        );
    }
}