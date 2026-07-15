import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, Loader2, ChevronDown, ChevronRight, User, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getLogs, getYears, type LogPageResponse } from "@/api/core";
import type { LogResponse, EntityType, ActionType, YearOption } from "@/types";
import { useAuth } from "@/context/auth-context";

function normalizePage(raw: LogPageResponse) {
  if (raw.page) {
    return {
      content: raw.content ?? [],
      totalElements: raw.page.totalElements ?? 0,
      totalPages: raw.page.totalPages ?? 1,
    };
  }
  return {
    content: raw.content ?? [],
    totalElements: raw.totalElements ?? 0,
    totalPages: raw.totalPages ?? 1,
  };
}

interface LogDialogProps {
  entityType?: EntityType;
  baseEntityId?: number;
  entityTypes?: EntityType[];
  yearId?: number;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
}

const actionLabels: Record<ActionType, string> = {
  CREATED: "Criado",
  UPDATED: "Atualizado",
  DELETED: "Eliminado",
  ASSOCIATED: "Associado",
  DISASSOCIATED: "Desassociado",
};

const entityTypeLabels: Record<string, string> = {
  HUMAN_RESOURCE: "Pessoa",
  COMPETENCY: "Competência",
  INFRASTRUCTURE: "Infraestrutura",
  EQUIPMENT: "Equipamento",
  MAINTENANCE_RECORD: "Manutenção",
  CALIBRATION_RECORD: "Calibração",
  PROCESS: "Processo",
  MACRO_PROCESS: "Macro Processo",
  COMMUNICATION: "Comunicação (cabecalho)",
  COMMUNICATION_ITEM: "Item de Comunicação",
  SWOT_ANALYSIS: "Análise SWOT",
  SWOT_ITEM: "Fator SWOT",
  INDICATOR: "Indicador",
  NON_CONFORMITY: "Não Conformidade",
  INTERESTED_PARTY: "Parte Interessada",
  RISK_OPPORTUNITY: "Risco/Oportunidade",
  AWARENESS: "Consciencialização",
  LEADERSHIP_COMMITMENT: "Compromisso da Liderança",
  RESPONSIBILITY_AUTHORITY: "Responsabilidade",
  QUALITY_OBJECTIVE: "Objetivo",
  CHANGE: "Alteração",
  SYSTEM_POLICY: "Política",
  DOCUMENT: "Documento",
  DOCUMENT_VERSION: "Versão",
  SCOPE: "Âmbito",
  MEASUREMENT: "Medição",
  CORRECTIVE_ACTION: "Ação Corretiva",
  RISK_ACTION: "Ação",
  MANAGEMENT_REVIEW: "Revisão pela Gestão",
};

const fieldLabels: Record<string, string> = {
  name: "Nome",
  function: "Função",
  department: "Departamento",
  type: "Tipo",
  location: "Localização",
  isActive: "Ativo",
  year: "Ano",
  date: "Data",
  performedBy: "Executado por",
  result: "Resultado",
  description: "Descrição",
  maintenance: "Manutenção",
  objective: "Objetivo",
  owner: "Responsável",
  category: "Categoria",
  impact: "Impacto",
  probability: "Probabilidade",
  decision: "Decisão",
  responsible: "Responsável",
  equipmentName: "Equipamento",
  details: "Detalhes",
  what: "O quê",
  who: "Quem",
  toWho: "A quem",
  when: "Quando",
  where: "Onde",
  how: "Como",
  scope: "Âmbito",
  plan: "Plano",
  text: "Texto",
  contactInfo: "Informações de Contacto",
  needs: "Necessidades",
  communicationAndMonitoringPlan: "Plano de Comunicação e Monitorização",
  origin: "Origem",
  cause: "Causa",
  evaluation: "Avaliação",
  evaluationDescription: "Descrição da Avaliação",
  status: "Estado",
  progressDescription: "Descrição do Progresso",
  whatWillBeDone: "O que será feito",
  why: "Porquê",
  createdBy: "Criado por",
  startDate: "Data de Início",
  timeLimitInDays: "Prazo (dias)",
  expectedEndDate: "Data Prevista",
  realEndDate: "Data Real",
  howMuch: "Quanto",
  notes: "Notas",
  yearId: "Ano",
  objectiveTitle: "Título do Objetivo",
  actions: "Plano de Ações",
  formula: "Fórmula",
  frequency: "Frequência",
  valueType: "Tipo de Valor",
  goal: "Objetivo",
  versioned: "Versionado",
  fileName: "Ficheiro",
  version: "Versão",
  document: "Documento",
  macroprocess: "Macroprocesso",
  process: "Processo",
  indicator: "Indicador",
  entrada: "Entrada",
  saida: "Saída",
  ficha: "Ficha do Processo",
};

function labelify(key: string): string {
  return fieldLabels[key] || key;
}

const actionColors: Record<ActionType, string> = {
  CREATED: "bg-green-100 text-green-700",
  UPDATED: "bg-blue-100 text-blue-700",
  DELETED: "bg-red-100 text-red-700",
  ASSOCIATED: "bg-purple-100 text-purple-700",
  DISASSOCIATED: "bg-orange-100 text-orange-700",
};

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const valueLabels: Record<string, string> = {
  INTERNAL: "Interna",
  EXTERNAL: "Externa",
  PREVENTIVE: "Preventiva",
  CORRECTIVE: "Corretiva",
  INTERNAL_AUDIT: "Auditoria Interna",
  CLIENT: "Cliente",
  EXTERNAL_AUDIT: "Auditoria Externa",
  NOT_SPECIFIED: "Não Especificado",
  OPEN: "Aberta",
  UNDER_TREATMENT: "Em Tratamento",
  FINISHED: "Concluída",
  CLASSIFIED: "Classificada",
  REGISTERED: "Registada",
  IN_PROGRESS: "Em Curso",
  RISK: "Risco",
  OPPORTUNITY: "Oportunidade",
  STRENGTH: "Força",
  WEAKNESS: "Fraqueza",
  OPPORTUNITY_SWOT: "Oportunidade",
  THREAT: "Ameaça",
  ACHIEVED: "Conseguido",
  CURRENCY: "Moeda",
  NUMBER: "Número",
  PERCENTAGE: "Percentagem",
  RATIO: "Rácio",
  TIME: "Tempo",
  ANNUAL: "Anual",
  SEMESTER: "Semestral",
  TRIMESTER: "Trimestral",
  MONTHLY: "Mensal",
  WEEKLY: "Semanal",
  INITIATED: "Iniciada",
  CANCELLED: "Cancelada",
  APPROVED: "Aprovada",
  UNDER_REVIEW: "Em Revisão",
  OBSOLETE: "Obsoleta",
  ACCEPT: "Aceitar",
  MITIGATE: "Mitigar",
  TRANSFER: "Transferir",
  AVOID: "Evitar",
};

function translateValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  return valueLabels[s] ?? s;
}

function formatDetails(details: Record<string, unknown> | null): string[] {
  if (!details) return [];
  const lines: string[] = [];
  const type = details.type as string | undefined;
  const fields = details.fields as Record<string, unknown> | undefined;

  if (!fields) return lines;

  if (type === "CREATED" || type === "DELETED") {
    for (const [key, val] of Object.entries(fields)) {
      if (val !== null && val !== undefined && String(val) !== "") {
        const display = typeof val === "boolean" ? (val ? "Sim" : "Não") : translateValue(val);
        lines.push(`${labelify(key)}: ${display}`);
      }
    }
  } else if (type === "EDITED") {
    for (const [key, val] of Object.entries(fields)) {
      if (typeof val === "object" && val !== null) {
        const change = val as Record<string, unknown>;
        const rawOld = change.old;
        const rawNew = change.new;
        const oldVal =
          typeof rawOld === "boolean" ? (rawOld ? "Sim" : "Não") : translateValue(rawOld);
        const newVal =
          typeof rawNew === "boolean" ? (rawNew ? "Sim" : "Não") : translateValue(rawNew);
        if (oldVal !== newVal) {
          lines.push(`${labelify(key)}: "${oldVal}" → "${newVal}"`);
        }
      }
    }
  } else if (type === "ASSOCIATED" || type === "DISASSOCIATED") {
    const relation = fields.relation as string | undefined;
    const target = fields.target as string | undefined;
    if (relation && target) {
      const verb = type === "ASSOCIATED" ? "Associado" : "Desassociado";
      lines.push(`${verb} ao ${labelify(relation).toLowerCase()} ${target}`);
    }
  }

  return lines;
}

export function LogDialog({
  entityType,
  baseEntityId,
  entityTypes,
  yearId: initialYearId,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  title,
}: LogDialogProps) {
  const { isExternal } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [selectedYearId, setSelectedYearId] = useState<number | null>(initialYearId ?? null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  useEffect(() => {
    if (open) {
      setPage(0);
      setExpandedIds(new Set());
      setSelectedYearId(initialYearId ?? null);
    }
  }, [open, initialYearId]);

  const { data: years } = useQuery({
    queryKey: ["years"],
    queryFn: getYears,
    enabled: open,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      "logs",
      entityType ?? "",
      entityTypes?.join(",") ?? "",
      baseEntityId ?? "",
      selectedYearId ?? "",
      page,
    ],
    queryFn: () => {
      if (baseEntityId != null && entityTypes && entityTypes.length > 0) {
        return getLogs({
          baseEntityId,
          entityTypes,
          yearId: selectedYearId ?? undefined,
          page,
          size: 10,
        });
      }
      if (baseEntityId != null) {
        return getLogs({
          baseEntityId,
          entityType: entityType ?? undefined,
          yearId: selectedYearId ?? undefined,
          page,
          size: 10,
        });
      }
      if (entityTypes && entityTypes.length > 0) {
        return getLogs({ entityTypes, yearId: selectedYearId ?? undefined, page, size: 10 });
      }
      return getLogs({
        entityType: entityType,
        yearId: selectedYearId ?? undefined,
        page,
        size: 10,
      });
    },
    enabled: open,
  });

  const logs = data ? normalizePage(data).content : [];
  const totalPages = data ? normalizePage(data).totalPages : 0;
  const totalElements = data ? normalizePage(data).totalElements : 0;

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History size={18} />
            {title || "Histórico de Alterações"}
          </DialogTitle>
        </DialogHeader>

        {!isExternal && years && years.length > 0 && (
          <div className="flex items-center gap-2 pb-2">
            <span className="text-xs text-muted-foreground">Ano:</span>
            <select
              value={selectedYearId ?? ""}
              onChange={e => {
                setSelectedYearId(e.target.value ? Number(e.target.value) : null);
                setPage(0);
                setExpandedIds(new Set());
              }}
              className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Todos</option>
              {years.map((y: YearOption) => (
                <option key={y.id} value={y.id}>
                  {y.year}
                </option>
              ))}
            </select>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12 italic">
            Nenhum registo de alteração encontrado.
          </p>
        ) : (
          <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
            {logs.map(log => {
              const detailLines = formatDetails(log.details as Record<string, unknown> | null);
              const isExpanded = expandedIds.has(log.id);

              return (
                <div
                  key={log.id}
                  className="bg-muted/30 rounded-xl border border-border overflow-hidden"
                >
                  <button
                    onClick={() => detailLines.length > 0 && toggleExpand(log.id)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="shrink-0 mt-0.5">
                      {detailLines.length > 0 ? (
                        isExpanded ? (
                          <ChevronDown size={14} className="text-muted-foreground" />
                        ) : (
                          <ChevronRight size={14} className="text-muted-foreground" />
                        )
                      ) : (
                        <div className="w-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${actionColors[log.action]}`}
                        >
                          {actionLabels[log.action]}
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {entityTypeLabels[log.entityType] || log.entityType}
                        </span>
                        <span className="text-xs text-foreground flex items-center gap-1">
                          <Tag size={10} />
                          {log.entityName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User size={10} />
                        <span>
                          {log.user ? `${log.user.firstName} ${log.user.lastName}` : "Sistema"}
                        </span>
                        <span>·</span>
                        <Clock size={10} />
                        <span>{formatTimestamp(log.timestamp)}</span>
                      </div>
                    </div>
                  </button>

                  {isExpanded && detailLines.length > 0 && (
                    <div className="px-4 pb-3 pt-0">
                      <div className="bg-background rounded-lg border border-border px-3 py-2 space-y-1">
                        {detailLines.map((line, i) => (
                          <p
                            key={i}
                            className="text-[11px] text-foreground font-mono leading-relaxed"
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {logs.length > 0 && (
          <div className="flex items-center justify-center gap-3 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0 || isFetching}
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              Anterior
            </Button>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {page + 1} de {totalPages} {totalPages === 1 ? "página" : "páginas"} · {totalElements}{" "}
              registos
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1 || isFetching}
              onClick={() => setPage(p => p + 1)}
            >
              Seguinte
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
