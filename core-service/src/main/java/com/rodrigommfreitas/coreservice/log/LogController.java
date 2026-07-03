package com.rodrigommfreitas.coreservice.log;

import com.rodrigommfreitas.coreservice.log.dto.LogResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class LogController {

    private final LogService logService;

    @GetMapping
    public Page<LogResponse> getLogs(
            @RequestParam(required = false) EntityType entityType,
            @RequestParam(required = false) List<EntityType> entityTypes,
            @RequestParam(required = false) Long baseEntityId,
            @RequestParam(required = false) Long entityYearId,
            @RequestParam(required = false) Long yearId,
            @RequestParam(required = false) ActionType action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return logService.getLogs(entityType, entityTypes, baseEntityId, entityYearId, yearId, action, startDate, endDate, page, size);
    }
}