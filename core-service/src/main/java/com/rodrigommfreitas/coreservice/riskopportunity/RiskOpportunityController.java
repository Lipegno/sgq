package com.rodrigommfreitas.coreservice.riskopportunity;

import com.rodrigommfreitas.coreservice.riskopportunity.dto.*;
import com.rodrigommfreitas.coreservice.year.dto.YearResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/risk-opportunities")
@RequiredArgsConstructor
public class RiskOpportunityController {

    private final RiskOpportunityService service;

    @PostMapping("/{riskOpportunityYearId}/processes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void associateProcesses(
            @PathVariable Long riskOpportunityYearId,
            @Valid @RequestBody AssociateProcessesRequest request
            ) {
        service.associateProcesses(
                request.processIds(),
                riskOpportunityYearId
        );
    }

    // DISASSOCIATE PROCESSES
    @DeleteMapping("/{riskOpportunityYearId}/processes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void disassociateProcesses(
            @PathVariable Long riskOpportunityYearId,
            @Valid @RequestBody AssociateProcessesRequest request
    ) {
        service.disassociateProcesses(
                riskOpportunityYearId,
                request.processIds()
        );
    }

    // DELETE
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    // PATCH UPDATE
    @PatchMapping("/{id}")
    public void update(
            @PathVariable Long id,
            @RequestBody UpdateRiskOpportunityRequest request
    ) {
        service.update(id, request);
    }

    @PostMapping
    public void create(@Valid @RequestBody RiskOpportunityCreateRequest request) {
        service.create(request);
    }

    @GetMapping("/year/{yearId}")
    public RiskOpportunityGroupedResponse getByYear(@PathVariable Long yearId) {
        return service.getByYear(yearId);
    }

    @PostMapping("/{id}/years/associate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void associateYears(
            @PathVariable Long id,
            @RequestBody AssociateRiskOpportunityYearsRequest request
    ) {
                service.associateYears(
                request.yearIds(),
                id,
                request.copyAttributes(),
                request.copyProcesses()
        );
    }

    @GetMapping("/{id}/years")
    public List<YearResponse> getAssociatedYears(@PathVariable Long id) {
        return service.getAssociatedYears(id);
    }

    @PostMapping("/{id}/years/disassociate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void disassociateYears(
            @PathVariable Long id,
            @RequestBody Set<Long> yearIds
    ) {
        service.disassociateYears(id, yearIds);
    }
}