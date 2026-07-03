package com.rodrigommfreitas.coreservice.macroprocess;

import com.rodrigommfreitas.coreservice.macroprocess.dto.HierarchyResponse;
import com.rodrigommfreitas.coreservice.macroprocess.dto.MacroProcessHierarchyResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/macroprocess-hierarchy")
@RequiredArgsConstructor
public class MacroProcessYearController {
    private final MacroProcessYearService macroProcessYearService;

    @GetMapping("/{yearId}")
    public HierarchyResponse getHierarchy(@PathVariable Long yearId) {
        return macroProcessYearService.getHierarchyByYear(yearId);
    }

}
