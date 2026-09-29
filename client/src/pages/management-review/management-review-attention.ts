import type { ManagementReviewSummaryResponse, NonConformityStatus } from "@/types.ts";

export const NC_OPEN_STATUSES: NonConformityStatus[] = ["OPEN", "UNDER_TREATMENT"];

export const NC_STATUS_LABELS: Record<NonConformityStatus, string> = {
  OPEN: "Aberta",
  UNDER_TREATMENT: "Em Tratamento",
  FINISHED: "Concluída",
  CLASSIFIED: "Classificada",
};

export interface AttentionItem {
  id: string;
  type: string;
  title: string;
  description: string;
}

/**
 * Lista de pontos que precisam de atenção da gestão, a partir do resumo do ciclo.
 * Partilhado entre a página e a apresentação gerada, para nunca divergirem.
 */
export function buildAttentionItems(summary: ManagementReviewSummaryResponse | undefined): AttentionItem[] {
  const items: AttentionItem[] = [];
  if (!summary) return items;

  summary.processes.forEach((process) => {
    if (process.responsibles.length === 0) {
      items.push({
        id: `process-${process.processYearId}`,
        type: "Processo",
        title: process.name,
        description: "Processo sem responsável definido.",
      });
    }
    process.indicators.forEach((indicator) => {
      if (!indicator.hasMeasurements) {
        items.push({
          id: `indicator-${indicator.indicatorYearId}`,
          type: "Indicador",
          title: indicator.name,
          description: `Sem medições no processo ${process.name}.`,
        });
      }
    });
  });

  summary.objectives.forEach((objective) => {
    if (objective.status === "IN_PROGRESS") {
      items.push({
        id: `objective-${objective.qualityObjectiveYearId}`,
        type: "Objetivo",
        title: objective.name,
        description: "Objetivo ainda em curso.",
      });
    }
  });

  summary.nonConformities.forEach((nonConformity) => {
    if (NC_OPEN_STATUSES.includes(nonConformity.status)) {
      items.push({
        id: `non-conformity-${nonConformity.nonConformityYearId}`,
        type: "Não conformidade",
        title: nonConformity.name,
        description: `Estado: ${NC_STATUS_LABELS[nonConformity.status]}.`,
      });
    }
  });

  return items;
}
