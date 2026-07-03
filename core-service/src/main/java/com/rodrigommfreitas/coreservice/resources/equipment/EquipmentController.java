package com.rodrigommfreitas.coreservice.resources.equipment;

import com.rodrigommfreitas.coreservice.resources.equipment.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/equipments")
@RequiredArgsConstructor
public class EquipmentController {

    private final EquipmentService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void create(@RequestBody CreateEquipmentRequest request) {
        service.create(request);
    }

    @PatchMapping("/{id}")
    public void update(
            @PathVariable Long id,
            @RequestBody UpdateEquipmentRequest request
    ) {
        service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAll(@PathVariable Long id) {
        service.deleteAll(id);
    }

    @DeleteMapping("/{id}/years/{yearId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteFromYear(
            @PathVariable Long id,
            @PathVariable Long yearId
    ) {
        service.deleteFromYear(id, yearId);
    }

    @PostMapping("/{id}/years")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void associateYears(
            @PathVariable Long id,
            @RequestBody Set<Long> yearIds,
            @RequestParam boolean isActive
    ) {
        service.associateYears(id, yearIds, isActive);
    }

    @GetMapping("/year/{yearId}")
    public List<EquipmentResponse> getByYear(@PathVariable Long yearId) {
        return service.getByYear(yearId);
    }

    // Maintenance Record endpoints

    @PostMapping("/{id}/maintenance")
    @ResponseStatus(HttpStatus.CREATED)
    public void addMaintenanceRecord(
            @PathVariable Long id,
            @RequestBody CreateMaintenanceRecordRequest request
    ) {
        service.addMaintenanceRecord(id, request);
    }

    @GetMapping("/{id}/maintenance")
    public List<MaintenanceRecordResponse> getMaintenanceRecords(@PathVariable Long id) {
        return service.getMaintenanceRecords(id);
    }

    @DeleteMapping("/{id}/maintenance/{recordId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMaintenanceRecord(
            @PathVariable Long id,
            @PathVariable Long recordId
    ) {
        service.deleteMaintenanceRecord(id, recordId);
    }

    // Calibration Record endpoints

    @PostMapping("/{id}/calibration")
    @ResponseStatus(HttpStatus.CREATED)
    public void addCalibrationRecord(
            @PathVariable Long id,
            @RequestBody CreateCalibrationRecordRequest request
    ) {
        service.addCalibrationRecord(id, request);
    }

    @GetMapping("/{id}/calibration")
    public List<CalibrationRecordResponse> getCalibrationRecords(@PathVariable Long id) {
        return service.getCalibrationRecords(id);
    }

    @DeleteMapping("/{id}/calibration/{recordId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCalibrationRecord(
            @PathVariable Long id,
            @PathVariable Long recordId
    ) {
        service.deleteCalibrationRecord(id, recordId);
    }
}