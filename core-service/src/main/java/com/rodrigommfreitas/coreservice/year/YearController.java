package com.rodrigommfreitas.coreservice.year;

import com.rodrigommfreitas.coreservice.year.dto.CreateYearRequest;
import com.rodrigommfreitas.coreservice.year.dto.YearResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/years")
public class YearController {

    private final YearService yearService;

    public YearController(YearService yearService) {
        this.yearService = yearService;
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<YearResponse> create(
            @RequestBody CreateYearRequest request
    ) {
        return ResponseEntity.ok(yearService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<YearResponse>> getAll() {
        return ResponseEntity.ok(yearService.getAll());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        yearService.delete(id);
        return ResponseEntity.noContent().build();
    }
}