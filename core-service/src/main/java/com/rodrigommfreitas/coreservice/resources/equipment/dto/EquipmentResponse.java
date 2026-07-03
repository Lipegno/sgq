package com.rodrigommfreitas.coreservice.resources.equipment.dto;

import com.rodrigommfreitas.coreservice.user.dto.UserSummary;
import com.rodrigommfreitas.coreservice.year.dto.YearOption;

import java.util.List;

public record EquipmentResponse(
        Long id,
        String name,
        String type,
        String location,
        UserSummary responsible,

        Long yearId,
        Integer year,
        boolean isActive,
        List<YearOption> years,

        List<MaintenanceRecordResponse> maintenanceHistory,
        List<CalibrationRecordResponse> calibrationHistory
) {}