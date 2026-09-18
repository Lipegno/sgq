import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { YearSelector } from "@/components/year-selector";
import { YearDocumentsSection } from "@/components/year-documents-section";
import { LogDialog } from "@/components/log-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/context/auth-context";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  ClipboardList,
  FileText,
  History,
  Plus,
  Save,
  ShieldAlert,
  Target,
  Upload,
  Users,
} from "lucide-react";

import {
  getManagementReview,
  updateManagementReview,
  uploadManagementReviewDocument,
  getManagementReviewByYear,
  getManagementReviewSummary,
} from "@/api/core";
import type { NonConformityOrigin, NonConformityStatus } from "@/types.ts";

/* -------------------------------------------------------------------------- */
/*                       NÃO CONFORMIDADES — LABELS                           */
/* -------------------------------------------------------------------------- */

const NC_ORIGIN_LABELS: Record<NonConformityOrigin, string> = {
  INTERNAL_AUDIT: "Auditoria Interna",
  CLIENT: "Cliente",
  EXTERNAL_AUDIT: "Auditoria Externa",
  NOT_SPECIFIED: "Não Especificada",
};

const NC_STATUS_LABELS: Record<NonConformityStatus, string> = {
  OPEN: "Aberta",
  UNDER_TREATMENT: "Em Tratamento",
  FINISHED: "Concluída",
  CLASSIFIED: "Classificada",
};

const NC_OPEN_STATUSES: NonConformityStatus[] = ["OPEN", "UNDER_TREATMENT"];

/* -------------------------------------------------------------------------- */
/*                                  MOCK DATA                                 */
/* -------------------------------------------------------------------------- */


const mockAttentionItems = [
  {
    id: 1,
    type: "Indicador",
    code: "IND-07",
    title: "Tempo médio de resposta",
    process: "Gestão Académica",
    responsible: "Ana Silva",
    result: "8 dias",
    target: "≤ 5 dias",
    previousResult: "6 dias",
    observation:
      "O aumento está associado ao volume excecional de pedidos no período de matrículas.",
  },
  {
    id: 2,
    type: "Indicador",
    code: "IND-12",
    title: "Projetos submetidos",
    process: "Investigação e Desenvolvimento",
    responsible: "Maria Fernandes",
    result: "14",
    target: "18",
    previousResult: "17",
    observation:
      "O resultado ficou abaixo da meta estabelecida para o ciclo.",
  },
];

/* -------------------------------------------------------------------------- */
/*                       AÇÕES — LABELS                                       */
/* -------------------------------------------------------------------------- */

const ACTION_STATUS_LABELS: Record<
  "PENDING" | "IN_PROGRESS" | "FINISHED",
  string
> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em curso",
  FINISHED: "Concluída",
};

/* -------------------------------------------------------------------------- */
/*                                   PAGE                                     */
/* -------------------------------------------------------------------------- */

export default function ManagementReviewPage() {
  const { user, isExternal, allowedYearIds } = useAuth();
  const queryClient = useQueryClient();

  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [logOpen, setLogOpen] = useState(false);

  const [expandedProcesses, setExpandedProcesses] = useState<number[]>([]);

  /* Ata */
  const [isEditingMinutes, setIsEditingMinutes] = useState(false);
  const [minutesText, setMinutesText] = useState("");

  /* Upload */
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  /* Avaliação — mock local */
  const [globalAssessment, setGlobalAssessment] = useState("");
  const [effectivenessAssessment, setEffectivenessAssessment] = useState("");
  const [improvementOpportunities, setImprovementOpportunities] = useState("");
  const [resourceNeeds, setResourceNeeds] = useState("");

  /* ---------------------------------------------------------------------- */
  /*                               EXISTING API                              */
  /* ---------------------------------------------------------------------- */

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["management-review"],
    queryFn: getManagementReview,
  });

  const { data: yearDetail } = useQuery({
    queryKey: selectedYearId
      ? ["management-review", "year", selectedYearId]
      : ["management-review", "year", "disabled"],
    queryFn: () => getManagementReviewByYear(selectedYearId!),
    enabled: selectedYearId !== null &&
      !!data?.years?.some((year) => year.yearId === selectedYearId),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: selectedYearId
      ? ["management-review", "summary", selectedYearId]
      : ["management-review", "summary", "disabled"],
    queryFn: () => getManagementReviewSummary(selectedYearId!),
    enabled: selectedYearId !== null,
  });

  const updateMutation = useMutation({
    mutationFn: updateManagementReview,
    onSuccess: () => {
      toast.success("Ata atualizada com sucesso!");
      queryClient.invalidateQueries({
        queryKey: ["management-review"],
      });
      setIsEditingMinutes(false);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ?? "Erro ao atualizar a ata"
      );
    },
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!uploadFile || !selectedYearId) {
        throw new Error("Nenhum ficheiro selecionado");
      }

      const allDocs = yearDetail?.documents ?? [];
      const allVersions = allDocs.flatMap((document) => document.versions);

      const nextVersion =
        allVersions.length > 0
          ? Math.max(...allVersions.map((version) => Number(version.version))) + 1
          : 1;

      return uploadManagementReviewDocument(
        selectedYearId,
        uploadFile,
        nextVersion,
        Number(user?.id ?? 1),
        null
      );
    },
    onSuccess: () => {
      toast.success("Documento carregado com sucesso!");

      if (selectedYearId) {
        queryClient.invalidateQueries({
          queryKey: ["management-review", "year", selectedYearId],
        });
      }

      setUploadOpen(false);
      setUploadFile(null);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ?? "Erro ao carregar o documento"
      );
    },
  });

  /* ---------------------------------------------------------------------- */
  /*                           YEAR INITIALIZATION                            */
  /* ---------------------------------------------------------------------- */


  const selectedYear = useMemo(() => {
    return data?.years?.find((year) => year.yearId === selectedYearId)?.year;
  }, [data?.years, selectedYearId]);

  const attentionCount =
    (summary?.overview.processesWithoutResponsible ?? 0) +
    (summary?.overview.indicatorsWithoutMeasurements ?? 0) +
    (summary?.overview.objectivesInProgress ?? 0) +
    (summary?.overview.nonConformitiesOpen ?? 0);

  const attentionItems: {
    id: string;
    type: string;
    title: string;
    description: string;
  }[] = [];

  summary?.processes.forEach((process) => {
    if (process.responsibles.length === 0) {
      attentionItems.push({
        id: `process-${process.processYearId}`,
        type: "Processo",
        title: process.name,
        description: "Processo sem responsável definido.",
      });
    }

    process.indicators.forEach((indicator) => {
      if (!indicator.hasMeasurements) {
        attentionItems.push({
          id: `indicator-${indicator.indicatorYearId}`,
          type: "Indicador",
          title: indicator.name,
          description: `Sem medições no processo ${process.name}.`,
        });
      }
    });
  });

  summary?.objectives.forEach((objective) => {
    if (objective.status === "IN_PROGRESS") {
      attentionItems.push({
        id: `objective-${objective.qualityObjectiveYearId}`,
        type: "Objetivo",
        title: objective.name,
        description: "Objetivo ainda em curso.",
      });
    }
  });

  summary?.nonConformities.forEach((nonConformity) => {
    if (NC_OPEN_STATUSES.includes(nonConformity.status)) {
      attentionItems.push({
        id: `non-conformity-${nonConformity.nonConformityYearId}`,
        type: "Não conformidade",
        title: nonConformity.name,
        description: `Estado: ${NC_STATUS_LABELS[nonConformity.status]}.`,
      });
    }
  });
  const documents = yearDetail?.documents ?? [];

  /* ---------------------------------------------------------------------- */
  /*                                 HELPERS                                 */
  /* ---------------------------------------------------------------------- */

  const toggleProcess = (id: number) => {
    setExpandedProcesses((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const handleEditMinutes = () => {
    setMinutesText(data?.description ?? "");
    setIsEditingMinutes(true);
  };

  const handleSaveMinutes = () => {
    updateMutation.mutate({
      description: minutesText,
    });
  };

  /* ---------------------------------------------------------------------- */

  if (isLoading) {
    return (
      <div className="py-8 w-full max-w-6xl mx-auto flex flex-col gap-4">
        <Skeleton className="h-12 w-1/3 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-8 w-full max-w-6xl mx-auto">
        <p className="text-destructive">
          Erro ao carregar os dados da revisão pela gestão.
        </p>
      </div>
    );
  }

  return (
    <div className="py-8 w-full max-w-6xl mx-auto">
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-sm">
            <ClipboardList size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Revisão pela Gestão
            </h1>

            <p className="text-muted-foreground text-sm mt-1">
              Análise consolidada do Sistema de Gestão da Qualidade
              {selectedYear ? ` — ${selectedYear}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLogOpen(true)}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
            title="Histórico de alterações"
          >
            <History size={20} />
          </button>

          <YearSelector
            selectedYearId={selectedYearId}
            onYearChange={setSelectedYearId}
          />
        </div>
      </div>

      {selectedYearId === null ? (
        <div className="bg-card border border-border rounded-2xl py-20 text-center">
          <ClipboardList
            size={40}
            className="mx-auto text-muted-foreground mb-4"
          />
          <p className="text-muted-foreground">
            Selecione um ciclo para consultar a Revisão pela Gestão.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* ---------------------------------------------------------------- */}
          {/* 1. VISÃO GERAL                                                   */}
          {/* ---------------------------------------------------------------- */}

          <Section
            title="Visão geral do ciclo"
            subtitle="Síntese do estado do Sistema de Gestão da Qualidade"
          >
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">


              <SummaryCard
                label="Processos"
                value={String(summary?.overview.processes ?? 0)}
                detail={`${summary?.overview.processesWithResponsible ?? 0} com responsável`}
                icon={<ClipboardCheck size={20} />}
              />
              <SummaryCard
                label="Indicadores"
                value={String(summary?.overview.indicators ?? 0)}
                detail={`${summary?.overview.indicatorsWithMeasurements ?? 0} com medições`}
                icon={<Target size={20} />}
              />
              <SummaryCard
                label="Objetivos"
                value={String(summary?.overview.objectives ?? 0)}
                detail={`${summary?.overview.objectivesAchieved ?? 0} atingidos`}
                icon={<CheckCircle2 size={20} />}
              />
              <SummaryCard
                label="Não conformidades"
                value={String(summary?.overview.nonConformities ?? 0)}
                detail={`${summary?.overview.nonConformitiesOpen ?? 0} em aberto`}
                icon={<ShieldAlert size={20} />}
                attention={(summary?.overview.nonConformitiesOpen ?? 0) > 0}
              />

              <SummaryCard
                label="Requerem atenção"
                value={String(attentionCount)}
                detail={
                  attentionCount > 0
                    ? "Situações a analisar"
                    : "Sem situações pendentes"
                }
                icon={
                  attentionCount > 0
                    ? <AlertTriangle size={20} />
                    : <CheckCircle2 size={20} />
                }
                attention={attentionCount > 0}
              />
            </div>
            {attentionCount > 0 ? (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 dark:bg-amber-950/10 dark:border-amber-900 p-4">
                <AlertTriangle
                  size={18}
                  className="text-amber-600 mt-0.5 shrink-0"
                />

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Existem situações que requerem análise pela gestão.
                  </p>

                  <p className="text-sm text-muted-foreground mt-1">
                    {summary?.overview.processesWithoutResponsible ?? 0} processos sem responsável,{" "}
                    {summary?.overview.indicatorsWithoutMeasurements ?? 0} indicadores sem medições,{" "}
                    {summary?.overview.objectivesInProgress ?? 0} objetivos em curso e{" "}
                    {summary?.overview.nonConformitiesOpen ?? 0} não conformidades em aberto.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/10 dark:border-emerald-900 p-4">
                <CheckCircle2
                  size={18}
                  className="text-emerald-600 mt-0.5 shrink-0"
                />

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Não foram identificadas situações pendentes de análise.
                  </p>

                  <p className="text-sm text-muted-foreground mt-1">
                    Todos os processos têm responsável, os indicadores possuem medições e não existem objetivos em curso.
                  </p>
                </div>
              </div>
            )}
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/* 2. PROCESSOS                                                     */}
          {/* ---------------------------------------------------------------- */}

          <Section
            title="Desempenho dos processos"
            subtitle="Resultados dos processos e respetivos indicadores"
          >
            <div className="space-y-3">
              {summary?.processes.map((process) => {
                const expanded = expandedProcesses.includes(process.processYearId);

                return (
                  <div
                    key={process.processYearId}
                    className="border border-border rounded-xl overflow-hidden bg-card"
                  >
                    <button
                      onClick={() => toggleProcess(process.processYearId)}
                      className="w-full p-5 text-left hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-foreground">
                              {process.name}
                            </h3>

                            {process.responsibles.length === 0 ? (
                              <StatusBadge type="attention">
                                Sem responsável
                              </StatusBadge>
                            ) : process.indicatorCount === 0 ? (
                              <StatusBadge type="attention">
                                Sem indicadores
                              </StatusBadge>
                            ) : process.indicatorsWithoutMeasurements > 0 ? (
                              <StatusBadge type="attention">
                                {process.indicatorsWithoutMeasurements} indicador(es) sem medições
                              </StatusBadge>
                            ) : (
                              <StatusBadge type="ok">
                                Dados completos
                              </StatusBadge>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground mt-1">
                            Responsável:{" "}
                            {process.responsibles.length > 0
                              ? process.responsibles.join(", ")
                              : "Não definido"}
                          </p>
                        </div>

                        {expanded ? (
                          <ChevronUp
                            size={18}
                            className="text-muted-foreground"
                          />
                        ) : (
                          <ChevronDown
                            size={18}
                            className="text-muted-foreground"
                          />
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-6 mt-4 text-sm">
                        <span className="text-muted-foreground">
                          <strong className="text-foreground">
                            {process.indicatorCount}
                          </strong>{" "}
                          indicadores
                        </span>

                        <span className="text-emerald-700 dark:text-emerald-400">
                          {process.indicatorCount - process.indicatorsWithoutMeasurements} com medições
                        </span>

                        {process.indicatorsWithoutMeasurements > 0 && (
                          <span className="text-amber-700 dark:text-amber-400">
                            ⚠ {process.indicatorsWithoutMeasurements} sem medições
                          </span>
                        )}
                      </div>
                    </button>

                    {expanded && (
                      <div className="px-5 pb-5 border-t border-border bg-muted/20">
                        <div className="pt-4 space-y-3">
                          {process.indicators.length === 0 ? (
                            <div className="text-sm text-muted-foreground">
                              Este processo não possui indicadores associados.
                            </div>
                          ) : (
                            process.indicators.map((indicator) => (
                              <div
                                key={indicator.indicatorYearId}
                                className="flex items-center justify-between gap-4 rounded-lg bg-card border border-border p-4"
                              >
                                <div>
                                  <p className="text-sm font-semibold">
                                    {indicator.name}
                                  </p>

                                  <p className="text-sm text-muted-foreground mt-1">
                                    Meta:{" "}
                                    {indicator.goal !== null
                                      ? indicator.goal
                                      : "Não definida"}
                                    {" · "}
                                    Última medição:{" "}
                                    {indicator.lastMeasurement !== null
                                      ? indicator.lastMeasurement
                                      : "Sem dados"}
                                  </p>

                                  {indicator.lastMeasurementDate && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Data: {indicator.lastMeasurementDate}
                                    </p>
                                  )}
                                </div>

                                {indicator.hasMeasurements ? (
                                  <CheckCircle2
                                    size={18}
                                    className="text-emerald-600 shrink-0"
                                  />
                                ) : (
                                  <AlertTriangle
                                    size={18}
                                    className="text-amber-600 shrink-0"
                                  />
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/* 3. OBJETIVOS                                                     */}
          {/* ---------------------------------------------------------------- */}

          <Section
            title="Objetivos da Qualidade"
            subtitle="Grau de concretização dos objetivos definidos para o ciclo"
          >
            <div className="border border-border rounded-xl overflow-hidden">
              {summary?.objectives.map((objective, index) => (
                <div
                  key={objective.qualityObjectiveYearId}
                  className={`p-5 flex items-center justify-between gap-6 ${index !== summary.objectives.length - 1
                    ? "border-b border-border"
                    : ""
                    }`}
                >
                  <div className="flex items-start gap-3">
                    {objective.status === "ACHIEVED" ? (
                      <CheckCircle2
                        size={20}
                        className="text-emerald-600 mt-0.5"
                      />
                    ) : (
                      <AlertTriangle
                        size={20}
                        className="text-amber-600 mt-0.5"
                      />
                    )}

                    <div>
                      <p className="font-semibold text-foreground">
                        {objective.name}
                      </p>

                      <p className="text-sm text-muted-foreground mt-1">
                        {objective.processCount} processos associados ·{" "}
                        {objective.indicatorCount} indicadores associados
                      </p>
                    </div>
                  </div>

                  {objective.status === "ACHIEVED" ? (
                    <StatusBadge type="ok">
                      Atingido
                    </StatusBadge>
                  ) : (
                    <StatusBadge type="attention">
                      Em curso
                    </StatusBadge>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/* 3.1 NÃO CONFORMIDADES                                            */}
          {/* ---------------------------------------------------------------- */}

          <Section
            title="Não conformidades"
            subtitle="Situação das não conformidades registadas no ciclo"
          >
            {!summary?.nonConformities.length ? (
              <div className="py-10 text-center text-muted-foreground">
                Não existem não conformidades registadas neste ciclo.
              </div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden">
                {summary.nonConformities.map((nonConformity, index) => {
                  const isOpen = NC_OPEN_STATUSES.includes(
                    nonConformity.status
                  );

                  return (
                    <div
                      key={nonConformity.nonConformityYearId}
                      className={`p-5 flex items-center justify-between gap-6 ${index !== summary.nonConformities.length - 1
                        ? "border-b border-border"
                        : ""
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        {isOpen ? (
                          <AlertTriangle
                            size={20}
                            className="text-amber-600 mt-0.5"
                          />
                        ) : (
                          <CheckCircle2
                            size={20}
                            className="text-emerald-600 mt-0.5"
                          />
                        )}

                        <div>
                          <p className="font-semibold text-foreground">
                            {nonConformity.name}
                          </p>

                          <p className="text-sm text-muted-foreground mt-1">
                            Origem: {NC_ORIGIN_LABELS[nonConformity.origin]}
                            {" · "}
                            {nonConformity.correctiveActionCount} ação(ões) corretiva(s)
                          </p>
                        </div>
                      </div>

                      <StatusBadge type={isOpen ? "attention" : "ok"}>
                        {NC_STATUS_LABELS[nonConformity.status]}
                      </StatusBadge>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/* 4. PONTOS DE ATENÇÃO                                             */}
          {/* ---------------------------------------------------------------- */}

          <Section
            title="Pontos que requerem atenção"
            subtitle="Situações relevantes identificadas automaticamente durante o ciclo"
          >
            <div className="space-y-4">
              {attentionItems.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  Não existem situações pendentes de análise neste ciclo.
                </div>
              ) : (
                attentionItems.map((item) => (
                  <div
                    key={item.id}
                    className="border border-amber-200 dark:border-amber-900 rounded-xl bg-amber-50/30 dark:bg-amber-950/10 p-5"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex gap-3">
                        <AlertTriangle
                          size={20}
                          className="text-amber-600 mt-0.5 shrink-0"
                        />

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
                            {item.type}
                          </p>

                          <h3 className="font-semibold text-foreground">
                            {item.title}
                          </h3>

                          <p className="text-sm text-muted-foreground mt-2">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/* 5. DECISÕES / AÇÕES                                              */}
          {/* ---------------------------------------------------------------- */}

          <Section
            title="Decisões e ações"
            subtitle="Ações em curso registadas nos módulos de Não Conformidades, Objetivos da Qualidade, Oportunidades de Melhoria e Riscos e Oportunidades"
          >
            {!summary?.actions.length ? (
              <div className="py-10 text-center text-muted-foreground">
                Nenhuma ação registada nestes módulos para este ciclo.
              </div>
            ) : (
              <div className="space-y-3">
                {summary.actions.map((action) => (
                  <div
                    key={`${action.origin}-${action.actionId}`}
                    className="border border-border rounded-xl p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {action.title}
                        </h3>

                        <p className="text-sm text-muted-foreground mt-2">
                          {action.origin}:{" "}
                          <span className="text-foreground">
                            {action.originName}
                          </span>
                        </p>
                      </div>

                      <StatusBadge
                        type={
                          action.status === "FINISHED"
                            ? "ok"
                            : action.status === "IN_PROGRESS"
                              ? "info"
                              : "neutral"
                        }
                      >
                        {ACTION_STATUS_LABELS[action.status]}
                      </StatusBadge>
                    </div>

                    <div className="flex flex-wrap gap-x-8 gap-y-2 mt-4 text-sm">
                      <span className="text-muted-foreground">
                        Responsável:{" "}
                        <strong className="font-medium text-foreground">
                          {action.responsible}
                        </strong>
                      </span>

                      {action.deadline && (
                        <span className="text-muted-foreground">
                          Prazo:{" "}
                          <strong className="font-medium text-foreground">
                            {action.deadline}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/* 6. ESTADO DO SGQ                                                 */}
          {/* ---------------------------------------------------------------- */}

          <Section
            title="Estado do SGQ"
            subtitle="Situação organizacional e documental do sistema"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users
                    size={18}
                    className="text-muted-foreground"
                  />

                  <h3 className="font-semibold">
                    Responsabilidades
                  </h3>
                </div>

                <div className="space-y-3 text-sm">
                  <StateRow
                    label="Processos com responsável"
                    value={`${summary?.overview.processesWithResponsible ?? 0} / ${summary?.overview.processes ?? 0}`}
                    ok={(summary?.overview.processesWithoutResponsible ?? 0) === 0}
                  />

                  <StateRow
                    label="Processos sem responsável"
                    value={String(summary?.overview.processesWithoutResponsible ?? 0)}
                    ok={(summary?.overview.processesWithoutResponsible ?? 0) === 0}
                  />

                {/*   <StateRow
                    label="Indicadores com responsável"
                    value="32 / 34"
                  />

                  <StateRow
                    label="Indicadores sem responsável"
                    value="2"
                  /> */}
                </div>
              </div>

              <div className="border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FileText
                    size={18}
                    className="text-muted-foreground"
                  />

                  <h3 className="font-semibold">
                    Documentação
                  </h3>
                </div>

                <div className="space-y-3 text-sm">
                  <StateRow
                    label="Documentos em vigor"
                    value={`${summary?.documents.inForce ?? 0} / ${summary?.documents.total ?? 0}`}
                    ok
                  />

                  <StateRow
                    label="Pendentes de aprovação"
                    value={String(summary?.documents.pendingApproval ?? 0)}
                    ok={(summary?.documents.pendingApproval ?? 0) === 0}
                  />

                  <StateRow
                    label="Sem versão aprovada"
                    value={String(summary?.documents.withoutApprovedVersion ?? 0)}
                    ok={(summary?.documents.withoutApprovedVersion ?? 0) === 0}
                  />
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                  Estes números referem-se a todos os documentos do sistema, não só ao ciclo selecionado — os documentos não estão associados a um ano.
                </p>
              </div>
            </div>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/* 7. AVALIAÇÃO                                                     */}
          {/* ---------------------------------------------------------------- */}

          <Section
            title="Avaliação pela Gestão"
            subtitle="Análise e conclusões resultantes da apreciação da informação anterior"
          >
            <div className="space-y-6">
              <AssessmentField
                label="Avaliação global do desempenho do SGQ"
                value={globalAssessment}
                onChange={setGlobalAssessment}
                readOnly={isExternal}
              />

              <AssessmentField
                label="Adequação e eficácia do SGQ"
                value={effectivenessAssessment}
                onChange={setEffectivenessAssessment}
                readOnly={isExternal}
              />

              <AssessmentField
                label="Oportunidades de melhoria"
                value={improvementOpportunities}
                onChange={setImprovementOpportunities}
                readOnly={isExternal}
              />

              <AssessmentField
                label="Necessidades de alteração e/ou recursos"
                value={resourceNeeds}
                onChange={setResourceNeeds}
                readOnly={isExternal}
              />

              {!isExternal && (
                <div className="flex justify-end">
                  <Button
                    onClick={() =>
                      toast.success(
                        "Maquete: avaliação guardada apenas localmente."
                      )
                    }
                  >
                    <Save className="size-4" />
                    Guardar avaliação
                  </Button>
                </div>
              )}
            </div>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/* 8. ATA                                                           */}
          {/* ---------------------------------------------------------------- */}

          <Section
            title="Ata da Revisão pela Gestão"
            subtitle="Registo formal e resumido da reunião"
            action={
              !isExternal && !isEditingMinutes ? (
                <button
                  onClick={handleEditMinutes}
                  className="text-xs font-bold text-primary hover:text-primary/80 uppercase tracking-wider"
                >
                  Editar
                </button>
              ) : null
            }
          >
            {isEditingMinutes ? (
              <>
                <textarea
                  value={minutesText}
                  onChange={(event) =>
                    setMinutesText(event.target.value)
                  }
                  placeholder="Registe a ata da Revisão pela Gestão..."
                  className="w-full min-h-64 p-4 bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed"
                />

                <div className="flex justify-end gap-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingMinutes(false)}
                  >
                    Cancelar
                  </Button>

                  <Button
                    onClick={handleSaveMinutes}
                    disabled={updateMutation.isPending}
                  >
                    <Save className="size-4" />
                    {updateMutation.isPending
                      ? "A guardar..."
                      : "Guardar"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="min-h-24">
                {data?.description ? (
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {data.description}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">
                    Nenhuma ata registada.
                  </p>
                )}
              </div>
            )}
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/* 9. DOCUMENTOS                                                    */}
          {/* ---------------------------------------------------------------- */}

          <Section
            title="Evidência documental"
            subtitle="Atas assinadas, anexos e restantes documentos de suporte"
            action={
              !isExternal ? (
                <Button
                  onClick={() => {
                    setUploadFile(null);
                    setUploadOpen(true);
                  }}
                >
                  <Plus className="size-4" />
                  Carregar documento
                </Button>
              ) : null
            }
          >
            <YearDocumentsSection
              documents={documents}
              queryKey={[
                "management-review",
                "year",
                selectedYearId,
              ]}
              uploadFn={(
                file,
                version,
                uploadedById,
                existingDocumentId
              ) =>
                uploadManagementReviewDocument(
                  selectedYearId,
                  file,
                  version,
                  uploadedById,
                  existingDocumentId
                )
              }
              versioned
            />
          </Section>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* LOG                                                                */}
      {/* ------------------------------------------------------------------ */}

      <LogDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        entityType="MANAGEMENT_REVIEW"
        yearId={selectedYearId ?? undefined}
        title="Histórico — Revisão pela Gestão"
      />

      {/* ------------------------------------------------------------------ */}
      {/* UPLOAD DIALOG                                                      */}
      {/* ------------------------------------------------------------------ */}

      {!isExternal && (
        <Dialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Carregar documento
              </DialogTitle>

              <DialogDescription>
                Carregue um novo documento de evidência da Revisão
                pela Gestão.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="management-review-file">
                  Ficheiro
                </Label>

                <Input
                  id="management-review-file"
                  type="file"
                  onChange={(event) =>
                    setUploadFile(
                      event.target.files?.[0] ?? null
                    )
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">
                  Cancelar
                </Button>
              </DialogClose>

              <Button
                onClick={() => uploadMutation.mutate()}
                disabled={
                  !uploadFile || uploadMutation.isPending
                }
              >
                <Upload className="size-4" />
                {uploadMutation.isPending
                  ? "A carregar..."
                  : "Carregar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              SMALL COMPONENTS                              */
/* -------------------------------------------------------------------------- */

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {title}
          </h2>

          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {action}
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
        {children}
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  icon,
  attention = false,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  attention?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${attention
        ? "border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/10"
        : "border-border bg-card"
        }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>

        <span
          className={
            attention
              ? "text-amber-600"
              : "text-primary"
          }
        >
          {icon}
        </span>
      </div>

      <p className="text-3xl font-bold text-foreground mt-4">
        {value}
      </p>

      <p className="text-xs text-muted-foreground mt-1">
        {detail}
      </p>
    </div>
  );
}

function StatusBadge({
  type,
  children,
}: {
  type: "ok" | "attention" | "neutral" | "info";
  children: React.ReactNode;
}) {
  const classes = {
    ok: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    attention:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    neutral:
      "bg-muted text-muted-foreground",
    info:
      "bg-primary/10 text-primary",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${classes[type]}`}
    >
      {children}
    </span>
  );
}

function SmallMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-lg px-4 py-3">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <div className="flex items-center gap-2 mt-1">
        <p className="font-semibold text-foreground">
          {value}
        </p>

        {icon && (
          <span className="text-amber-600">
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}

function StateRow({
  label,
  value,
  ok = false,
}: {
  label: string;
  value: string;
  ok?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">
        {label}
      </span>

      <div className="flex items-center gap-2">
        <strong className="font-semibold text-foreground">
          {value}
        </strong>

        {ok ? (
          <CheckCircle2
            size={16}
            className="text-emerald-600"
          />
        ) : (
          <AlertTriangle
            size={16}
            className="text-amber-600"
          />
        )}
      </div>
    </div>
  );
}

function AssessmentField({
  label,
  value,
  onChange,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <Label className="font-semibold">
        {label}
      </Label>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        readOnly={readOnly}
        placeholder={
          readOnly
            ? "Nenhuma avaliação registada."
            : "Registe a apreciação da gestão..."
        }
        className="w-full min-h-28 mt-2 p-4 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed read-only:opacity-70"
      />
    </div>
  );
}