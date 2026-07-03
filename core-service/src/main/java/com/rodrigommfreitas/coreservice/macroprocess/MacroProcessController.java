package com.rodrigommfreitas.coreservice.macroprocess;

import com.rodrigommfreitas.coreservice.macroprocess.dto.CreateMacroProcessRequest;
import com.rodrigommfreitas.coreservice.macroprocess.dto.CreateMacroProcessResponse;
import com.rodrigommfreitas.coreservice.macroprocess.dto.MacroProcessOptionResponse;
import com.rodrigommfreitas.coreservice.macroprocess.dto.UpdateMacroProcessRequest;
import com.rodrigommfreitas.coreservice.year.dto.AssociateYearsRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/macroprocesses")
public class MacroProcessController {

    private final MacroProcessService macroProcessService;
    private final MacroProcessYearService macroProcessYearService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreateMacroProcessResponse create(
            @RequestBody CreateMacroProcessRequest request
    ) {
        return macroProcessService.create(request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMacroProcess(@PathVariable Long id) {
        macroProcessService.deleteMacroProcess(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}")
    public CreateMacroProcessResponse updateMacroProcess(
            @PathVariable Long id,
            @RequestBody UpdateMacroProcessRequest request
    ) {
        return macroProcessService.updateMacroProcess(id, request);
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<CreateMacroProcessResponse> getByYear(
            @RequestParam Long yearId
    ) {
        return macroProcessService.getByYear(yearId);
    }

    @PostMapping("/{macroProcessId}/years/associate")
    public void associateYears(
            @PathVariable Long macroProcessId,
            @RequestBody AssociateYearsRequest request
    ) {
        macroProcessYearService.associateYears(macroProcessId, request.yearIds());
    }

    // Disassociate macroprocess only
    @PostMapping("/{macroProcessId}/years/disassociate")
    public void disassociateMacroProcess(
            @PathVariable Long macroProcessId,
            @RequestBody AssociateYearsRequest request
    ) {
        macroProcessYearService.disassociateYears(macroProcessId, request, false);
    }

    // Disassociate macroprocess + children
    @PostMapping("/{macroProcessId}/years/disassociate/full")
    public void disassociateMacroProcessFull(
            @PathVariable Long macroProcessId,
            @RequestBody AssociateYearsRequest request
    ) {
        macroProcessYearService.disassociateYears(macroProcessId, request, true);
    }

    @PostMapping("/{macroProcessId}/years/associate/full")
    public void associateYearsWithChildren(
            @PathVariable Long macroProcessId,
            @RequestBody AssociateYearsRequest request
    ) {
        macroProcessYearService.associateYearsWithChildren(macroProcessId, request.yearIds());
    }

    @GetMapping("/year/{yearId}/options")
    public List<MacroProcessOptionResponse> getMacroProcessOptionsByYear(
            @PathVariable Long yearId
    ) {
        return macroProcessService.getMacroProcessesByYear(yearId);
    }
}