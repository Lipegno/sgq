package com.rodrigommfreitas.coreservice.managementreview.dto;

import com.rodrigommfreitas.coreservice.nonconformity.NonConformityOrigin;
import com.rodrigommfreitas.coreservice.nonconformity.NonConformityStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ManagementReviewSummaryResponse(
        Overview overview,
        List<ProcessSummary> processes,
        List<ObjectiveSummary> objectives,
        List<NonConformitySummary> nonConformities,
        List<ActionSummary> actions,
        DocumentsSummary documents,
        AuditsSummary audits,
        CustomerSatisfactionSummary customerSatisfaction,
        SuppliersSummary suppliers,
        ChangesSummary changes
) {

    public record Overview(
            int processes,
            int processesWithResponsible,
            int processesWithoutResponsible,
            int indicators,
            int indicatorsWithMeasurements,
            int indicatorsWithoutMeasurements,
            int objectives,
            int objectivesAchieved,
            int objectivesInProgress,
            int nonConformities,
            int nonConformitiesOpen,
            int nonConformitiesResolved
    ) {}

    public record ProcessSummary(
            Long processYearId,
            Long processId,
            String name,
            List<String> responsibles,
            int indicatorCount,
            int indicatorsWithoutMeasurements,
            List<IndicatorSummary> indicators
    ) {}

    public record IndicatorSummary(
            Long indicatorYearId,
            Long indicatorId,
            String name,
            BigDecimal goal,
            BigDecimal lastMeasurement,
            LocalDate lastMeasurementDate,
            boolean hasMeasurements
    ) {}

    public record ObjectiveSummary(
            Long qualityObjectiveYearId,
            Long qualityObjectiveId,
            String name,
            String status,
            int processCount,
            int indicatorCount
    ) {}

    public record NonConformitySummary(
            Long nonConformityYearId,
            Long nonConformityId,
            String name,
            NonConformityOrigin origin,
            NonConformityStatus status,
            int correctiveActionCount
    ) {}

    /**
     * Ação agregada a partir dos módulos que já têm o seu próprio plano de ação
     * (Não Conformidades, Objetivos da Qualidade, Oportunidades de Melhoria, Riscos e Oportunidades).
     * status é normalizado para "PENDING" | "IN_PROGRESS" | "FINISHED".
     */
    public record ActionSummary(
            String origin,
            String originName,
            Long actionId,
            String title,
            String responsible,
            String status,
            String deadline
    ) {}

    /**
     * Estado documental global do sistema. Ao contrário dos restantes blocos deste
     * resumo, os documentos não estão associados a um ciclo/ano, por isso estes
     * números refletem o sistema todo, não só o ano selecionado na Revisão pela Gestão.
     */
    public record DocumentsSummary(
            long total,
            long inForce,
            long pendingApproval,
            long withoutApprovedVersion
    ) {}

    /** Auditorias do ano (9.3.2 c). */
    public record AuditsSummary(
            int total,
            int finished,
            int planned,
            int canceled,
            int internal,
            int external
    ) {}

    /** Satisfação de clientes/estudantes: se há relatório do ano e quantos documentos o suportam. */
    public record CustomerSatisfactionSummary(
            boolean hasYear,
            int documents
    ) {}

    /**
     * Desempenho dos fornecedores no ano: avaliações registadas e distribuição por
     * classificação (texto livre, agrupado tal como foi escrito; vazio conta como "Sem classificação").
     */
    public record SuppliersSummary(
            int suppliers,
            int reviews,
            int suppliersEvaluated,
            List<ClassificationCount> classifications
    ) {}

    public record ClassificationCount(String classification, int count) {}

    /** Alterações ao sistema criadas no ano (6.3 / 9.3.2). */
    public record ChangesSummary(
            int total,
            int initiated,
            int inProgress,
            int finished,
            int cancelled
    ) {}
}
