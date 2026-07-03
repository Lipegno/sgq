package com.rodrigommfreitas.coreservice.macroprocess;

import com.fasterxml.jackson.databind.JsonNode;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
import com.rodrigommfreitas.coreservice.macroprocess.dto.CreateMacroProcessRequest;
import com.rodrigommfreitas.coreservice.macroprocess.dto.CreateMacroProcessResponse;
import com.rodrigommfreitas.coreservice.macroprocess.dto.MacroProcessOptionResponse;
import com.rodrigommfreitas.coreservice.macroprocess.dto.UpdateMacroProcessRequest;
import com.rodrigommfreitas.coreservice.process.Process;
import com.rodrigommfreitas.coreservice.process.ProcessYearRepository;
import com.rodrigommfreitas.coreservice.process.dto.ProcessResponse;
import com.rodrigommfreitas.coreservice.process.dto.UpdateProcessRequest;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MacroProcessService {

    private final MacroProcessRepository macroProcessRepository;
    private final MacroProcessYearRepository macroProcessYearRepository;
    private final ProcessYearRepository processYearRepository;
    private final YearRepository yearRepository;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    @Transactional
    public CreateMacroProcessResponse create(CreateMacroProcessRequest request) {

        if (macroProcessRepository.existsByName(request.name())) {
            throw new IllegalArgumentException("Macro process with this name already exists");
        }

        Year year = yearRepository.findById(request.yearId())
                .orElseThrow(() -> new IllegalArgumentException("Year not found"));

        MacroProcess macroProcess = new MacroProcess();
        macroProcess.setName(request.name());

        macroProcessRepository.save(macroProcess);

        MacroProcessYear macroProcessYear = new MacroProcessYear();
        macroProcessYear.setMacroProcess(macroProcess);
        macroProcessYear.setYear(year);

        macroProcessYearRepository.save(macroProcessYear);
        Long userId = UserContextHolder.getUserId();

        // Log
        Map<String, Object> fields = Map.of(
                "name", macroProcess.getName(),
                "yearId", year.getYear()
        );

        JsonNode detailsNode = logDetailsBuilder.buildCreated(fields);

        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.MACRO_PROCESS,
                macroProcess.getId(),
                macroProcessYear.getId(),
                year.getId(),
                macroProcess.getName(),
                ActionType.CREATED,
                detailsNode
        ));

        return new CreateMacroProcessResponse(
                macroProcess.getId(),
                macroProcess.getName(),
                year.getId()
        );
    }

    @Transactional
    public CreateMacroProcessResponse updateMacroProcess(Long id, UpdateMacroProcessRequest request) {
        MacroProcess macroProcess = macroProcessRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Macro Process not found"));

        Map<String, Object> oldFields = new HashMap<>();
        Map<String, Object> newFields = new HashMap<>();

        // NAME
        if (request.name() != null && !request.name().equals(macroProcess.getName())) {
            oldFields.put("name", macroProcess.getName());
            newFields.put("name", request.name());
            macroProcess.setName(request.name());
        }




        // LOG only if something changed
        if (!oldFields.isEmpty()) {
            JsonNode details = logDetailsBuilder.buildUpdated(oldFields, newFields);

            logService.createLog(new CreateLogRequest(
                    UserContextHolder.getUserId(),
                    EntityType.MACRO_PROCESS,
                    macroProcess.getId(),
                    null, // or macroProcessYearId if applicable
                    null,
                    macroProcess.getName(),
                    ActionType.UPDATED,
                    details
            ));
        }

        return mapToResponse(macroProcess);
    }

    @Transactional(readOnly = true)
    public List<CreateMacroProcessResponse> getByYear(Long yearId) {

        List<MacroProcessYear> macroProcessYears =
                macroProcessYearRepository.findByYearId(yearId);

        return macroProcessYears.stream()
                .map(mpy -> new CreateMacroProcessResponse(
                        mpy.getMacroProcess().getId(),
                        mpy.getMacroProcess().getName(),
                        mpy.getYear().getId()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MacroProcessOptionResponse> getMacroProcessesByYear(Long yearId) {

        return macroProcessYearRepository.findByYearId(yearId)
                .stream()
                .map(mpy -> new MacroProcessOptionResponse(
                        mpy.getId(),
                        mpy.getMacroProcess().getId(),
                        mpy.getMacroProcess().getName()
                ))
                .toList();
    }

    @Transactional
    public void deleteMacroProcess(Long id) {
        MacroProcess macroProcess = macroProcessRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Macro process not found"));

        processYearRepository.nullifyMacroProcessYearByMacroProcessId(id);
        macroProcessYearRepository.deleteByMacroProcessId(id);

        Long userId = UserContextHolder.getUserId();

        Map<String, Object> fields = Map.of("name", macroProcess.getName());
        JsonNode detailsNode = logDetailsBuilder.buildDeleted(fields);

        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.MACRO_PROCESS,
                macroProcess.getId(),
                null,
                null,
                macroProcess.getName(),
                ActionType.DELETED,
                detailsNode
        ));

        macroProcessRepository.delete(macroProcess);
    }

    private CreateMacroProcessResponse mapToResponse(MacroProcess mp) {
        return new CreateMacroProcessResponse(
                mp.getId(),
                mp.getName(),
                null
        );
    }
}