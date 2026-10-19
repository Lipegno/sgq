package com.rodrigommfreitas.coreservice.measurement;

import com.rodrigommfreitas.coreservice.indicator.*;
import com.rodrigommfreitas.coreservice.measurement.dto.CreateMeasurementRequest;
import com.rodrigommfreitas.coreservice.measurement.dto.MeasurementResponse;
import com.rodrigommfreitas.coreservice.measurement.dto.UpdateMeasurementRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class MeasurementService {

    private final MeasurementRepository measurementRepository;
    private final IndicatorYearRepository indicatorYearRepository;

    public MeasurementResponse createMeasurement(Long indicatorYearId, CreateMeasurementRequest request) {

        IndicatorYear indicatorYear = indicatorYearRepository.findById(indicatorYearId)
                .orElseThrow(() -> new RuntimeException("IndicatorYear not found"));

        Measurement measurement = new Measurement();
        measurement.setMeasurementValue(request.value());
        measurement.setMeasurementDate(request.measurementDate());
        measurement.setNotes(request.notes());
        measurement.setIndicatorYear(indicatorYear);

        Measurement saved = measurementRepository.save(measurement);

        return new MeasurementResponse(
                saved.getId(),
                saved.getMeasurementDate(),
                saved.getMeasurementValue(),
                saved.getNotes(),
                indicatorYear.getId()
        );
    }

    public MeasurementResponse updateMeasurement(Long measurementId, UpdateMeasurementRequest request) {
        Measurement measurement = measurementRepository.findById(measurementId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Measurement not found"));

        if (request.value() != null) measurement.setMeasurementValue(request.value());
        if (request.measurementDate() != null) measurement.setMeasurementDate(request.measurementDate());
        if (request.notes() != null) measurement.setNotes(request.notes());

        Measurement saved = measurementRepository.save(measurement);

        return new MeasurementResponse(
                saved.getId(),
                saved.getMeasurementDate(),
                saved.getMeasurementValue(),
                saved.getNotes(),
                saved.getIndicatorYear().getId()
        );
    }
}
