package com.rodrigommfreitas.coreservice.managementreview;

import com.rodrigommfreitas.coreservice.document.Document;
import com.rodrigommfreitas.coreservice.audit.AuditRepository;
import com.rodrigommfreitas.coreservice.audit.AuditStatus;
import com.rodrigommfreitas.coreservice.audit.AuditType;
import com.rodrigommfreitas.coreservice.change.ChangeRepository;
import com.rodrigommfreitas.coreservice.change.ChangeStatus;
import com.rodrigommfreitas.coreservice.customersatisfaction.CustomerSatisfactionYearRepository;
import com.rodrigommfreitas.coreservice.supplier.SupplierRepository;
import com.rodrigommfreitas.coreservice.document.DocumentRepository;
import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.DocumentStatus;
import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;
import com.rodrigommfreitas.coreservice.indicator.IndicatorYear;
import com.rodrigommfreitas.coreservice.indicator.IndicatorYearRepository;
import com.rodrigommfreitas.coreservice.managementreview.dto.ManagementReviewResponse;
import com.rodrigommfreitas.coreservice.managementreview.dto.ManagementReviewSummaryResponse;
import com.rodrigommfreitas.coreservice.managementreview.dto.ManagementReviewYearDetail;
import com.rodrigommfreitas.coreservice.managementreview.dto.UpdateManagementReviewRequest;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
import com.rodrigommfreitas.coreservice.improvementopportunity.ImprovementAction;
import com.rodrigommfreitas.coreservice.improvementopportunity.ImprovementActionStatus;
import com.rodrigommfreitas.coreservice.improvementopportunity.ImprovementOpportunityYear;
import com.rodrigommfreitas.coreservice.improvementopportunity.ImprovementOpportunityYearRepository;
import com.rodrigommfreitas.coreservice.measurement.Measurement;
import com.rodrigommfreitas.coreservice.nonconformity.CorrectiveAction;
import com.rodrigommfreitas.coreservice.nonconformity.CorrectiveActionStatus;
import com.rodrigommfreitas.coreservice.nonconformity.NonConformityStatus;
import com.rodrigommfreitas.coreservice.nonconformity.NonConformityYear;
import com.rodrigommfreitas.coreservice.nonconformity.NonConformityYearRepository;
import com.rodrigommfreitas.coreservice.process.ProcessYear;
import com.rodrigommfreitas.coreservice.process.ProcessYearRepository;
import com.rodrigommfreitas.coreservice.qualityobjective.ObjectiveAction;
import com.rodrigommfreitas.coreservice.qualityobjective.QualityObjectiveStatus;
import com.rodrigommfreitas.coreservice.qualityobjective.QualityObjectiveYear;
import com.rodrigommfreitas.coreservice.qualityobjective.QualityObjectiveYearRepository;
import com.rodrigommfreitas.coreservice.riskopportunity.ActionStatus;
import com.rodrigommfreitas.coreservice.riskopportunity.RiskAction;
import com.rodrigommfreitas.coreservice.riskopportunity.RiskOpportunityYear;
import com.rodrigommfreitas.coreservice.riskopportunity.RiskOpportunityYearRepository;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import com.rodrigommfreitas.coreservice.user.User;
import com.rodrigommfreitas.coreservice.user.UserRepository;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;


@Service
@RequiredArgsConstructor
public class ManagementReviewService {

    private final ManagementReviewRepository repository;
    private final ManagementReviewYearRepository yearRepository;
    private final YearRepository yearRepo;
    private final DocumentRepository documentRepository;
    private final DocumentService documentService;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;
    private final ProcessYearRepository processYearRepository;
    private final IndicatorYearRepository indicatorYearRepository;
    private final QualityObjectiveYearRepository qualityObjectiveYearRepository;
    private final NonConformityYearRepository nonConformityYearRepository;
    private final ImprovementOpportunityYearRepository improvementOpportunityYearRepository;
    private final RiskOpportunityYearRepository riskOpportunityYearRepository;
    private final UserRepository userRepository;
    private final AuditRepository auditRepository;
    private final CustomerSatisfactionYearRepository customerSatisfactionYearRepository;
    private final SupplierRepository supplierRepository;
    private final ChangeRepository changeRepository;

    @Transactional(readOnly = true)
    public ManagementReviewResponse get() {
        ManagementReview mr = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("ManagementReview not found"));
        return mapToSingletonResponse(mr);
    }

    @Transactional
    public ManagementReviewResponse update(UpdateManagementReviewRequest request) {
        ManagementReview mr = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("ManagementReview not found"));

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("description", mr.getDescription() != null ? mr.getDescription() : "");

        if (request.description() != null) {
            mr.setDescription(request.description());
        }

        repository.save(mr);

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("description", mr.getDescription() != null ? mr.getDescription() : "");

        if (!oldFields.equals(newFields)) {
            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.MANAGEMENT_REVIEW,
                    1L,
                    null,
                    null,
                    "Revisão pela Gestão",
                    ActionType.UPDATED,
                    logDetailsBuilder.buildUpdated(oldFields, newFields)
            ));
        }

        return mapToSingletonResponse(mr);
    }

    @Transactional
    public ManagementReviewYearDetail getOrCreateManagementReviewYear(Long yearId) {
        ManagementReview mr = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("ManagementReview not found"));

        return yearRepository.findByManagementReviewIdAndYearId(1L, yearId)
                .map(this::mapToYearDetail)
                .orElseGet(() -> {
                    Year year = yearRepo.findById(yearId)
                            .orElseThrow(() -> new EntityNotFoundException("Year not found with id " + yearId));

                    ManagementReviewYear mry = ManagementReviewYear.builder()
                            .managementReview(mr)
                            .year(year)
                            .build();

                    yearRepository.save(mry);
                    mr.getYears().add(mry);
                    return mapToYearDetail(mry);
                });
    }

    @Transactional
    public ManagementReviewYearDetail attachDocument(Long yearId, Long documentId) {
        ManagementReview mr = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("ManagementReview not found"));

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with id " + documentId));

        ManagementReviewYear mry = yearRepository.findByManagementReviewIdAndYearId(1L, yearId)
                .orElseGet(() -> {
                    Year year = yearRepo.findById(yearId)
                            .orElseThrow(() -> new EntityNotFoundException("Year not found with id " + yearId));
                    ManagementReviewYear newMry = ManagementReviewYear.builder()
                            .managementReview(mr)
                            .year(year)
                            .build();
                    yearRepository.save(newMry);
                    mr.getYears().add(newMry);
                    return newMry;
                });

        mry.getDocuments().add(document);
        yearRepository.save(mry);

        String yearValue = mry.getYear() != null ? String.valueOf(mry.getYear().getYear()) : String.valueOf(yearId);
        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.MANAGEMENT_REVIEW,
                1L,
                mry.getId(),
                yearId,
                "Revisão pela Gestão — " + yearValue,
                ActionType.ASSOCIATED,
                logDetailsBuilder.buildAssociation("document", document.getId().toString(), "associated")
        ));

        return mapToYearDetail(mry);
    }

    @Transactional
    public void deleteDocument(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with id " + documentId));

        ManagementReview mr = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("ManagementReview not found"));

        List<ManagementReviewYear> yearsToRemove = new ArrayList<>();
        for (ManagementReviewYear mry : mr.getYears()) {
            if (mry.getDocuments().remove(document)) {
                if (mry.getDocuments().isEmpty()) {
                    yearsToRemove.add(mry);
                } else {
                    yearRepository.save(mry);
                }
            }
        }

        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.MANAGEMENT_REVIEW,
                1L,
                null,
                null,
                "Revisão pela Gestão",
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("document", document.getId().toString(), "disassociated")
        ));

        for (ManagementReviewYear mry : yearsToRemove) {
            mr.getYears().remove(mry);
            yearRepository.delete(mry);
        }

        documentService.deleteDocument(documentId);
    }

    @Transactional(readOnly = true)
    public ManagementReviewYearDetail getByYear(Long yearId) {
        ManagementReviewYear mry = yearRepository.findByManagementReviewIdAndYearId(1L, yearId)
                .orElseThrow(() -> new EntityNotFoundException("No evidence found for year " + yearId));
        return mapToYearDetail(mry);
    }

    public ManagementReviewSummaryResponse getSummary(Long yearId) {

        // 1) Buscar todos os processos do ciclo
        List<ProcessYear> processYears = processYearRepository.findByYearId(yearId);

        // 2) Buscar todos os indicadores do ciclo
        List<IndicatorYear> indicatorYears = indicatorYearRepository.findByYearId(yearId);

        // 3) Buscar todos os objetivos do ciclo
        List<QualityObjectiveYear> objectiveYears =
                qualityObjectiveYearRepository.findByYearId(yearId);

        // 4) Buscar todas as não conformidades do ciclo
        List<NonConformityYear> nonConformityYears =
                nonConformityYearRepository.findAllByYearId(yearId);

        // 5) Buscar todas as oportunidades de melhoria do ciclo
        List<ImprovementOpportunityYear> improvementOpportunityYears =
                improvementOpportunityYearRepository.findAllByYearId(yearId);

        // 6) Buscar todos os riscos e oportunidades do ciclo
        List<RiskOpportunityYear> riskOpportunityYears =
                riskOpportunityYearRepository.findByYearId(yearId);

        // ----------------------------------------------------------------------
        // OVERVIEW
        // ----------------------------------------------------------------------

        int totalProcesses = processYears.size();

        int processesWithResponsible = (int) processYears.stream()
                .filter(py -> py.getResponsibles() != null && !py.getResponsibles().isEmpty())
                .count();

        int processesWithoutResponsible =
                totalProcesses - processesWithResponsible;

        int totalIndicators = indicatorYears.size();

        int indicatorsWithMeasurements = (int) indicatorYears.stream()
                .filter(iy -> iy.getMeasurements() != null && !iy.getMeasurements().isEmpty())
                .count();

        int indicatorsWithoutMeasurements =
                totalIndicators - indicatorsWithMeasurements;

        int totalObjectives = objectiveYears.size();

        int objectivesAchieved = (int) objectiveYears.stream()
                .filter(qoy -> qoy.getStatus() == QualityObjectiveStatus.ACHIEVED)
                .count();

        int objectivesInProgress = (int) objectiveYears.stream()
                .filter(qoy -> qoy.getStatus() == QualityObjectiveStatus.IN_PROGRESS)
                .count();

        int totalNonConformities = nonConformityYears.size();

        int nonConformitiesOpen = (int) nonConformityYears.stream()
                .filter(ncy -> ncy.getStatus() == NonConformityStatus.OPEN
                        || ncy.getStatus() == NonConformityStatus.UNDER_TREATMENT)
                .count();

        int nonConformitiesResolved =
                totalNonConformities - nonConformitiesOpen;

        var overview = new ManagementReviewSummaryResponse.Overview(
                totalProcesses,
                processesWithResponsible,
                processesWithoutResponsible,
                totalIndicators,
                indicatorsWithMeasurements,
                indicatorsWithoutMeasurements,
                totalObjectives,
                objectivesAchieved,
                objectivesInProgress,
                totalNonConformities,
                nonConformitiesOpen,
                nonConformitiesResolved
        );

        // ----------------------------------------------------------------------
        // PROCESS DETAILS
        // ----------------------------------------------------------------------

        List<ManagementReviewSummaryResponse.ProcessSummary> processSummaries =
                processYears.stream()
                        .map(processYear -> {

                            List<String> responsibles = processYear.getResponsibles()
                                    .stream()
                                    .map(hry -> hry.getHumanResource().getName())
                                    .sorted()
                                    .toList();

                            List<ManagementReviewSummaryResponse.IndicatorSummary> indicators =
                                    processYear.getIndicators()
                                            .stream()
                                            .map(indicatorYear -> {

                                                Measurement lastMeasurement =
                                                        indicatorYear.getMeasurements()
                                                                .stream()
                                                                .max(Comparator.comparing(
                                                                        Measurement::getMeasurementDate
                                                                ))
                                                                .orElse(null);

                                                return new ManagementReviewSummaryResponse.IndicatorSummary(
                                                        indicatorYear.getId(),
                                                        indicatorYear.getIndicator().getId(),
                                                        indicatorYear.getIndicator().getName(),
                                                        indicatorYear.getGoal(),
                                                        lastMeasurement != null
                                                                ? lastMeasurement.getMeasurementValue()
                                                                : null,
                                                        lastMeasurement != null
                                                                ? lastMeasurement.getMeasurementDate()
                                                                : null,
                                                        lastMeasurement != null
                                                );
                                            })
                                            .sorted(
                                                    Comparator.comparing(
                                                            ManagementReviewSummaryResponse
                                                                    .IndicatorSummary::name
                                                    )
                                            )
                                            .toList();

                            long withoutMeasurements = indicators.stream()
                                    .filter(i -> !i.hasMeasurements())
                                    .count();

                            return new ManagementReviewSummaryResponse.ProcessSummary(
                                    processYear.getId(),
                                    processYear.getProcess().getId(),
                                    processYear.getProcess().getName(),
                                    responsibles,
                                    indicators.size(),
                                    (int) withoutMeasurements,
                                    indicators
                            );
                        })
                        .sorted(
                                Comparator.comparing(
                                        ManagementReviewSummaryResponse.ProcessSummary::name
                                )
                        )
                        .toList();

        List<ManagementReviewSummaryResponse.ObjectiveSummary> objectiveSummaries =
                objectiveYears.stream()
                        .map(objectiveYear ->
                                new ManagementReviewSummaryResponse.ObjectiveSummary(
                                        objectiveYear.getId(),
                                        objectiveYear.getQualityObjective().getId(),
                                        objectiveYear.getQualityObjective().getObjectiveTitle(),
                                        objectiveYear.getStatus().name(),
                                        objectiveYear.getProcesses() != null
                                                ? objectiveYear.getProcesses().size()
                                                : 0,
                                        objectiveYear.getIndicators() != null
                                                ? objectiveYear.getIndicators().size()
                                                : 0
                                )
                        )
                        .sorted(
                                Comparator.comparing(
                                        ManagementReviewSummaryResponse.ObjectiveSummary::name
                                )
                        )
                        .toList();

        List<ManagementReviewSummaryResponse.NonConformitySummary> nonConformitySummaries =
                nonConformityYears.stream()
                        .map(ncy ->
                                new ManagementReviewSummaryResponse.NonConformitySummary(
                                        ncy.getId(),
                                        ncy.getNonConformity().getId(),
                                        ncy.getNonConformity().getName(),
                                        ncy.getNonConformity().getOrigin(),
                                        ncy.getStatus(),
                                        ncy.getNonConformity().getCorrectiveActions() != null
                                                ? ncy.getNonConformity().getCorrectiveActions().size()
                                                : 0
                                )
                        )
                        .sorted(
                                Comparator.comparing(
                                        ManagementReviewSummaryResponse.NonConformitySummary::name
                                )
                        )
                        .toList();

        // ----------------------------------------------------------------------
        // AÇÕES — agregadas dos 4 módulos que já têm o seu próprio plano de ação
        // ----------------------------------------------------------------------

        List<ManagementReviewSummaryResponse.ActionSummary> actionSummaries = new ArrayList<>();

        for (QualityObjectiveYear qoy : objectiveYears) {
            for (ObjectiveAction action : qoy.getActions()) {
                actionSummaries.add(new ManagementReviewSummaryResponse.ActionSummary(
                        "Objetivo da Qualidade",
                        qoy.getQualityObjective().getObjectiveTitle(),
                        action.getId(),
                        action.getActionText(),
                        resolveUserName(action.getResponsibleId()),
                        action.isTargetAchieved() ? "FINISHED" : "IN_PROGRESS",
                        action.getDeadline()
                ));
            }
        }

        for (NonConformityYear ncy : nonConformityYears) {
            for (CorrectiveAction action : ncy.getNonConformity().getCorrectiveActions()) {
                actionSummaries.add(new ManagementReviewSummaryResponse.ActionSummary(
                        "Não Conformidade",
                        ncy.getNonConformity().getName(),
                        action.getId(),
                        action.getName(),
                        userDisplayName(action.getResponsible()),
                        normalizeStatus(action.getStatus()),
                        null
                ));
            }
        }

        for (ImprovementOpportunityYear ioy : improvementOpportunityYears) {
            for (ImprovementAction action : ioy.getImprovementOpportunity().getImprovementActions()) {
                actionSummaries.add(new ManagementReviewSummaryResponse.ActionSummary(
                        "Oportunidade de Melhoria",
                        ioy.getImprovementOpportunity().getName(),
                        action.getId(),
                        action.getName(),
                        userDisplayName(action.getResponsible()),
                        normalizeStatus(action.getStatus()),
                        null
                ));
            }
        }

        for (RiskOpportunityYear roy : riskOpportunityYears) {
            for (RiskAction action : roy.getActions()) {
                actionSummaries.add(new ManagementReviewSummaryResponse.ActionSummary(
                        "Risco / Oportunidade",
                        roy.getRiskOpportunity().getDescription(),
                        action.getId(),
                        action.getTitle(),
                        userDisplayName(action.getResponsible()),
                        normalizeStatus(action.getStatus()),
                        null
                ));
            }
        }

        actionSummaries.sort(
                Comparator.comparing(ManagementReviewSummaryResponse.ActionSummary::origin)
                        .thenComparing(ManagementReviewSummaryResponse.ActionSummary::title,
                                Comparator.nullsLast(Comparator.naturalOrder()))
        );

        // ----------------------------------------------------------------------
        // DOCUMENTOS — estado global do sistema (documentos não são anuais)
        // ----------------------------------------------------------------------

        long totalDocuments = documentRepository.count();
        long documentsInForce = documentRepository.countByCurrentVersionStatus(DocumentStatus.APPROVED);
        long documentsPendingApproval = documentRepository.countByCurrentVersionStatus(DocumentStatus.UNDER_REVIEW);
        long documentsWithoutApprovedVersion = totalDocuments - documentsInForce;

        var documentsSummary = new ManagementReviewSummaryResponse.DocumentsSummary(
                totalDocuments,
                documentsInForce,
                documentsPendingApproval,
                documentsWithoutApprovedVersion
        );

        return new ManagementReviewSummaryResponse(
                overview,
                processSummaries,
                objectiveSummaries,
                nonConformitySummaries,
                actionSummaries,
                documentsSummary,
                buildAudits(yearId),
                buildCustomerSatisfaction(yearId),
                buildSuppliers(yearId),
                buildChanges(yearId)
        );
    }

    private ManagementReviewSummaryResponse.AuditsSummary buildAudits(Long yearId) {
        var audits = auditRepository.findByYearId(yearId);
        return new ManagementReviewSummaryResponse.AuditsSummary(
                audits.size(),
                (int) audits.stream().filter(a -> a.getStatus() == AuditStatus.FINISHED).count(),
                (int) audits.stream().filter(a -> a.getStatus() != null
                        && a.getStatus() != AuditStatus.FINISHED && a.getStatus() != AuditStatus.CANCELED).count(),
                (int) audits.stream().filter(a -> a.getStatus() == AuditStatus.CANCELED).count(),
                (int) audits.stream().filter(a -> a.getType() == AuditType.INTERNAL).count(),
                (int) audits.stream().filter(a -> a.getType() == AuditType.EXTERNAL).count()
        );
    }

    private ManagementReviewSummaryResponse.CustomerSatisfactionSummary buildCustomerSatisfaction(Long yearId) {
        var years = customerSatisfactionYearRepository.findAllByYearId(yearId);
        return new ManagementReviewSummaryResponse.CustomerSatisfactionSummary(
                !years.isEmpty(),
                years.stream().mapToInt(y -> y.getDocuments() == null ? 0 : y.getDocuments().size()).sum()
        );
    }

    private ManagementReviewSummaryResponse.SuppliersSummary buildSuppliers(Long yearId) {
        Integer calendarYear = yearRepo.findById(yearId).map(y -> y.getYear()).orElse(null);
        var suppliers = supplierRepository.findAll();
        Map<String, Integer> byClassification = new TreeMap<>();
        int reviews = 0;
        int evaluated = 0;
        for (var supplier : suppliers) {
            int count = 0;
            for (var review : supplier.getReviews()) {
                if (calendarYear == null || !calendarYear.equals(review.getEvaluationYear())) continue;
                count++;
                String c = review.getClassification();
                byClassification.merge(c == null || c.isBlank() ? "Sem classificação" : c.trim(), 1, Integer::sum);
            }
            reviews += count;
            if (count > 0) evaluated++;
        }
        var classifications = byClassification.entrySet().stream()
                .map(e -> new ManagementReviewSummaryResponse.ClassificationCount(e.getKey(), e.getValue()))
                .toList();
        return new ManagementReviewSummaryResponse.SuppliersSummary(suppliers.size(), reviews, evaluated, classifications);
    }

    private ManagementReviewSummaryResponse.ChangesSummary buildChanges(Long yearId) {
        Integer calendarYear = yearRepo.findById(yearId).map(y -> y.getYear()).orElse(null);
        if (calendarYear == null) return new ManagementReviewSummaryResponse.ChangesSummary(0, 0, 0, 0, 0);
        var changes = changeRepository.findByCreatedAtBetween(
                java.time.LocalDate.of(calendarYear, 1, 1).atStartOfDay(),
                java.time.LocalDate.of(calendarYear, 12, 31).atTime(23, 59, 59));
        return new ManagementReviewSummaryResponse.ChangesSummary(
                changes.size(),
                (int) changes.stream().filter(c -> c.getStatus() == ChangeStatus.INITIATED).count(),
                (int) changes.stream().filter(c -> c.getStatus() == ChangeStatus.IN_PROGRESS).count(),
                (int) changes.stream().filter(c -> c.getStatus() == ChangeStatus.FINISHED).count(),
                (int) changes.stream().filter(c -> c.getStatus() == ChangeStatus.CANCELLED).count()
        );
    }



    private ManagementReviewResponse mapToSingletonResponse(ManagementReview mr) {
        List<ManagementReviewYearDetail> yearDetails = mr.getYears() != null
                ? mr.getYears().stream()
                .map(this::mapToYearDetail)
                .toList()
                : List.of();

        return new ManagementReviewResponse(
                mr.getId(),
                mr.getDescription(),
                yearDetails
        );
    }

    private ManagementReviewYearDetail mapToYearDetail(ManagementReviewYear mry) {
        List<DocumentWithVersionsResponse> documents = mry.getDocuments() != null
                ? mry.getDocuments().stream()
                .map(doc -> documentService.getDocumentWithVersions(doc.getId()))
                .toList()
                : List.of();

        return new ManagementReviewYearDetail(
                mry.getId(),
                mry.getYear().getId(),
                mry.getYear().getYear(),
                documents
        );
    }

    private String userDisplayName(User user) {
        if (user == null) return "Não definido";
        String first = user.getFirstName() != null ? user.getFirstName() : "";
        String last = user.getLastName() != null ? user.getLastName() : "";
        String name = (first + " " + last).trim();
        return name.isEmpty() ? "Não definido" : name;
    }

    private String resolveUserName(Long userId) {
        if (userId == null) return "Não definido";
        return userRepository.findById(userId)
                .map(this::userDisplayName)
                .orElse("Não definido");
    }

    private String normalizeStatus(CorrectiveActionStatus status) {
        if (status == null) return "PENDING";
        return switch (status) {
            case REGISTERED -> "PENDING";
            case IN_PROGRESS -> "IN_PROGRESS";
            case FINISHED -> "FINISHED";
        };
    }

    private String normalizeStatus(ImprovementActionStatus status) {
        if (status == null) return "PENDING";
        return switch (status) {
            case REGISTERED -> "PENDING";
            case IN_PROGRESS -> "IN_PROGRESS";
            case FINISHED -> "FINISHED";
        };
    }

    private String normalizeStatus(ActionStatus status) {
        if (status == null) return "PENDING";
        return switch (status) {
            case OPEN -> "PENDING";
            case IN_PROGRESS -> "IN_PROGRESS";
            case CLOSED -> "FINISHED";
        };
    }

}
