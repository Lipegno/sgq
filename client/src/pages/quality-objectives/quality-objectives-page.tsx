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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import {
  Target,
  Plus,
  Search,
  Trash2,
  MoreVertical,
  Pencil,
  CalendarDays,
  ArrowUpDown,
  Link as LinkIcon,
  X,
  Check,
  User,
  History,
  Gauge,
} from "lucide-react";
import {
  getYears,
  getQualityObjectivesByYear,
  createQualityObjective,
  updateQualityObjective,
  deleteQualityObjective,
  deleteQualityObjectiveFromYear,
  associateQualityObjectiveYears,
  getProcessOptionsByYear,
  getIndicatorsSimple,
  getUsers,
} from "@/api/core";
import YearAssociationDialog from "@/components/year-association-dialog";
import ProcessAssociationDialog from "@/components/process-association-dialog";
import ConfirmDialog from "@/components/confirm-dialog";
import { YearSelector } from "@/components/year-selector";
import { LogDialog } from "@/components/log-dialog";
import type {
  QualityObjectiveResponse,
  QualityObjectiveStatus,
  ProcessOptionResponse,
  EntityType,
} from "@/types";

export interface ObjectiveAction {
  id?: number;
  actionText: string;      // AÇÕES A REALIZAR -> Ações
  deadline: string;        // PRAZO
  resources: string;       // RECURSOS
  responsibleId: number | null; // RESPONSÁVEL
  startDate: string;       // ACOMPANHAMENTO -> DATA INÍCIO
  endDate: string;         // ACOMPANHAMENTO -> DATA CONCLUSÃO
  q1Review: string;        // 1º Trimestre
  q2Review: string;        // 2º Trimestre
  q3Review: string;        // 3º Trimestre
  finalResult: string;     // ACOMPANHAMENTO -> Resultado Final
  targetAchieved: boolean; // ACOMPANHAMENTO -> Atingi Objetivo (Sim/Não)
  observations: string;    // ACOMPANHAMENTO -> Observações
}

const STATUS_LABELS: Record<QualityObjectiveStatus, string> = {
  ACHIEVED: "Alcançado",
  IN_PROGRESS: "Em Progresso",
};

const STATUS_OPTIONS: { value: QualityObjectiveStatus; label: string }[] = [
  { value: "IN_PROGRESS", label: "Em Progresso" },
  { value: "ACHIEVED", label: "Alcançado" },
];

function statusBadgeVariant(status: QualityObjectiveStatus) {
  switch (status) {
    case "ACHIEVED": return "default" as const;
    case "IN_PROGRESS": return "secondary" as const;
  }
}

export default function QualityObjectivesPage() {
  const queryClient = useQueryClient();
  const { isExternal } = useAuth();

  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [pageLogOpen, setPageLogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<"asc" | "desc">("desc");
  const [formActions, setFormActions] = useState<ObjectiveAction[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<QualityObjectiveResponse | null>(null);
  const viewOnly = isExternal && editItem !== null;
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formResponsibleId, setFormResponsibleId] = useState<number | null>(null);
  const [formStatus, setFormStatus] = useState<QualityObjectiveStatus>("IN_PROGRESS");

  const [yearAssociateDialogOpen, setYearAssociateDialogOpen] = useState(false);
  const [yearAssociateItem, setYearAssociateItem] = useState<QualityObjectiveResponse | null>(null);
  const [associatedYearIds, setAssociatedYearIds] = useState<Set<number>>(new Set());

  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [indicatorDialogOpen, setIndicatorDialogOpen] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [optimisticProcesses, setOptimisticProcesses] = useState<ProcessOptionResponse[]>([]);

  const optimisticRef = useRef<ProcessOptionResponse[]>([]);
  useEffect(() => {
    optimisticRef.current = optimisticProcesses;
  }, [optimisticProcesses]);

  const processMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateQualityObjective>[1] }) =>
      updateQualityObjective(id, data),
    onSuccess: (_data, variables) => {
      invalidateAll();
      setEditItem((prev) => {
        if (!prev || prev.id !== variables.id) return prev;
        return { ...prev, processes: optimisticRef.current };
      });
    },
  });

  const [optimisticIndicators, setOptimisticIndicators] = useState<any[]>([]);
  const optimisticIndicatorsRef = useRef<any[]>([]);
  useEffect(() => {
    optimisticIndicatorsRef.current = optimisticIndicators;
  }, [optimisticIndicators]);

  const indicatorMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateQualityObjective>[1] }) =>
      updateQualityObjective(id, data),
    onSuccess: (_data, variables) => {
      invalidateAll();
      setEditItem((prev) => {
        if (!prev || prev.id !== variables.id) return prev;
        return { ...prev, indicators: optimisticIndicatorsRef.current };
      });
    },
  });

  const { data: years } = useQuery({ queryKey: ["years"], queryFn: getYears });
  const effectiveYearId = selectedYearId;

  useEffect(() => {
    if (selectedYearId !== null) return;
    if (!years || years.length === 0) return;
    const currentYearVal = new Date().getFullYear();
    const match = years.find(y => y.year === currentYearVal) ?? years[0];
    setSelectedYearId(match.id);
  }, [selectedYearId, years]);

  const { data: users } = useQuery({ queryKey: ["users"], queryFn: getUsers });

  const { data: objectives, isLoading } = useQuery({
    queryKey: ["quality-objectives", effectiveYearId],
    queryFn: () => getQualityObjectivesByYear(effectiveYearId!),
    enabled: effectiveYearId !== null,
  });

  const { data: processOptions } = useQuery({
    queryKey: ["process-options", effectiveYearId],
    queryFn: () => getProcessOptionsByYear(effectiveYearId!),
    enabled: effectiveYearId !== null,
  });

  const { data: indicatorOptions } = useQuery({
    queryKey: ["indicator-options", effectiveYearId],
    queryFn: () => getIndicatorsSimple(effectiveYearId!),
    enabled: effectiveYearId !== null,
  });

  const items = useMemo(() => {
    let list = objectives ?? [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.objectiveTitle.toLowerCase().includes(q) ||
          (item.description ?? "").toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => {
      return sortMode === "desc"
        ? b.id - a.id
        : a.id - b.id;
    });
  }, [objectives, searchQuery, sortMode]);

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["quality-objectives"] });
  }

  const createMutation = useMutation({
    mutationFn: createQualityObjective,
    onSuccess: () => {
      invalidateAll();
      toast.success("Objetivo registado com sucesso.");
      setEditOpen(false);
      setEditItem(null);
    },
    onError: () => toast.error("Erro ao registar objetivo."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateQualityObjective>[1] }) =>
      updateQualityObjective(id, data),
    onSuccess: () => {
      invalidateAll();
      toast.success("Objetivo atualizado com sucesso.");
      setEditOpen(false);
      setEditItem(null);
    },
    onError: () => toast.error("Erro ao atualizar objetivo."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteQualityObjective,
    onSuccess: () => {
      invalidateAll();
      toast.success("Objetivo eliminado com sucesso.");
    },
    onError: () => toast.error("Erro ao eliminar objetivo."),
  });

  const associateYearsMutation = useMutation({
    mutationFn: ({ id, yearIds, copy }: { id: number; yearIds: number[]; copy: boolean }) =>
      associateQualityObjectiveYears(id, { yearIds, copyProcessesAndIndicators: copy }),
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
      deleteQualityObjectiveFromYear(id, yearIds[0]),
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

  function openCreate() {
    setEditItem(null);
    setFormTitle("");
    setFormDescription("");
    setFormResponsibleId(null);
    setFormStatus("IN_PROGRESS");
    setOptimisticProcesses([]);
    setOptimisticIndicators([]);
    setFormActions([]); // 🌟 Garante que um novo objetivo começa sem ações antigas
    setEditOpen(true);
  }

  function openEdit(item: QualityObjectiveResponse) {
    setEditItem(item);
    setFormTitle(item.objectiveTitle);
    setFormDescription(item.description ?? "");
    setFormResponsibleId(item.responsible?.id ?? null);
    setFormStatus(item.status);
    setOptimisticProcesses(item.processes);
    setOptimisticIndicators(item.indicators);
    setFormActions((item as any).actions || []);

    setEditOpen(true);
  }

  function handleSubmit() {
    if (!formTitle.trim() || !effectiveYearId) return;
    
    if (editItem) {
      updateMutation.mutate({
        id: editItem.id,
        data: {
          objectiveTitle: formTitle.trim(),
          description: formDescription.trim() || null,
          responsibleId: formResponsibleId,
          status: formStatus,
          yearId: effectiveYearId,
          // 🌟 Adicionado aqui para a EDIÇÃO (dentro do objeto data)
          actions: formActions,
        },
      });
    } else {
      createMutation.mutate({
        objectiveTitle: formTitle.trim(),
        description: formDescription.trim() || null,
        responsibleId: formResponsibleId,
        status: formStatus,
        yearIds: [effectiveYearId],
        // 🌟 Adicionado aqui para a CRIAÇÃO
        actions: formActions,
      });
    }
  }

  return (
    <div className="py-8 w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shadow-sm">
            <Target size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Objetivos do SG</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Definição, monitorização e avaliação dos objetivos do sistema de gestão.
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
              Novo Objetivo
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 pt-4 pb-3 border-b border-border">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {items.length} {items.length === 1 ? "Objetivo" : "Objetivos"}
          </h2>
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
            <button
              onClick={() => setSortMode((prev) => (prev === "desc" ? "asc" : "desc"))}
              className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all"
              title={sortMode === "desc" ? "Mais recentes primeiro" : "Mais antigos primeiro"}
            >
              <ArrowUpDown size={16} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Target size={28} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-bold text-muted-foreground">Nenhum objetivo definido</p>
            <p className="text-xs text-muted-foreground mt-1 mb-6">
              Registe o primeiro objetivo do sistema de gestão para este ano.
            </p>
            {!isExternal && (
              <Button onClick={openCreate}>
                <Plus size={16} />
                Novo Objetivo
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {items.map((item) => (
              <RowItem
                key={`${item.id}-${item.yearId}`}
                item={item}
                onEdit={openEdit}
                onDelete={(id) => setConfirmDeleteId(id)}
                onManageYears={(item) => {
                  setYearAssociateItem(item);
                  setAssociatedYearIds(new Set(item.years.map((y) => y.id)));
                  setYearAssociateDialogOpen(true);
                }}
                isExternal={isExternal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit / Create Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { if (!open) { setEditOpen(false); setEditItem(null); } }}>
        <DialogContent className="sm:max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editItem ? <Target className="text-primary" size={20} /> : <Plus size={20} />}
              {viewOnly ? "Detalhes do Objetivo" : editItem ? "Editar Objetivo" : "Novo Objetivo"}
            </DialogTitle>
            <DialogDescription>
              {viewOnly ? "Visualizar detalhes do objetivo do sistema de gestão." : editItem ? "Altere os dados do objetivo do sistema de gestão." : "Defina um novo objetivo do sistema de gestão."}
            </DialogDescription>
          </DialogHeader>

          {(() => {
            const ro = viewOnly; return (
              <div className="space-y-6 py-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="obj-title">Título do Objetivo *</Label>
                  {ro ? <p className="text-sm text-foreground py-2 px-1">{formTitle || '-'}</p>
                    : <Input
                      id="obj-title"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Ex: Reduzir reclamações em 20%"
                    />}
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="obj-desc">Descrição</Label>
                  {ro ? <p className="text-sm text-foreground whitespace-pre-wrap py-2 px-1">{formDescription || '-'}</p>
                    : <textarea
                      id="obj-desc"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none resize-none"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Descreva o objetivo, metas e indicadores associados..."
                    />}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label>Responsável</Label>
                    {ro ? <p className="text-sm text-foreground py-2 px-1">{formResponsibleId ? (users?.find(u => u.id === formResponsibleId) ? `${users.find(u => u.id === formResponsibleId)!.firstName} ${users.find(u => u.id === formResponsibleId)!.lastName}` : formResponsibleId.toString()) : "Sem responsável"}</p>
                      : <Select
                        value={formResponsibleId?.toString() ?? "none"}
                        onValueChange={(v) => setFormResponsibleId(v === "none" ? null : Number(v))}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem responsável</SelectItem>
                          {users?.map((u) => (
                            <SelectItem key={u.id} value={u.id.toString()}>
                              {u.firstName} {u.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>}
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Estado</Label>
                    {ro ? <p className="text-sm text-foreground py-2 px-1">{STATUS_OPTIONS.find(s => s.value === formStatus)?.label ?? formStatus}</p>
                      : <Select
                        value={formStatus}
                        onValueChange={(v) => setFormStatus(v as QualityObjectiveStatus)}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>}
                  </div>
                </div>

                {/* Process Association Section */}
                {editItem && (
                  <div>
                    <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <LinkIcon size={14} />
                        Processos Associados
                      </h4>
                      {!ro && (
                        <button
                          onClick={() => setProcessDialogOpen(true)}
                          className="flex items-center gap-1 text-sm bg-blue-50 border border-blue-200 hover:border-blue-400 hover:text-blue-700 text-blue-600 px-3 py-1.5 rounded-md shadow-sm transition-all cursor-pointer"
                        >
                          <LinkIcon size={14} />
                          Gerir Processos
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                      {optimisticProcesses.length > 0 ? (
                        optimisticProcesses.map((proc) => (
                          <div
                            key={proc.processYearId}
                            className="flex items-center justify-between text-sm bg-card border border-border px-3 py-2 rounded-lg shadow-sm"
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-foreground truncate">{proc.processName}</span>
                              {proc.macroProcessName && (
                                <span className="text-xs text-muted-foreground uppercase truncate">{proc.macroProcessName}</span>
                              )}
                            </div>
                            {!ro && (
                              <button
                                onClick={() => {
                                  if (editItem && effectiveYearId) {
                                    setOptimisticProcesses((prev) =>
                                      prev.filter((p) => p.processYearId !== proc.processYearId)
                                    );
                                    processMutation.mutate({
                                      id: editItem.id,
                                      data: {
                                        yearId: effectiveYearId,
                                        processYearIds: optimisticProcesses
                                          .filter((p) => p.processYearId !== proc.processYearId)
                                          .map((p) => p.processYearId),
                                      },
                                    });
                                  }
                                }}
                                className="text-muted-foreground hover:text-destructive transition-colors p-1 cursor-pointer shrink-0"
                                title="Desassociar"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full py-8 text-center border-2 border-dashed border-border rounded-lg text-muted-foreground text-sm">
                          Nenhum processo associado.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Indicator Association Section */}
                {editItem && (
                  <div>
                    <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Gauge size={14} />
                        Indicadores Associados
                      </h4>
                      {!ro && (
                        <button
                          onClick={() => setIndicatorDialogOpen(true)}
                          className="flex items-center gap-1 text-sm bg-blue-50 border border-blue-200 hover:border-blue-400 hover:text-blue-700 text-blue-600 px-3 py-1.5 rounded-md shadow-sm transition-all cursor-pointer"
                        >
                          <LinkIcon size={14} />
                          Gerir Indicadores
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                      {optimisticIndicators.length > 0 ? (
                        optimisticIndicators.map((ind: any) => (
                          <div
                            key={ind.indicatorYearId}
                            className="flex items-center justify-between text-sm bg-card border border-border px-3 py-2 rounded-lg shadow-sm"
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-foreground truncate">{ind.name}</span>
                              <span className="text-xs text-muted-foreground truncate">{ind.formula}</span>
                            </div>
                            {!ro && (
                              <button
                                onClick={() => {
                                  if (editItem && effectiveYearId) {
                                    setOptimisticIndicators((prev) =>
                                      prev.filter((i: any) => i.indicatorYearId !== ind.indicatorYearId)
                                    );
                                    indicatorMutation.mutate({
                                      id: editItem.id,
                                      data: {
                                        yearId: effectiveYearId,
                                        indicatorYearIds: optimisticIndicators
                                          .filter((i: any) => i.indicatorYearId !== ind.indicatorYearId)
                                          .map((i: any) => i.indicatorYearId),
                                      },
                                    });
                                  }
                                }}
                                className="text-muted-foreground hover:text-destructive transition-colors p-1 cursor-pointer shrink-0"
                                title="Desassociar"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full py-8 text-center border-2 border-dashed border-border rounded-lg text-muted-foreground text-sm">
                          Nenhum indicador associado.
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Secção do Plano de Ações e Matriz de Acompanhamento */}
                <div className="border-t border-border pt-6 mt-6 w-full">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Target size={14} />
                      Plano de Ações e Acompanhamento
                    </h4>
                    {!ro && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormActions([...formActions, {
                          actionText: "", deadline: "", resources: "", responsibleId: null,
                          startDate: "", endDate: "", q1Review: "", q2Review: "", q3Review: "",
                          finalResult: "", targetAchieved: false, observations: ""
                        }])}
                      >
                        <Plus size={14} className="mr-1" /> Adicionar Ação
                      </Button>
                    )}
                  </div>

                  {/* Lista de Ações Reestruturada Verticalmente */}
                  <div className="space-y-4 w-full">
                    {formActions.length === 0 ? (
                      <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl bg-muted/10">
                        Nenhuma ação mapeada para este objetivo.
                      </div>
                    ) : (
                      formActions.map((action, index) => (
                        <div key={index} className="border border-border rounded-xl p-4 bg-muted/20 relative space-y-4">

                          {/* Cabeçalho da Ação com botão de remover */}
                          <div className="flex items-center justify-between border-b border-border/60 pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Ação #{index + 1}
                            </span>
                            {!ro && (
                              <button
                                type="button"
                                onClick={() => setFormActions(formActions.filter((_, i) => i !== index))}
                                className="text-muted-foreground hover:text-destructive transition-colors p-1 cursor-pointer flex items-center gap-1 text-xs"
                              >
                                <Trash2 size={14} /> Remover Ação
                              </button>
                            )}
                          </div>

                          {/* 1. SECÇÃO: CARACTERIZAÇÃO (Ações a Realizar) */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80 block">
                              Ações a Realizar
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <div className="md:col-span-2 space-y-1">
                                <label className="text-[11px] text-muted-foreground font-medium">O que fazer (Ação)</label>
                                <Input disabled={ro} value={action.actionText} onChange={(e) => {
                                  const updated = [...formActions]; updated[index].actionText = e.target.value; setFormActions(updated);
                                }} placeholder="Descrição detalhada do que vai ser feito..." className="h-9 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] text-muted-foreground font-medium">Prazo</label>
                                <Input disabled={ro} value={action.deadline} onChange={(e) => {
                                  const updated = [...formActions]; updated[index].deadline = e.target.value; setFormActions(updated);
                                }} placeholder="Ex: Q2 2026, Março..." className="h-9 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] text-muted-foreground font-medium">Recursos</label>
                                <Input disabled={ro} value={action.resources} onChange={(e) => {
                                  const updated = [...formActions]; updated[index].resources = e.target.value; setFormActions(updated);
                                }} placeholder="Humanos, financeiros..." className="h-9 text-sm" />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-2">
                              <div className="md:col-span-2 space-y-1">
                                <label className="text-[11px] text-muted-foreground font-medium">Responsável pela Ação</label>
                                <Select disabled={ro} value={action.responsibleId?.toString() ?? "none"} onValueChange={(v) => {
                                  const updated = [...formActions]; updated[index].responsibleId = v === "none" ? null : Number(v); setFormActions(updated);
                                }}>
                                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Selecione o responsável</SelectItem>
                                    {users?.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.firstName} {u.lastName}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                          {/* 2. SECÇÃO: ACOMPANHAMENTO (Trimestres e Resultados) */}
                          <div className="space-y-2 border-t border-border/40 pt-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block">
                              Acompanhamento da Execução
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <div className="space-y-1">
                                <label className="text-[11px] text-muted-foreground font-medium">Data Início Real</label>
                                <input disabled={ro} type="date" value={action.startDate} onChange={(e) => {
                                  const updated = [...formActions]; updated[index].startDate = e.target.value; setFormActions(updated);
                                }} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] text-muted-foreground font-medium">Data Conclusão Real</label>
                                <input disabled={ro} type="date" value={action.endDate} onChange={(e) => {
                                  const updated = [...formActions]; updated[index].endDate = e.target.value; setFormActions(updated);
                                }} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                              </div>
                              <div className="md:col-span-2 space-y-1">
                                <label className="text-[11px] text-muted-foreground font-medium">Observações Gerais</label>
                                <Input disabled={ro} value={action.observations} onChange={(e) => {
                                  const updated = [...formActions]; updated[index].observations = e.target.value; setFormActions(updated);
                                }} placeholder="Notas, desvios ou impedimentos..." className="h-9 text-sm" />
                              </div>
                            </div>

                            {/* Sub-grelha para as avaliações intercalares e meta final */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-2 items-end">
                              <div className="space-y-1">
                                <label className="text-[11px] text-muted-foreground font-medium">1º Trimestre</label>
                                <Input disabled={ro} value={action.q1Review} onChange={(e) => {
                                  const updated = [...formActions]; updated[index].q1Review = e.target.value; setFormActions(updated);
                                }} placeholder="Evolução Q1..." className="h-9 text-xs" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] text-muted-foreground font-medium">2º Trimestre</label>
                                <Input disabled={ro} value={action.q2Review || ""} onChange={(e) => {
                                  const updated = [...formActions]; (updated[index] as any).q2Review = e.target.value; setFormActions(updated);
                                }} placeholder="Evolução Q2..." className="h-9 text-xs" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] text-muted-foreground font-medium">3º Trimestre</label>
                                <Input disabled={ro} value={action.q3Review || ""} onChange={(e) => {
                                  const updated = [...formActions]; (updated[index] as any).q3Review = e.target.value; setFormActions(updated);
                                }} placeholder="Evolução Q3..." className="h-9 text-xs" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] text-muted-foreground font-medium">Resultado Final</label>
                                <Input disabled={ro} value={action.finalResult} onChange={(e) => {
                                  const updated = [...formActions]; updated[index].finalResult = e.target.value; setFormActions(updated);
                                }} placeholder="Métricas obtidas..." className="h-9 text-xs" />
                              </div>

                              {/* Checkbox de Sucesso centrada com o design */}
                              <div className="flex items-center gap-2 h-9 pb-2 pl-1 bg-background/40 border border-input/60 rounded-md px-3">
                                <input disabled={ro} type="checkbox" id={`achieved-${index}`} checked={action.targetAchieved} onChange={(e) => {
                                  const updated = [...formActions]; updated[index].targetAchieved = e.target.checked; setFormActions(updated);
                                }} className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer" />
                                <label htmlFor={`achieved-${index}`} className="text-xs font-medium text-foreground cursor-pointer select-none">
                                  Atingi Objetivo
                                </label>
                              </div>
                            </div>
                          </div>

                        </div>
                      ))
                    )}
                  </div>
                </div>
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
                  disabled={!formTitle.trim() || createMutation.isPending || updateMutation.isPending}
                >
                  {editItem ? "Guardar" : "Registar"}
                </Button>
              </>
            )}

          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Association Dialog */}
      {editItem && (
        <ProcessAssociationDialog
          open={processDialogOpen}
          onOpenChange={setProcessDialogOpen}
          allProcesses={processOptions ?? []}
          associatedIds={new Set(optimisticProcesses.map((p) => p.processYearId))}
          onAssociate={(processYearId) => {
            if (editItem && effectiveYearId) {
              const proc = processOptions?.find((p) => p.processYearId === processYearId);
              if (proc) setOptimisticProcesses((prev) => [...prev, proc]);
              processMutation.mutate({
                id: editItem.id,
                data: {
                  yearId: effectiveYearId,
                  processYearIds: [
                    ...optimisticProcesses.map((p) => p.processYearId),
                    processYearId,
                  ],
                },
              });
            }
          }}
          onDisassociate={(processYearId) => {
            if (editItem && effectiveYearId) {
              setOptimisticProcesses((prev) =>
                prev.filter((p) => p.processYearId !== processYearId)
              );
              processMutation.mutate({
                id: editItem.id,
                data: {
                  yearId: effectiveYearId,
                  processYearIds: optimisticProcesses
                    .filter((p) => p.processYearId !== processYearId)
                    .map((p) => p.processYearId),
                },
              });
            }
          }}
          isPending={processMutation.isPending}
        />
      )}

      {/* Indicator Association Dialog */}
      {editItem && indicatorDialogOpen && (
        <AssociationDialog
          isOpen={indicatorDialogOpen}
          onClose={() => setIndicatorDialogOpen(false)}
          title="Associar Indicadores"
          description="Associe ou desassocie indicadores a este objetivo."
          allItems={indicatorOptions ?? []}
          currentItemIds={new Set(optimisticIndicators.map((i: any) => i.indicatorYearId!))}
          renderItem={(ind) => (
            <div>
              <div className="font-medium text-sm text-foreground">{ind.name}</div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border border-border px-1 rounded bg-muted mt-1 inline-block">
                {ind.frequency}
              </span>
            </div>
          )}
          getItemId={(ind) => ind.indicatorYearId!}
          getSearchKey={(ind) => ind.name}
          onAssociate={(ids) => {
            if (editItem && effectiveYearId) {
              const newIndicators = ids
                .map((id) => indicatorOptions?.find((opt) => opt.indicatorYearId === id))
                .filter(Boolean) as any[];
              setOptimisticIndicators((prev) => [...prev, ...newIndicators]);
              indicatorMutation.mutate({
                id: editItem.id,
                data: {
                  yearId: effectiveYearId,
                  indicatorYearIds: [
                    ...optimisticIndicators.map((i: any) => i.indicatorYearId),
                    ...ids,
                  ],
                },
              });
            }
          }}
          onDisassociate={(ids) => {
            if (editItem && effectiveYearId) {
              setOptimisticIndicators((prev) =>
                prev.filter((i: any) => !ids.includes(i.indicatorYearId))
              );
              indicatorMutation.mutate({
                id: editItem.id,
                data: {
                  yearId: effectiveYearId,
                  indicatorYearIds: optimisticIndicators
                    .filter((i: any) => !ids.includes(i.indicatorYearId))
                    .map((i: any) => i.indicatorYearId),
                },
              });
            }
          }}
          isPending={indicatorMutation.isPending}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
        title="Eliminar Objetivo"
        description="Tem a certeza que deseja eliminar este objetivo do sistema de gestão?"
        onConfirm={() => {
          if (confirmDeleteId !== null) deleteMutation.mutate(confirmDeleteId);
        }}
      />

      <LogDialog
        open={pageLogOpen}
        onOpenChange={setPageLogOpen}
        entityTypes={["QUALITY_OBJECTIVE"] as EntityType[]}
        yearId={effectiveYearId ?? undefined}
        title="Histórico — Objetivos de Qualidade"
      />

      {/* Year Association Dialog */}
      <YearAssociationDialog
        open={yearAssociateDialogOpen}
        onOpenChange={setYearAssociateDialogOpen}
        title="Gerir Anos"
        description="Associe ou desassocie este objetivo a anos."
        allYears={years ?? []}
        associatedYearIds={associatedYearIds}
        currentYearId={effectiveYearId}
        onAssociate={(yearId) => {
          if (yearAssociateItem) {
            associateYearsMutation.mutate({
              id: yearAssociateItem.id,
              yearIds: [yearId],
              copy: false,
            });
          }
        }}
        onAssociateFull={
          yearAssociateItem &&
            (yearAssociateItem.processes.length > 0 || yearAssociateItem.indicators.length > 0)
            ? (yearId) => {
              if (yearAssociateItem) {
                associateYearsMutation.mutate({
                  id: yearAssociateItem.id,
                  yearIds: [yearId],
                  copy: true,
                });
              }
            }
            : undefined
        }
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
    </div>
  );
}

/* ─── Row Item ─── */

function RowItem({
  item,
  onEdit,
  onDelete,
  onManageYears,
  isExternal,
}: {
  item: QualityObjectiveResponse;
  onEdit: (item: QualityObjectiveResponse) => void;
  onDelete: (id: number) => void;
  onManageYears: (item: QualityObjectiveResponse) => void;
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

  const responsibleName = item.responsible
    ? `${item.responsible.firstName} ${item.responsible.lastName}`
    : null;

  return (
    <div
      className="flex items-center gap-6 px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer group"
      onClick={() => onEdit(item)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="font-bold text-foreground text-sm truncate">{item.objectiveTitle}</h3>
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
        )}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <Badge variant={statusBadgeVariant(item.status)}>
          {STATUS_LABELS[item.status]}
        </Badge>

        {responsibleName && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User size={12} />
            <span className="hidden md:inline">{responsibleName}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="bg-muted px-2 py-0.5 rounded font-medium">
            {item.processes.length} {item.processes.length === 1 ? "proc." : "procs."}
          </span>
          <span className="bg-muted px-2 py-0.5 rounded font-medium">
            {item.indicators.length} {item.indicators.length === 1 ? "ind." : "inds."}
          </span>
        </div>
      </div>

      <div onClick={(e) => e.stopPropagation()}>
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
      </div>
    </div>
  );
}

/* ─── Generic Association Dialog ─── */

function AssociationDialog<T extends { processYearId?: number; indicatorYearId?: number }>({
  isOpen,
  onClose,
  title,
  description,
  allItems,
  currentItemIds,
  renderItem,
  getItemId,
  getSearchKey,
  onAssociate,
  onDisassociate,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  allItems: T[];
  currentItemIds: Set<number>;
  renderItem: (item: T) => React.ReactNode;
  getItemId: (item: T) => number;
  getSearchKey: (item: T) => string;
  onAssociate: (ids: number[]) => void;
  onDisassociate: (ids: number[]) => void;
  isPending: boolean;
}) {
  const [search, setSearch] = useState("");

  const filteredItems = search.trim()
    ? allItems.filter((item) => {
      const name = getSearchKey(item).toLowerCase();
      return name.includes(search.toLowerCase());
    })
    : allItems;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-3 border-b bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
            <Input
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Nenhum item encontrado.
            </div>
          ) : (
            filteredItems.map((item) => {
              const id = getItemId(item);
              const isAssociated = currentItemIds.has(id);
              return (
                <button
                  key={id}
                  onClick={() => {
                    if (isAssociated) {
                      onDisassociate([id]);
                    } else {
                      onAssociate([id]);
                    }
                  }}
                  disabled={isPending}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left group ${isAssociated
                    ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                    : "border-transparent hover:bg-muted hover:border-border"
                    }`}
                >
                  {renderItem(item)}
                  {isAssociated && <Check size={16} className="text-primary shrink-0" />}
                </button>
              );
            })
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
