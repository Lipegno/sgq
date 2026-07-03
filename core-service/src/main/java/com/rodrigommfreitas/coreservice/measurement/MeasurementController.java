package com.rodrigommfreitas.coreservice.measurement;

import com.rodrigommfreitas.coreservice.measurement.dto.CreateMeasurementRequest;
import com.rodrigommfreitas.coreservice.measurement.dto.MeasurementResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/measurements")
@RequiredArgsConstructor
public class MeasurementController {
    private final MeasurementService measurementService;

    @PostMapping("/indicator-year/{indicatorYearId}")
    @ResponseStatus(HttpStatus.CREATED)
    public MeasurementResponse createMeasurement(
            @PathVariable Long indicatorYearId,
            @RequestBody CreateMeasurementRequest request
    ) {
        return measurementService.createMeasurement(indicatorYearId, request);
    }
}