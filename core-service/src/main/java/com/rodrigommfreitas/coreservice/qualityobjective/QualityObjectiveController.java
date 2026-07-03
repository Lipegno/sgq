package com.rodrigommfreitas.coreservice.qualityobjective;

import com.rodrigommfreitas.coreservice.qualityobjective.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/quality-objectives")
@RequiredArgsConstructor
public class QualityObjectiveController {

    private final QualityObjectiveService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void create(@RequestBody CreateQualityObjectiveRequest request) {
        service.create(request);
    }

    @PatchMapping("/{id}")
    public void update(
            @PathVariable Long id,
            @RequestBody UpdateQualityObjectiveRequest request
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
            @RequestBody AssociateYearsRequest request
    ) {
        service.associateYears(id, request);
    }

    @GetMapping("/year/{yearId}")
    public List<QualityObjectiveResponse> getByYear(@PathVariable Long yearId) {
        return service.getByYear(yearId);
    }

    @PostMapping("/{qualityObjectiveYearId}/processes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void associateProcesses(
            @PathVariable Long qualityObjectiveYearId,
            @RequestBody Set<Long> processIds
    ) {
        service.associateProcesses(qualityObjectiveYearId, processIds);
    }

    @DeleteMapping("/{qualityObjectiveYearId}/processes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void disassociateProcesses(
            @PathVariable Long qualityObjectiveYearId,
            @RequestBody Set<Long> processIds
    ) {
        service.disassociateProcesses(qualityObjectiveYearId, processIds);
    }
}