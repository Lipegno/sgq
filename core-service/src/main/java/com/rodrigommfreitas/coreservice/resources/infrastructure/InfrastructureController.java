package com.rodrigommfreitas.coreservice.resources.infrastructure;

import com.rodrigommfreitas.coreservice.resources.infrastructure.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/infrastructures")
@RequiredArgsConstructor
public class InfrastructureController {

    private final InfrastructureService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void create(@RequestBody CreateInfrastructureRequest request) {
        service.create(request);
    }

    @PatchMapping("/{id}")
    public void update(
            @PathVariable Long id,
            @RequestBody UpdateInfrastructureRequest request
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
    public List<InfrastructureResponse> getByYear(@PathVariable Long yearId) {
        return service.getByYear(yearId);
    }
}