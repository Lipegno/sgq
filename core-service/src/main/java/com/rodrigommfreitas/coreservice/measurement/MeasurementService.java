package com.rodrigommfreitas.coreservice.measurement;

import com.rodrigommfreitas.coreservice.indicator.*;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
import com.rodrigommfreitas.coreservice.measurement.dto.CreateMeasurementRequest;
import com.rodrigommfreitas.coreservice.measurement.dto.MeasurementResponse;
import com.rodrigommfreitas.coreservice.measurement.dto.UpdateMeasurementRequest;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MeasurementService {

    private final MeasurementRepository measurementRepository;
    private final IndicatorYearRepository indicatorYearRepository;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    @Transactional
    public MeasurementResponse createMeasurement(Long indicatorYearId, CreateMeasurementRequest request) {

        IndicatorYear indicatorYear = indicatorYearRepository.findById(indicatorYearId)
                .orElseThrow(() -> new RuntimeException("IndicatorYear not found"));

        Measurement measurement = new Measurement();
        measurement.setMeasurementValue(request.value());
        measurement.setMeasurementDate(request.measurementDate());
        measurement.setNotes(request.notes());
        measurement.setIndicatorYear(indicatorYear);

        Measurement saved = measurementRepository.save(measurement);

        logMeasurementChange(indicatorYear, saved.getMeasurementDate(), "", describe(saved.getMeasurementValue(), saved.getNotes()));

        return new MeasurementResponse(
                saved.getId(),
                saved.getMeasurementDate(),
                saved.getMeasurementValue(),
                saved.getNotes(),
                indicatorYear.getId()
        );
    }

    @Transactional
    public MeasurementResponse updateMeasurement(Long measurementId, UpdateMeasurementRequest request) {
        Measurement measurement = measurementRepository.findById(measurementId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Measurement not found"));

        LocalDate oldDate = measurement.getMeasurementDate();
        String before = describe(measurement.getMeasurementValue(), measurement.getNotes());

        if (request.value() != null) measurement.setMeasurementValue(request.value());
        if (request.measurementDate() != null) measurement.setMeasurementDate(request.measurementDate());
        if (request.notes() != null) measurement.setNotes(request.notes());

        Measurement saved = measurementRepository.save(measurement);

        String after = describe(saved.getMeasurementValue(), saved.getNotes());
        if (!oldDate.equals(saved.getMeasurementDate())) {
            after = after + " (data: " + saved.getMeasurementDate() + ")";
        }
        logMeasurementChange(saved.getIndicatorYear(), oldDate, before, after);

        return new MeasurementResponse(
                saved.getId(),
                saved.getMeasurementDate(),
                saved.getMeasurementValue(),
                saved.getNotes(),
                saved.getIndicatorYear().getId()
        );
    }

    @Transactional
    public void deleteMeasurement(Long measurementId) {
        Measurement measurement = measurementRepository.findById(measurementId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Measurement not found"));

        IndicatorYear indicatorYear = measurement.getIndicatorYear();
        logMeasurementChange(indicatorYear, measurement.getMeasurementDate(),
                describe(measurement.getMeasurementValue(), measurement.getNotes()), "(removida)");

        indicatorYear.getMeasurements().remove(measurement);
        measurementRepository.delete(measurement);
    }

    private static String describe(BigDecimal value, String notes) {
        String v = value != null ? value.stripTrailingZeros().toPlainString() : "";
        return notes != null && !notes.isBlank() ? v + " (" + notes + ")" : v;
    }

    /** Regista a alteração no histórico do indicador (mesmo formato dos restantes campos do indicador). */
    private void logMeasurementChange(IndicatorYear indicatorYear, LocalDate date, String before, String after) {
        String key = "medição " + date;
        Map<String, Object> oldFields = new LinkedHashMap<>();
        Map<String, Object> newFields = new LinkedHashMap<>();
        oldFields.put(key, before);
        newFields.put(key, after);
        logService.createLog(new CreateLogRequest(
                UserContextHolder.getUserId(),
                EntityType.INDICATOR,
                indicatorYear.getIndicator().getId(),
                null,
                indicatorYear.getYear().getId(),
                indicatorYear.getIndicator().getName() != null ? indicatorYear.getIndicator().getName() : "Indicador",
                ActionType.UPDATED,
                logDetailsBuilder.buildUpdated(oldFields, newFields)
        ));
    }
}
