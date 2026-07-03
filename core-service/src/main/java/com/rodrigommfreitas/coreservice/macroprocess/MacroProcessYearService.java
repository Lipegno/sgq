package com.rodrigommfreitas.coreservice.macroprocess;

import com.rodrigommfreitas.coreservice.indicator.IndicatorYear;
import com.rodrigommfreitas.coreservice.indicator.IndicatorYearRepository;
import com.rodrigommfreitas.coreservice.indicator.dto.IndicatorHierarchyResponse;
import com.rodrigommfreitas.coreservice.measurement.dto.MeasurementResponse;
import com.rodrigommfreitas.coreservice.process.ProcessYear;
import com.rodrigommfreitas.coreservice.process.ProcessYearRepository;
import com.rodrigommfreitas.coreservice.process.dto.DocumentSummary;
import com.rodrigommfreitas.coreservice.department.dto.DepartmentResponse;
import com.rodrigommfreitas.coreservice.process.dto.ProcessHierarchyResponse;
import com.rodrigommfreitas.coreservice.process.dto.QualityObjectiveInfo;
import com.rodrigommfreitas.coreservice.user.UserReferenceService;
import com.rodrigommfreitas.coreservice.user.dto.UserSummary;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import com.rodrigommfreitas.coreservice.macroprocess.dto.*;
import com.rodrigommfreitas.coreservice.year.dto.AssociateYearsRequest;
import com.rodrigommfreitas.coreservice.year.dto.YearOption;
import com.rodrigommfreitas.coreservice.document.DocumentRepository;
import com.rodrigommfreitas.coreservice.document.Document;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MacroProcessYearService {

    private final MacroProcessRepository macroProcessRepository;
    private final MacroProcessYearRepository macroProcessYearRepository;
    private final ProcessYearRepository processYearRepository;
    private final IndicatorYearRepository indicatorYearRepository;
    private final YearRepository yearRepository;
    private final UserReferenceService userRefService;
    private final com.rodrigommfreitas.coreservice.department.UserDepartmentRepository userDepartmentRepository;
    private final DocumentRepository documentRepository;


    @Transactional
    public void disassociateYears(Long macroProcessId, AssociateYearsRequest request, boolean full) {

        // Count total years associated with this macro process
        long totalYears = macroProcessYearRepository.countByMacroProcessId(macroProcessId);

        // If user tries to remove ALL (or more than allowed)
        if (totalYears - request.yearIds().size() < 1) {
            throw new IllegalArgumentException(
                    "A macro process must be associated with at least one year."
            );
        }

        for (Long yearId : request.yearIds()) {

            MacroProcessYear macroYear =
                    macroProcessYearRepository.findByMacroProcessIdAndYearId(macroProcessId, yearId);

            if (macroYear == null) {
                throw new IllegalArgumentException(
                        "MacroProcessYear not found for yearId: " + yearId
                );
            }

            if (full) {
                // Remove child processes + indicators
                for (ProcessYear processYear : macroYear.getProcesses()) {

                    // Remove indicator associations
                    for (IndicatorYear indicatorYear : processYear.getIndicators()) {
                        indicatorYear.getProcesses().remove(processYear);
                    }

                    processYear.getIndicators().clear();
                }

                // Remove processes from macroprocessyear
                macroYear.getProcesses().clear();
            }

            // Remove macroprocess-year
            macroProcessYearRepository.delete(macroYear);
        }
    }

    @Transactional
    public void associateYears(Long macroProcessId, List<Long> yearIds) {

        var macroProcess = macroProcessRepository.findById(macroProcessId)
                .orElseThrow(() -> new RuntimeException("MacroProcess not found"));

        for (Long yearId : yearIds) {

            Year year = yearRepository.findById(yearId)
                    .orElseThrow(() -> new RuntimeException("Year not found"));

            boolean exists = macroProcessYearRepository
                    .existsByMacroProcessIdAndYearId(macroProcessId, yearId);

            if (exists) continue;

            MacroProcessYear macroYear = MacroProcessYear.builder()
                    .macroProcess(macroProcess)
                    .year(year)
                    .build();

            macroProcessYearRepository.save(macroYear);
        }
    }

    // ✅ ASSOCIATION WITH FULL COPY
    @Transactional
    public void associateYearsWithChildren(Long macroProcessId, List<Long> yearIds) {

        var macroProcess = macroProcessRepository.findById(macroProcessId)
                .orElseThrow(() -> new RuntimeException("MacroProcess not found"));

        // 🔹 Get existing structure (source)
        var existingMacroYears = macroProcess.getMacroProcessYears();

        if (existingMacroYears.isEmpty()) {
            throw new RuntimeException("MacroProcess has no existing years to copy from");
        }

        // 👉 Pick ONE as source (latest or first)
        MacroProcessYear sourceMacroYear = existingMacroYears.iterator().next();

        for (Long yearId : yearIds) {

            Year year = yearRepository.findById(yearId)
                    .orElseThrow(() -> new RuntimeException("Year not found"));

            boolean exists = macroProcessYearRepository
                    .existsByMacroProcessIdAndYearId(macroProcessId, yearId);

            if (exists) continue;

            // 🔹 Create MacroProcessYear
            MacroProcessYear newMacroYear = MacroProcessYear.builder()
                    .macroProcess(macroProcess)
                    .year(year)
                    .build();

            macroProcessYearRepository.save(newMacroYear);

            // 🔹 Copy processes
            for (ProcessYear sourceProcessYear : sourceMacroYear.getProcesses()) {

                ProcessYear newProcessYear = ProcessYear.builder()
                        .process(sourceProcessYear.getProcess()) // reuse base entity
                        .year(year)
                        .macroProcessYear(newMacroYear)
                        .build();

                processYearRepository.save(newProcessYear);

                // 🔹 Copy indicators
                for (IndicatorYear sourceIndicatorYear : sourceProcessYear.getIndicators()) {

                    IndicatorYear newIndicatorYear = IndicatorYear.builder()
                            .indicator(sourceIndicatorYear.getIndicator())
                            .year(year)
                            .goal(sourceIndicatorYear.getGoal())
                            .build();

                    indicatorYearRepository.save(newIndicatorYear);

                    // 🔗 Link to process
                    newIndicatorYear.getProcesses().add(newProcessYear);
                }
            }
        }
    }

    @Transactional
    public HierarchyResponse getHierarchyByYear(Long yearId) {

        List<Year> allYears = yearRepository.findAll();

        List<MacroProcessHierarchyResponse> macroProcesses = macroProcessYearRepository.findByYearId(yearId)
                .stream()
                .map(macroYear -> {

                    Set<YearOption> macroYearOptions = buildYearOptionsForMacroProcess(macroYear, allYears);

                    List<ProcessHierarchyResponse> processes = macroYear.getProcesses().stream()
                            .map(py -> mapProcess(py, allYears))
                            .toList();

                    return new MacroProcessHierarchyResponse(
                            macroYear.getId(),
                            macroYear.getMacroProcess().getId(),
                            macroYear.getMacroProcess().getName(),
                            processes,
                            macroYearOptions
                    );
                })
                .toList();
        // 🔹 Standalone processes (NO macroprocess)
        List<ProcessHierarchyResponse> standaloneProcesses = processYearRepository
                .findByYearIdAndMacroProcessYearIsNull(yearId)
                .stream()
                .map(py -> mapProcess(py, allYears))
                .toList();

        return new HierarchyResponse(macroProcesses, standaloneProcesses);
    }

    // 🔹 Helpers to generate YearOptionDto
    private Set<YearOption> buildYearOptionsForMacroProcess(MacroProcessYear macroYear, List<com.rodrigommfreitas.coreservice.year.Year> allYears) {
        Set<Long> associated = macroYear.getMacroProcess().getMacroProcessYears().stream()
                .map(my -> my.getYear().getId())
                .collect(java.util.stream.Collectors.toSet());
        return allYears.stream()
                .map(y -> new YearOption(y.getId(), y.getYear(), associated.contains(y.getId())))
                .collect(java.util.stream.Collectors.toSet());
    }

    private Set<YearOption> buildYearOptionsForProcess(ProcessYear processYear, List<com.rodrigommfreitas.coreservice.year.Year> allYears) {
        Set<Long> associated = processYear.getProcess().getProcessYears().stream()
                .map(py -> py.getYear().getId())
                .collect(java.util.stream.Collectors.toSet());
        return allYears.stream()
                .map(y -> new YearOption(y.getId(), y.getYear(), associated.contains(y.getId())))
                .collect(java.util.stream.Collectors.toSet());
    }

    private Set<YearOption> buildYearOptionsForIndicator(com.rodrigommfreitas.coreservice.indicator.IndicatorYear iy, List<com.rodrigommfreitas.coreservice.year.Year> allYears) {
        Set<Long> associated = iy.getIndicator().getIndicatorYears().stream()
                .map(indY -> indY.getYear().getId())
                .collect(java.util.stream.Collectors.toSet());
        return allYears.stream()
                .map(y -> new YearOption(y.getId(), y.getYear(), associated.contains(y.getId())))
                .collect(java.util.stream.Collectors.toSet());
    }

    private ProcessHierarchyResponse mapProcess(ProcessYear processYear, List<com.rodrigommfreitas.coreservice.year.Year> allYears) {

        Set<IndicatorHierarchyResponse> indicators = processYear.getIndicators().stream()
                .map(iy -> {
                    Set<MeasurementResponse> measurements = iy.getMeasurements().stream()
                            .map(m -> new MeasurementResponse(
                                    m.getId(),
                                    m.getMeasurementDate(),
                                    m.getMeasurementValue(),
                                    m.getNotes(),
                                    m.getIndicatorYear().getId()
                            ))
                            .collect(Collectors.toSet());

                    Set<YearOption> indicatorYears = buildYearOptionsForIndicator(iy, allYears);

                    return new IndicatorHierarchyResponse(
                            iy.getId(),
                            iy.getIndicator().getId(),
                            iy.getIndicator().getName(),
                            iy.getIndicator().getFormula(),
                            iy.getIndicator().getFrequency(),
                            iy.getGoal(),
                            measurements,
                            indicatorYears
                    );
                })
                .collect(Collectors.toSet());

        Set<YearOption> processYears = buildYearOptionsForProcess(processYear, allYears);

        List<QualityObjectiveInfo> qualityObjectives = processYear.getQualityObjectives().stream()
                .map(qoy -> new QualityObjectiveInfo(
                        qoy.getQualityObjective().getId(),
                        qoy.getYear().getId(),
                        qoy.getQualityObjective().getObjectiveTitle()
                ))
                .toList();

        var process = processYear.getProcess();
        List<UserSummary> responsibles = process.getResponsibles().stream()
                .map(userRefService::fromEntity)
                .toList();
        List<DepartmentResponse> departments = process.getDepartments().stream()
                .map(dept -> new DepartmentResponse(
                        dept.getId(),
                        dept.getName(),
                        userDepartmentRepository.findByDepartmentId(dept.getId()).size()
                ))
                .toList();

        return new ProcessHierarchyResponse(
                processYear.getId(),
                process.getId(),
                process.getName(),
                process.getObjective(),
                process.getEntradasDocumentos().stream().map(this::mapDocSummary).toList(),
                process.getSaidasDocumentos().stream().map(this::mapDocSummary).toList(),
                mapDocSummary(process.getFichaDocumento()),
                process.getDocuments().stream().map(this::mapDocSummary).toList(),
                responsibles,
                departments,
                indicators,
                processYears,
                qualityObjectives
        );
    }

    private DocumentSummary mapDocSummary(Document doc) {
        if (doc == null) return null;
        var cv = doc.getCurrentVersion();
        String uploadedByFullName = "";
        String uploadedAt = "";
        if (cv != null) {
            if (cv.getUploadedBy() != null) {
                uploadedByFullName = cv.getUploadedBy().getFirstName() + " " + cv.getUploadedBy().getLastName();
            }
            if (cv.getUploadedAt() != null) {
                uploadedAt = cv.getUploadedAt().toString();
            }
        }
        return new DocumentSummary(
                doc.getId(),
                cv != null ? cv.getFileName() : "",
                cv != null ? cv.getFileType() : "",
                cv != null ? cv.getFileUrl() : "",
                uploadedByFullName,
                uploadedAt
        );
    }


    private IndicatorHierarchyResponse mapIndicator(
            com.rodrigommfreitas.coreservice.indicator.IndicatorYear indicatorYear,
            List<Year> allYears
    ) {

        Set<Long> associatedYearIds = indicatorYear.getIndicator()
                .getIndicatorYears()
                .stream()
                .map(iy -> iy.getYear().getId())
                .collect(Collectors.toSet());

        Set<YearOption> yearOptions = buildYearOptions(allYears, associatedYearIds);

        var measurements = indicatorYear.getMeasurements().stream()
                .map(m -> new MeasurementResponse(
                        m.getId(),
                        m.getMeasurementDate(),
                        m.getMeasurementValue(),
                        m.getNotes(),
                        m.getIndicatorYear().getId()
                ))
                .toList();

        return new IndicatorHierarchyResponse(
                indicatorYear.getId(),
                indicatorYear.getIndicator().getId(),
                indicatorYear.getIndicator().getName(),
                indicatorYear.getIndicator().getFormula(),
                indicatorYear.getIndicator().getFrequency(),
                indicatorYear.getGoal(),
                new HashSet<>(measurements),
                yearOptions
        );
    }

    private Set<YearOption> buildYearOptions(
            List<Year> allYears,
            Set<Long> associatedYearIds
    ) {
        return allYears.stream()
                .map(y -> new YearOption(
                        y.getId(),
                        y.getYear(),
                        associatedYearIds.contains(y.getId())
                ))
                .collect(Collectors.toSet());
    }
}