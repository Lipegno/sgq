package com.rodrigommfreitas.coreservice.indicator;

import com.rodrigommfreitas.coreservice.indicator.dto.*;
import com.rodrigommfreitas.coreservice.year.dto.AssociateYearsRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/indicators")
@RequiredArgsConstructor
public class IndicatorController {

    private final IndicatorService indicatorService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IndicatorYearResponse createIndicator(@RequestBody CreateIndicatorRequest request) {
        return indicatorService.createIndicator(request);
    }

    @PostMapping("/process/{processYearId}")
    @ResponseStatus(HttpStatus.CREATED)
    public IndicatorYearResponse createIndicatorInProcess(
            @PathVariable Long processYearId,
            @RequestBody CreateIndicatorInProcessRequest request
    ) {
        return indicatorService.createIndicatorInProcess(processYearId, request);
    }

    @PostMapping("/associate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void associateIndicators(
            @RequestBody AssociateIndicatorsRequest request
    ) {
        indicatorService.associateIndicatorsToProcess(request);
    }

    @PostMapping("/disassociate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeIndicators(
            @RequestBody DisassociateIndicatorsRequest request
    ) {
        indicatorService.removeIndicatorsFromProcess(request);
    }

    @PostMapping("/associate-to-processes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void associateIndicatorToProcesses(
            @RequestBody AssociateProcessesRequest request
    ) {
        indicatorService.associateIndicatorToProcesses(request);
    }

    @PostMapping("/disassociate-from-processes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeIndicatorFromProcesses(
            @RequestBody DisassociateProcessesRequest request
    ) {
        indicatorService.removeIndicatorFromProcesses(request);
    }

    @PutMapping("/{indicatorYearId}")
    public IndicatorYearResponse updateIndicator(
            @PathVariable Long indicatorYearId,
            @RequestBody UpdateIndicatorRequest request
    ) {
        return indicatorService.updateIndicator(indicatorYearId, request);
    }

    @PutMapping("/{id}/years/associate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void associateYears(
            @PathVariable Long id,
            @RequestBody AssociateYearsRequest request
    ) {
        indicatorService.associateYears(id, request.yearIds());
    }

    @PutMapping("/{id}/years/disassociate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void disassociateYears(
            @PathVariable Long id,
            @RequestBody AssociateYearsRequest request
    ) {
        indicatorService.disassociateYears(id, request.yearIds());
    }

    @DeleteMapping("/{indicatorYearId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteIndicator(@PathVariable Long indicatorYearId) {
        indicatorService.deleteIndicatorYear(indicatorYearId);
    }

    @GetMapping("/year/{yearId}")
    public List<IndicatorFullResponse> getIndicatorsByYear(
            @PathVariable Long yearId
    ) {
        return indicatorService.getIndicatorsByYear(yearId);
    }

    @GetMapping("/year/{yearId}/options")
    public List<IndicatorOptionResponse> getIndicatorOptionsByYear(
            @PathVariable Long yearId
    ) {
        return indicatorService.getIndicatorOptionsByYear(yearId);
    }
}