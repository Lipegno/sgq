import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import {
  ShieldAlert,
  TrendingUp,
  Plus,
  Search,
  Trash2,
  MoreVertical,
  LayoutGrid,
  List as ListIcon,
  Pencil,
  CalendarDays,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  Link as LinkIcon,
  X,
  History,
  Activity,
} from "lucide-react";
import {
  getYears,
  getRiskOpportunitiesByYear,
  createRiskOpportunity,
  updateRiskOpportunity,
  deleteRiskOpportunity,
  associateRiskOpportunityYears,
  disassociateRiskOpportunityYears,
  getProcessOptionsByYear,
  associateRiskProcesses,
  disassociateRiskProcesses,
  getRiskOpportunityYears,
  createRiskAction,
  updateRiskAction,
  deleteRiskAction,
} from "@/api/core";
import YearAssociationDialog from "@/components/year-association-dialog";
import ProcessAssociationDialog from "@/components/process-association-dialog";
import ConfirmDialog from "@/components/confirm-dialog";
import { YearSelector } from "@/components/year-selector";
import type {
  RiskOpportunityResponse,
  RiskOpportunityType,
  RiskDecision,
  ProcessOptionResponse,
  EntityType,
  RiskActionResponse,
  ActionStatus,
} from "@/types";
import { LogDialog } from "@/components/log-dialog";

const TYPE_LABELS: Record<RiskOpportunityType, string> = {
  RISK: "Risco",
  OPPORTUNITY: "Oportunidade",
};

const ORIGIN_OPTIONS = [
  { value: "SWOT", label: "Análise SWOT" },
  { value: "PROCESS_ANALYSIS", label: "Análise de Processos" },
  { value: "AUDIT", label: "Auditoria" },
  { value: "EXTERNAL", label: "Fonte Externa" },
  { value: "INTERNAL", label: "Fonte Interna" },
  { value: "INTERESTED_PARTY", label: "Parte Interessada" },
  { value: "OTHER", label: "Outra" },
];

const DECISION_LABELS: Record<RiskDecision, string> = {
  ACCEPT: "Aceitar",
  MITIGATE: "Mitigar",
  TRANSFER: "Transferir",
  AVOID: "Evitar",
};

const DECISION_OPTIONS: { value: RiskDecision; label: string }[] = [
  { value: "ACCEPT", label: "Aceitar" },
  { value: "MITIGATE", label: "Mitigar" },
  { value: "TRANSFER", label: "Transferir" },
  { value: "AVOID", label: "Evitar" },
];

const RISK_ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  OPEN: "Pendente",
  IN_PROGRESS: "Em curso",
  CLOSED: "Concluída",
};

const RISK_ACTION_STATUS_OPTIONS: { value: ActionStatus; label: string }[] = [
  { value: "OPEN", label: "Pendente" },
  { value: "IN_PROGRESS", label: "Em curso" },
  { value: "CLOSED", label: "Concluída" },
];

function riskActionStatusSelectClass(status: ActionStatus) {
  switch (status) {
    case "CLOSED": return "bg-emerald-50 text-emerald-700 border-emerald-300";
    case "IN_PROGRESS": return "bg-primary/10 text-primary border-primary/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

function riskLevelColor(impact: number | null, probability: number | null) {
  const score = (impact ?? 0) * (probability ?? 0);
  if (score >= 15) return "bg-destructive/10 text-destructive border-destructive/30";
  if (score >= 8) return "bg-amber-50 text-amber-700 border-amber-300";
  return "bg-emerald-50 text-emerald-700 border-emerald-300";
}

function riskLevelBadge(impact: number | null, probability: number | null) {
  const score = (impact ?? 0) * (probability ?? 0);
  if (score >= 15) return "destructive" as const;
  if (score >= 8) return "default" as const;
  return "secondary" as const;
}

function decisionBadgeVariant(decision: RiskDecision | null) {
  switch (decision) {
    case "MITIGATE": return "destructive" as const;
    case "TRANSFER": return "default" as const;
    case "AVOID": return "secondary" as const;
    case "ACCEPT": return "outline" as const;
    default: return "outline" as const;
  }
}

export default function RisksOpportunitiesPage() {
  const queryClient = useQueryClient();
  const { isExternal, user } = useAuth();

  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<RiskOpportunityType>("RISK");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "matrix">("list");
  const [sortMode, setSortMode] = useState<"asc" | "desc">("desc");

  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<RiskOpportunityResponse | null>(null);
  const [formOrigin, setFormOrigin] = useState("SWOT");
  const [formCategory, setFormCategory] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImpact, setFormImpact] = useState<number | null>(null);
  const [formProbability, setFormProbability] = useState<number | null>(null);
  const [formDecision, setFormDecision] = useState<RiskDecision | null>(null);

  const [yearAssociateDialogOpen, setYearAssociateDialogOpen] = useState(false);
  const [yearAssociateItem, setYearAssociateItem] = useState<RiskOpportunityResponse | null>(null);
  const [associatedYearIds, setAssociatedYearIds] = useState<Set<number>>(new Set());

  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [optimisticProcesses, setOptimisticProcesses] = useState<ProcessOptionResponse[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [pageLogOpen, setPageLogOpen] = useState(false);

  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [newActionTitle, setNewActionTitle] = useState("");
  const [newActionMethod, setNewActionMethod] = useState("");

  const viewOnly = isExternal && editItem !== null;

  const { data: associatedYears } = useQuery({
    queryKey: ["risk-opportunity-years", yearAssociateItem?.id],
    queryFn: () => getRiskOpportunityYears(yearAssociateItem!.id),
    enabled: yearAssociateDialogOpen && yearAssociateItem !== null,
  });

  useEffect(() => {
    if (associatedYears) {
      setAssociatedYearIds(new Set(associatedYears.map((y) => y.id)));
    }
  }, [associatedYears]);

  const { data: years } = useQuery({ queryKey: ["years"], queryFn: getYears });
  const effectiveYearId = selectedYearId;

  useEffect(() => {
    if (selectedYearId !== null) return;
    if (!years || years.length === 0) return;
    const currentYearVal = new Date().getFullYear();
    const match = years.find(y => y.year === currentYearVal) ?? years[0];
    setSelectedYearId(match.id);
  }, [selectedYearId, years]);

  const { data: grouped, isLoading } = useQuery({
    queryKey: ["risk-opportunities", effectiveYearId],
    queryFn: () => getRiskOpportunitiesByYear(effectiveYearId!),
    enabled: effectiveYearId !== null,
  });

  const { data: processOptions } = useQuery({
    queryKey: ["process-options", effectiveYearId],
    queryFn: () => getProcessOptionsByYear(effectiveYearId!),
    enabled: effectiveYearId !== null,
  });

  const items = useMemo(() => {
    const list = activeTab === "RISK" ? grouped?.risks ?? [] : grouped?.opportunities ?? [];
    let filtered = list;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = list.filter(
        (item) =>
          item.description.toLowerCase().includes(q) ||
          item.origin.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q),
      );
    }

    return [...filtered].sort((a, b) => {
      const scoreA = (a.impact ?? 0) * (a.probability ?? 0);
      const scoreB = (b.impact ?? 0) * (b.probability ?? 0);
      return sortMode === "desc" ? scoreB - scoreA : scoreA - scoreB;
    });
  }, [grouped, activeTab, searchQuery, sortMode]);

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["risk-opportunities"] });
  }

  const createMutation = useMutation({
    mutationFn: createRiskOpportunity,
    onSuccess: () => {
      invalidateAll();
      toast.success(`${TYPE_LABELS[activeTab]} registado com sucesso.`);
      setEditOpen(false);
      setEditItem(null);
    },
    onError: () => toast.error("Erro ao registar."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateRiskOpportunity>[1] }) =>
      updateRiskOpportunity(id, data),
    onSuccess: () => {
      invalidateAll();
      toast.success("Atualizado com sucesso.");
      setEditOpen(false);
      setEditItem(null);
    },
    onError: () => toast.error("Erro ao atualizar."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRiskOpportunity,
    onSuccess: () => {
      invalidateAll();
      toast.success("Eliminado com sucesso.");
    },
    onError: () => toast.error("Erro ao eliminar."),
  });

  const associateYearsMutation = useMutation({
    mutationFn: ({
      id, yearIds, copyAttributes, copyProcesses,
    }: { id: number; yearIds: number[]; copyAttributes: boolean; copyProcesses: boolean }) =>
      associateRiskOpportunityYears(id, yearIds, copyAttributes, copyProcesses),
    onSuccess: (_data, variables) => {
      invalidateAll();
      toast.success("Ano associado com sucesso.");
      setAssociatedYearIds((prev) => {
        const next = new Set(prev);
        variables.yearIds.forEach((yid) => next.add(yid));
        return next;
      });
    },
    onError: () => toast.error("Erro ao associar ano."),
  });

  const disassociateYearsMutation = useMutation({
    mutationFn: ({ id, yearIds }: { id: number; yearIds: number[] }) =>
      disassociateRiskOpportunityYears(id, yearIds),
    onSuccess: (_data, variables) => {
      invalidateAll();
      toast.success("Ano desassociado com sucesso.");
      setAssociatedYearIds((prev) => {
        const next = new Set(prev);
        variables.yearIds.forEach((yid) => next.delete(yid));
        return next;
      });
    },
    onError: () => toast.error("Erro ao desassociar ano."),
  });

  const associateProcessMutation = useMutation({
    mutationFn: ({ riskOpportunityYearId, processIds }: { riskOpportunityYearId: number; processIds: number[]; process?: ProcessOptionResponse }) =>
      associateRiskProcesses(riskOpportunityYearId, processIds),
    onSuccess: (_data, variables) => {
      invalidateAll();
      toast.success("Processo associado com sucesso.");
      if (variables.process) {
        setEditItem((prev) => {
          if (!prev) return prev;
          if (prev.processes.some((p) => p.processYearId === variables.process!.processYearId)) return prev;
          return { ...prev, processes: [...prev.processes, variables.process!] };
        });
      }
    },
    onError: () => toast.error("Erro ao associar processo."),
  });

  const disassociateProcessMutation = useMutation({
    mutationFn: ({ riskOpportunityYearId, processIds }: { riskOpportunityYearId: number; processIds: number[] }) =>
      disassociateRiskProcesses(riskOpportunityYearId, processIds),
    onSuccess: (_data, variables) => {
      invalidateAll();
      toast.success("Processo desassociado com sucesso.");
      setEditItem((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          processes: prev.processes.filter((p) => !variables.processIds.includes(p.processYearId)),
        };
      });
    },
    onError: () => toast.error("Erro ao desassociar processo."),
  });

  const createActionMutation = useMutation({
    mutationFn: ({ riskOpportunityYearId, data }: { riskOpportunityYearId: number; data: Parameters<typeof createRiskAction>[1] }) =>
      createRiskAction(riskOpportunityYearId, data),
    onSuccess: (action) => {
      invalidateAll();
      toast.success("Ação registada com sucesso.");
      setEditItem((prev) => (prev ? { ...prev, actions: [...prev.actions, action] } : prev));
      setActionDialogOpen(false);
      setNewActionTitle("");
      setNewActionMethod("");
    },
    onError: () => toast.error("Erro ao registar ação."),
  });

  const updateActionMutation = useMutation({
    mutationFn: ({ riskOpportunityYearId, actionId, data }: { riskOpportunityYearId: number; actionId: number; data: Parameters<typeof updateRiskAction>[2] }) =>
      updateRiskAction(riskOpportunityYearId, actionId, data),
    onSuccess: (action) => {
      invalidateAll();
      toast.success("Ação atualizada com sucesso.");
      setEditItem((prev) =>
        prev ? { ...prev, actions: prev.actions.map((a) => (a.id === action.id ? action : a)) } : prev
      );
    },
    onError: () => toast.error("Erro ao atualizar ação."),
  });

  const deleteActionMutation = useMutation({
    mutationFn: ({ riskOpportunityYearId, actionId }: { riskOpportunityYearId: number; actionId: number }) =>
      deleteRiskAction(riskOpportunityYearId, actionId),
    onSuccess: (_data, variables) => {
      invalidateAll();
      toast.success("Ação eliminada com sucesso.");
      setEditItem((prev) =>
        prev ? { ...prev, actions: prev.actions.filter((a) => a.id !== variables.actionId) } : prev
      );
    },
    onError: () => toast.error("Erro ao eliminar ação."),
  });

  function openCreate() {
    setEditItem(null);
    setFormOrigin("SWOT");
    setFormCategory("");
    setFormDescription("");
    setFormImpact(null);
    setFormProbability(null);
    setFormDecision(null);
    setEditOpen(true);
  }

  function openEdit(item: RiskOpportunityResponse) {
    setEditItem(item);
    setFormOrigin(item.origin);
    setFormCategory(item.category);
    setFormDescription(item.description);
    setFormImpact(item.impact);
    setFormProbability(item.probability);
    setFormDecision(item.decision);
    setEditOpen(true);
  }

  function handleSubmit() {
    if (!formDescription.trim() || !effectiveYearId) return;

    if (editItem) {
      updateMutation.mutate({
        id: editItem.id,
        data: {
          origin: formOrigin,
          description: formDescription.trim(),
          category: formCategory.trim(),
          yearId: effectiveYearId,
          impact: formImpact,
          probability: formProbability,
          decision: formDecision,
        },
      });
    } else {
      createMutation.mutate({
        origin: formOrigin,
        description: formDescription.trim(),
        category: formCategory.trim() || "Geral",
        type: activeTab,
        yearIds: [effectiveYearId],
        impact: formImpact,
        probability: formProbability,
        decision: formDecision,
      });
    }
  }

  return (
    <div className="py-8 w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shadow-sm">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Riscos e Oportunidades</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Identificação, avaliação e tratamento de riscos e oportunidades.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPageLogOpen(true)}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
            title="Histórico de alterações"
          >
            <History size={20} />
          </button>
          <YearSelector
            selectedYearId={effectiveYearId}
            onYearChange={(id) => setSelectedYearId(id)}
          />
          {!isExternal && (
            <Button onClick={openCreate}>
              <Plus size={18} />
              Novo {TYPE_LABELS[activeTab]}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs + Search + View toggle */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 pt-4 pb-3 border-b border-border">
          <div className="flex gap-6">
            {(["RISK", "OPPORTUNITY"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-bold transition-all relative ${
                  activeTab === tab
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2">
                  {tab === "RISK" ? <ShieldAlert size={16} /> : <TrendingUp size={16} />}
                  {TYPE_LABELS[tab]}
                </span>
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              <input
                type="text"
                placeholder="Pesquisar..."
                className="pl-9 pr-4 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-56 text-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex bg-muted p-0.5 rounded-lg border border-border">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ListIcon size={16} />
              </button>
              <button
                onClick={() => setViewMode("matrix")}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "matrix" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
            <button
              onClick={() => setSortMode((prev) => (prev === "desc" ? "asc" : "desc"))}
              className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all"
              title={sortMode === "desc" ? "Maior risco primeiro" : "Menor risco primeiro"}
            >
              <ArrowUpDown size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : viewMode === "list" ? (
          <ListView
            items={items}
            onEdit={openEdit}
            onDelete={(id) => setConfirmDeleteId(id)}
            onManageYears={(item) => {
              setYearAssociateItem(item);
              setAssociatedYearIds(new Set([item.yearId]));
              setYearAssociateDialogOpen(true);
            }}
            isExternal={isExternal}
          />
        ) : (
          <MatrixView items={items} />
        )}
      </div>

      {/* Edit / Create Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { if (!open) { setEditOpen(false); setEditItem(null); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editItem ? <Pencil size={20} /> : <Plus size={20} />}
              {viewOnly ? `Detalhes do ${TYPE_LABELS[activeTab]}` : editItem ? `Editar ${TYPE_LABELS[activeTab]}` : `Novo ${TYPE_LABELS[activeTab]}`}
            </DialogTitle>
            <DialogDescription>
              {viewOnly ? `Visualizar detalhes do ${TYPE_LABELS[activeTab].toLowerCase()}.` : editItem ? "Altere os dados do risco ou oportunidade." : "Registe um novo risco ou oportunidade."}
            </DialogDescription>
          </DialogHeader>

          {(() => { const ro = viewOnly; return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5">Origem</Label>
                {ro ? <p className="text-sm text-foreground py-2 px-1">{ORIGIN_OPTIONS.find(o => o.value === formOrigin)?.label ?? formOrigin}</p>
                : <select
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground"
                  value={formOrigin}
                  onChange={(e) => setFormOrigin(e.target.value)}
                >
                  {ORIGIN_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>}
              </div>
              <div>
                <Label className="mb-1.5">Categoria</Label>
                {ro ? <p className="text-sm text-foreground py-2 px-1">{formCategory || '-'}</p>
                : <Input
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="Ex: Estratégico, Operacional..."
                />}
              </div>
            </div>

            <div>
              <Label className="mb-1.5">Descrição</Label>
              {ro ? <p className="text-sm text-foreground whitespace-pre-wrap py-2 px-1">{formDescription || '-'}</p>
              : <textarea
                className="w-full h-24 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Descreva o risco ou oportunidade..."
              />}
            </div>

            <div className="bg-muted/30 p-5 rounded-xl border border-border space-y-5">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Avaliação
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="block mb-2">Impacto (1-5)</Label>
                  {ro ? <p className="text-sm text-foreground py-2 px-1">{formImpact ?? '-'}</p>
                  : <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setFormImpact(v)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                          formImpact === v
                            ? "bg-foreground text-background shadow-sm"
                            : "bg-background text-muted-foreground border border-border hover:border-foreground/30"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>}
                </div>
                <div>
                  <Label className="block mb-2">Probabilidade (1-5)</Label>
                  {ro ? <p className="text-sm text-foreground py-2 px-1">{formProbability ?? '-'}</p>
                  : <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setFormProbability(v)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                          formProbability === v
                            ? "bg-foreground text-background shadow-sm"
                            : "bg-background text-muted-foreground border border-border hover:border-foreground/30"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>}
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-sm font-bold text-foreground">Nível de Risco:</span>
                <div className={`px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm border ${
                  riskLevelColor(formImpact, formProbability)
                }`}>
                  {(formImpact ?? 0) * (formProbability ?? 0)}
                  {(formImpact ?? 0) * (formProbability ?? 0) >= 15 ? " (Crítico)" :
                   (formImpact ?? 0) * (formProbability ?? 0) >= 8 ? " (Moderado)" : " (Baixo)"}
                </div>
              </div>
            </div>

            <div>
              <Label className="mb-1.5">Decisão</Label>
              {ro ? <p className="text-sm text-foreground py-2 px-1">{formDecision ? (DECISION_OPTIONS.find(d => d.value === formDecision)?.label ?? formDecision) : "Sem decisão"}</p>
              : <select
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground"
                value={formDecision ?? ""}
                onChange={(e) => setFormDecision(e.target.value ? (e.target.value as RiskDecision) : null)}
              >
                <option value="">Sem decisão</option>
                {DECISION_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>}
            </div>

            {/* Process Association Section */}
            {editItem && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Processos Associados
                  </h4>
                  {!ro && (
                    <button
                      onClick={() => {
                        setOptimisticProcesses(editItem.processes);
                        setProcessDialogOpen(true);
                      }}
                      className="flex items-center gap-1 text-xs bg-primary/10 border border-primary/20 hover:border-primary/40 text-primary px-3 py-1.5 rounded-md transition-all cursor-pointer"
                    >
                      <LinkIcon size={12} />
                      Associar Processos
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {editItem.processes.length > 0 ? (
                    editItem.processes.map((proc) => (
                      <div
                        key={proc.processYearId}
                        className="flex items-center justify-between text-sm bg-card border border-border px-3 py-2 rounded-lg"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{proc.processName}</span>
                          {proc.macroProcessName && (
                            <span className="text-xs text-muted-foreground">{proc.macroProcessName}</span>
                          )}
                        </div>
                        {!ro && (
                          <button
                            onClick={() => {
                              if (editItem) {
                                disassociateProcessMutation.mutate({
                                  riskOpportunityYearId: editItem.riskOpportunityYearId,
                                  processIds: [proc.processYearId],
                                });
                              }
                            }}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1 cursor-pointer"
                            title="Desassociar"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center border-2 border-dashed border-border rounded-lg text-muted-foreground text-sm">
                      Nenhum processo associado.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions / Follow-up Section */}
            {editItem && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Activity size={14} />
                    Ações / Acompanhamento
                  </h4>
                  {!ro && (
                    <button
                      onClick={() => setActionDialogOpen(true)}
                      className="flex items-center gap-1 text-xs bg-primary/10 border border-primary/20 hover:border-primary/40 text-primary px-3 py-1.5 rounded-md transition-all cursor-pointer"
                    >
                      <Plus size={12} />
                      Nova Ação
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {editItem.actions.length > 0 ? (
                    editItem.actions.map((action) => (
                      <RiskActionCard
                        key={action.id}
                        action={action}
                        isExternal={isExternal}
                        onEdit={(data) =>
                          updateActionMutation.mutate({
                            riskOpportunityYearId: editItem.riskOpportunityYearId,
                            actionId: action.id,
                            data,
                          })
                        }
                        onDelete={() =>
                          deleteActionMutation.mutate({
                            riskOpportunityYearId: editItem.riskOpportunityYearId,
                            actionId: action.id,
                          })
                        }
                      />
                    ))
                  ) : (
                    <div className="py-6 text-center border-2 border-dashed border-border rounded-lg text-muted-foreground text-sm">
                      Nenhuma ação ou acompanhamento registado.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          );
          })()}
          <DialogFooter className="gap-2">
            {viewOnly ? (
              <DialogClose asChild>
                <Button variant="outline">Fechar</Button>
              </DialogClose>
            ) : (
              <>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button
                  onClick={handleSubmit}
                  disabled={!formDescription.trim() || createMutation.isPending || updateMutation.isPending}
                >
                  {editItem ? "Guardar" : "Registar"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity size={20} />
              Nova Ação
            </DialogTitle>
            <DialogDescription>
              Registe uma ação ou medida de tratamento/acompanhamento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label>Título da Ação</Label>
              <Input
                value={newActionTitle}
                onChange={(e) => setNewActionTitle(e.target.value)}
                placeholder="Ex: Rever procedimento de contingência"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Método de Avaliação de Eficácia</Label>
              <textarea
                className="w-full h-20 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={newActionMethod}
                onChange={(e) => setNewActionMethod(e.target.value)}
                placeholder="Como vai ser avaliado se a ação foi eficaz..."
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={() => {
                if (!editItem) return;
                createActionMutation.mutate({
                  riskOpportunityYearId: editItem.riskOpportunityYearId,
                  data: {
                    title: newActionTitle.trim(),
                    responsibleId: user?.id ?? null,
                    effectivenessEvaluationMethod: newActionMethod.trim() || null,
                  },
                });
              }}
              disabled={!newActionTitle.trim() || createActionMutation.isPending}
            >
              {createActionMutation.isPending ? "A registar..." : "Registar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
        title="Eliminar Registo"
        description="Tem a certeza que deseja eliminar este registo?"
        onConfirm={() => {
          if (confirmDeleteId !== null) deleteMutation.mutate(confirmDeleteId);
        }}
      />

      {/* Process Association Dialog */}
      {editItem && (
        <ProcessAssociationDialog
          open={processDialogOpen}
          onOpenChange={setProcessDialogOpen}
          allProcesses={processOptions ?? []}
          associatedIds={new Set(optimisticProcesses.map((p) => p.processYearId))}
          onAssociate={(processYearId) => {
            const process = processOptions?.find((p) => p.processYearId === processYearId);
            if (process) setOptimisticProcesses((prev) => [...prev, process]);
            associateProcessMutation.mutate({ riskOpportunityYearId: editItem.riskOpportunityYearId, processIds: [processYearId], process });
          }}
          onDisassociate={(processYearId) => {
            setOptimisticProcesses((prev) =>
              prev.filter((p) => p.processYearId !== processYearId)
            );
            disassociateProcessMutation.mutate({ riskOpportunityYearId: editItem.riskOpportunityYearId, processIds: [processYearId] })
          }}
          isPending={associateProcessMutation.isPending || disassociateProcessMutation.isPending}
        />
      )}

      {/* Year Association Dialog */}
      <YearAssociationDialog
        open={yearAssociateDialogOpen}
        onOpenChange={setYearAssociateDialogOpen}
        title="Gerir Anos"
        description={`Associe ou desassocie este ${TYPE_LABELS[activeTab].toLowerCase()} a anos.`}
        allYears={years ?? []}
        associatedYearIds={associatedYearIds}
        currentYearId={effectiveYearId}
        onAssociate={(yearId) => {
          if (yearAssociateItem) {
            associateYearsMutation.mutate({
              id: yearAssociateItem.id,
              yearIds: [yearId],
              copyAttributes: true,
              copyProcesses: false,
            });
          }
        }}
        onDisassociate={(yearId) => {
          if (yearAssociateItem) {
            disassociateYearsMutation.mutate({
              id: yearAssociateItem.id,
              yearIds: [yearId],
            });
          }
        }}
        isPending={associateYearsMutation.isPending || disassociateYearsMutation.isPending}
      />
      <LogDialog
        open={pageLogOpen}
        onOpenChange={setPageLogOpen}
        entityTypes={["RISK_OPPORTUNITY"] as EntityType[]}
        yearId={selectedYearId ?? undefined}
        title="Histórico — Riscos e Oportunidades"
      />
    </div>
  );
}

/* ─── List View ─── */

function ListView({
  items,
  onEdit,
  onDelete,
  onManageYears,
  isExternal,
}: {
  items: RiskOpportunityResponse[];
  onEdit: (item: RiskOpportunityResponse) => void;
  onDelete: (id: number) => void;
  onManageYears: (item: RiskOpportunityResponse) => void;
  isExternal: boolean;
}) {
  return (
    <div className="overflow-visible">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Código</th>
            <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Origem</th>
            <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Descrição</th>
            <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Categoria</th>
            <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">I × P</th>
            <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nível</th>
            <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Decisão</th>
            <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {items.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-16 text-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <AlertTriangle size={32} />
                  <p className="text-sm font-medium">Nenhum item encontrado.</p>
                </div>
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <RowItem
                key={`${item.id}-${item.yearId}`}
                item={item}
                onEdit={onEdit}
                onDelete={onDelete}
                onManageYears={onManageYears}
                isExternal={isExternal}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function RowItem({
  item,
  onEdit,
  onDelete,
  onManageYears,
  isExternal,
}: {
  item: RiskOpportunityResponse;
  onEdit: (item: RiskOpportunityResponse) => void;
  onDelete: (id: number) => void;
  onManageYears: (item: RiskOpportunityResponse) => void;
  isExternal: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <tr
      className="hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={() => onEdit(item)}
    >
      <td className="px-6 py-4">
        <span className="text-xs font-bold text-foreground">{item.code}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs text-muted-foreground">
          {ORIGIN_OPTIONS.find((o) => o.value === item.origin)?.label ?? item.origin}
        </span>
      </td>
      <td className="px-6 py-4 max-w-[280px]">
        <p className="text-sm text-foreground font-medium line-clamp-1">{item.description}</p>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs text-muted-foreground">{item.category}</span>
      </td>
      <td className="px-6 py-4 text-center">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
          riskLevelColor(item.impact, item.probability)
        }`}>
          {item.impact ?? "?"} × {item.probability ?? "?"}
        </span>
      </td>
      <td className="px-6 py-4">
        <Badge variant={riskLevelBadge(item.impact, item.probability)}>
          {item.riskLevel != null ? item.riskLevel : "—"}
        </Badge>
      </td>
      <td className="px-6 py-4">
        {item.decision ? (
          <Badge variant={decisionBadgeVariant(item.decision)}>
            {DECISION_LABELS[item.decision]}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
        <button
          ref={buttonRef}
          onClick={() => {
            if (!menuOpen && buttonRef.current) {
              const rect = buttonRef.current.getBoundingClientRect();
              setMenuPos({
                top: rect.bottom + 4,
                right: window.innerWidth - rect.right + 16,
              });
            }
            setMenuOpen((prev) => !prev);
          }}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all cursor-pointer"
        >
          <MoreVertical size={16} />
        </button>
        {menuOpen && (
          <div
            ref={menuRef}
            style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 50 }}
            className="bg-card border border-border rounded-xl shadow-lg py-1 min-w-[160px]"
          >
            {!isExternal && (
            <button
              onClick={() => { setMenuOpen(false); onEdit(item); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left cursor-pointer"
            >
              <Pencil size={14} />
              Editar
            </button>
          )}
            <button
              onClick={() => { setMenuOpen(false); onManageYears(item); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left cursor-pointer"
            >
              <CalendarDays size={14} />
              Gerir Anos
            </button>
            {!isExternal && (
              <>
                <div className="border-t border-border my-1" />
                <button
                  onClick={() => { setMenuOpen(false); onDelete(item.id); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left cursor-pointer"
                >
                  <Trash2 size={14} />
                  Eliminar
                </button>
              </>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

/* ─── Matrix View ─── */

function MatrixView({ items }: { items: RiskOpportunityResponse[] }) {
  const criticalItems = items.filter(
    (item) => (item.impact ?? 0) * (item.probability ?? 0) >= 15,
  );
  const highItems = items.filter(
    (item) => {
      const s = (item.impact ?? 0) * (item.probability ?? 0);
      return s >= 8 && s < 15;
    },
  );

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <LayoutGrid size={16} className="text-muted-foreground" />
            Matriz de Risco (5×5)
          </h3>
          <div className="relative">
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-bold text-muted-foreground uppercase tracking-widest origin-center whitespace-nowrap">
              Probabilidade
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Impacto
            </div>
            <div className="grid grid-cols-5 grid-rows-5 border-2 border-border rounded-lg overflow-hidden aspect-square max-w-[400px] mx-auto">
              {[5, 4, 3, 2, 1].map((p) =>
                [1, 2, 3, 4, 5].map((i) => {
                  const score = i * p;
                  let bgColor = "bg-emerald-50 dark:bg-emerald-950/20";
                  if (score >= 15) bgColor = "bg-red-50 dark:bg-red-950/20";
                  else if (score >= 8) bgColor = "bg-amber-50 dark:bg-amber-950/20";

                  const itemsInCell = items.filter(
                    (item) => item.impact === i && item.probability === p,
                  );

                  return (
                    <div
                      key={`${p}-${i}`}
                      className={`${bgColor} border border-border/50 flex items-center justify-center relative group`}
                    >
                      <span className="text-[8px] text-muted-foreground/40 absolute top-0.5 left-1 font-mono">
                        {i},{p}
                      </span>
                      {itemsInCell.length > 0 && (
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${
                            score >= 15
                              ? "bg-destructive text-destructive-foreground"
                              : score >= 8
                                ? "bg-amber-500 text-white"
                                : "bg-emerald-600 text-white"
                          }`}
                        >
                          {itemsInCell.length}
                        </div>
                      )}
                      {itemsInCell.length > 0 && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-popover text-popover-foreground p-2 rounded-lg text-[10px] opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none shadow-xl border border-border">
                          <p className="font-bold mb-1 border-b border-border pb-1">
                            I:{i} P:{p}
                          </p>
                          <ul className="space-y-1 max-h-24 overflow-y-auto">
                            {itemsInCell.map((item) => (
                              <li key={item.id} className="truncate">
                                • {item.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                }),
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertTriangle size={14} className="text-destructive" />
              Críticos
            </h3>
            {criticalItems.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Nenhum item crítico.</p>
            ) : (
              <div className="space-y-2">
                {criticalItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2 p-2.5 bg-destructive/5 rounded-lg border border-destructive/20"
                  >
                    <AlertTriangle size={14} className="text-destructive shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{item.description}</p>
                      <p className="text-[10px] text-destructive font-medium uppercase tracking-wider mt-0.5">
                        Nível: {item.riskLevel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-amber-500" />
              Resumo
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-bold text-foreground">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Críticos:</span>
                <span className="font-bold text-destructive">{criticalItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Moderados:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{highItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Baixos:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {items.length - criticalItems.length - highItems.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskActionCard({
  action,
  isExternal,
  onEdit,
  onDelete,
}: {
  action: RiskActionResponse;
  isExternal: boolean;
  onEdit: (data: {
    title?: string;
    effectivenessEvaluationMethod?: string | null;
    status?: ActionStatus;
    notes?: string | null;
    monitoringQ1?: string | null;
    monitoringQ2?: string | null;
    monitoringQ3?: string | null;
    monitoringQ4?: string | null;
  }) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(action.title);
  const [editMethod, setEditMethod] = useState(action.effectivenessEvaluationMethod ?? "");
  const [editNotes, setEditNotes] = useState(action.notes ?? "");
  const [editQ1, setEditQ1] = useState(action.monitoringQ1 ?? "");
  const [editQ2, setEditQ2] = useState(action.monitoringQ2 ?? "");
  const [editQ3, setEditQ3] = useState(action.monitoringQ3 ?? "");
  const [editQ4, setEditQ4] = useState(action.monitoringQ4 ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  function handleSave() {
    onEdit({
      title: editTitle.trim(),
      effectivenessEvaluationMethod: editMethod.trim() || null,
      notes: editNotes.trim() || null,
      monitoringQ1: editQ1.trim() || null,
      monitoringQ2: editQ2.trim() || null,
      monitoringQ3: editQ3.trim() || null,
      monitoringQ4: editQ4.trim() || null,
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="border border-border rounded-xl p-5 bg-card shadow-sm">
        <h4 className="font-bold text-foreground mb-4">Editar Ação</h4>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          </div>
          <div>
            <Label>Método de Avaliação de Eficácia</Label>
            <textarea
              className="w-full h-20 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={editMethod}
              onChange={(e) => setEditMethod(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Acompanhamento 1º Trim.</Label>
              <Input value={editQ1} onChange={(e) => setEditQ1(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Acompanhamento 2º Trim.</Label>
              <Input value={editQ2} onChange={(e) => setEditQ2(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Acompanhamento 3º Trim.</Label>
              <Input value={editQ3} onChange={(e) => setEditQ3(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Acompanhamento 4º Trim.</Label>
              <Input value={editQ4} onChange={(e) => setEditQ4(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Estado/Ponto da Situação (Observações)</Label>
            <textarea
              className="w-full h-20 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={handleSave}>Guardar</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl p-5 bg-card shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold text-sm">
            {action.title.charAt(0)}
          </div>
          <div>
            <h4 className="font-bold text-foreground">{action.title}</h4>
            {action.responsible && (
              <p className="text-xs text-muted-foreground">
                Responsável: {action.responsible.firstName} {action.responsible.lastName}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={action.status}
            onChange={(e) => onEdit({ status: e.target.value as ActionStatus })}
            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border cursor-pointer transition-all outline-none ${riskActionStatusSelectClass(action.status)}`}
          >
            {RISK_ACTION_STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value} className="text-foreground bg-card">{s.label}</option>
            ))}
          </select>
          <div className="relative" ref={menuRef}>
            {!isExternal && (
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors cursor-pointer"
              >
                <MoreVertical size={14} className="text-muted-foreground" />
              </button>
            )}
            {menuOpen && !isExternal && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 py-1 min-w-[140px]">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setEditTitle(action.title);
                    setEditMethod(action.effectivenessEvaluationMethod ?? "");
                    setEditNotes(action.notes ?? "");
                    setEditQ1(action.monitoringQ1 ?? "");
                    setEditQ2(action.monitoringQ2 ?? "");
                    setEditQ3(action.monitoringQ3 ?? "");
                    setEditQ4(action.monitoringQ4 ?? "");
                    setEditing(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left cursor-pointer"
                >
                  <Pencil size={13} />
                  Editar
                </button>
                <div className="border-t border-border my-1" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left cursor-pointer"
                >
                  <Trash2 size={13} />
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {action.effectivenessEvaluationMethod && (
        <p className="text-sm text-muted-foreground mb-4 border-l-2 border-primary/20 pl-4">
          {action.effectivenessEvaluationMethod}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-border">
        {[
          { label: "1º Trim.", value: action.monitoringQ1 },
          { label: "2º Trim.", value: action.monitoringQ2 },
          { label: "3º Trim.", value: action.monitoringQ3 },
          { label: "4º Trim.", value: action.monitoringQ4 },
        ].map((q) => (
          <div key={q.label}>
            <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              {q.label}
            </h5>
            <p className="text-xs text-foreground">{q.value || "—"}</p>
          </div>
        ))}
      </div>

      {action.notes && (
        <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border">
          {action.notes}
        </p>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar Ação"
        description="Tem a certeza que deseja eliminar esta ação?"
        onConfirm={onDelete}
      />
    </div>
  );
}
