import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calculator,
  User,
  Link2,
  Plus,
  TrendingUp,
  Target,
  MoreVertical,
  Calendar,
  Trash2,
  History,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import {
  updateIndicator,
  createMeasurement,
  associateIndicatorProcesses,
  disassociateIndicatorProcesses,
  deleteIndicator,
  associateIndicatorYears,
  disassociateIndicatorYears,
  getProcessOptionsByYear,
  getUsers,
  getYears,
  getIndicatorsByYear,
} from "@/api/core";
import ProcessAssociationDialog from "@/components/process-association-dialog";
import YearAssociationDialog from "@/components/year-association-dialog";
import ConfirmDialog from "@/components/confirm-dialog";
import { LogDialog } from "@/components/log-dialog";
import type {
  IndicatorWithProcesses,
  IndicatorFrequency,
  IndicatorValueType,
  UserSummary,
} from "@/types";

const frequencyColors: Record<string, string> = {
  ANNUAL: "bg-orange-50 text-orange-700 border-orange-200",
  SEMESTER: "bg-blue-50 text-blue-700 border-blue-200",
  TRIMESTER: "bg-purple-50 text-purple-700 border-purple-200",
  MONTHLY: "bg-green-50 text-green-700 border-green-200",
  WEEKLY: "bg-cyan-50 text-cyan-700 border-cyan-200",
};

const frequencyLabels: Record<string, string> = {
  ANNUAL: "Anual",
  SEMESTER: "Semestral",
  TRIMESTER: "Trimestral",
  MONTHLY: "Mensal",
  WEEKLY: "Semanal",
};

const valueTypeLabels: Record<string, string> = {
  NUMBER: "Número",
  PERCENTAGE: "Percentagem",
  RATIO: "Rácio",
  TIME: "Tempo",
  CURRENCY: "Moeda",
};

const valueTypeShort: Record<string, string> = {
  NUMBER: "#",
  PERCENTAGE: "%",
  RATIO: ":1",
  TIME: "t",
  CURRENCY: "€",
};

interface IndicatorItemProps {
  indicator: IndicatorWithProcesses;
  yearId: number;
}

export const IndicatorItem: React.FC<IndicatorItemProps> = ({ indicator, yearId }) => {
  const queryClient = useQueryClient();
  const { isExternal } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [processOpen, setProcessOpen] = useState(false);
  const [measurementFormOpen, setMeasurementFormOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [yearsOpen, setYearsOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    name: indicator.name ?? "",
    formula: indicator.formula ?? "",
    frequency: indicator.frequency ?? "ANNUAL" as IndicatorFrequency,
    valueType: (indicator.valueType ?? "NUMBER") as IndicatorValueType,
    responsibleId: indicator.responsible?.id ?? null as number | null,
    goal: indicator.goal?.toString() ?? "",
    notes: indicator.notes ?? "",
  });

  const [mDate, setMDate] = useState("");
  const [mValue, setMValue] = useState("");
  const [mNotes, setMNotes] = useState("");
  const [optimisticProcessIds, setOptimisticProcessIds] = useState<Set<number>>(
    new Set(indicator.processes?.map((p) => p.processYearId) ?? [])
  );

  useEffect(() => {
    setOptimisticProcessIds(new Set(indicator.processes?.map((p) => p.processYearId) ?? []));
  }, [indicator.processes]);

  useEffect(() => {
    if (detailOpen) {
      setEditForm({
        name: indicator.name ?? "",
        formula: indicator.formula ?? "",
        frequency: indicator.frequency ?? "ANNUAL" as IndicatorFrequency,
        valueType: (indicator.valueType ?? "NUMBER") as IndicatorValueType,
        responsibleId: indicator.responsible?.id ?? null,
        goal: indicator.goal?.toString() ?? "",
        notes: indicator.notes ?? "",
      });
      setIsEditing(false);
    }
  }, [detailOpen, indicator]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const { data: processOptions } = useQuery({
    queryKey: ["process-options", yearId],
    queryFn: () => getProcessOptionsByYear(yearId),
    enabled: detailOpen,
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    enabled: detailOpen,
  });

  const { data: allYears } = useQuery({
    queryKey: ["years"],
    queryFn: getYears,
    enabled: yearsOpen,
  });

  const { data: indicatorAllParties } = useQuery({
    queryKey: ["indicators-all-for-year-assoc", indicator.indicatorId, yearsOpen],
    queryFn: async () => {
      const yrs = allYears ? [...allYears].sort((a, b) => b.year - a.year) : [];
      const results: Array<{ yearId: number }> = [];
      await Promise.all(
        yrs.map(async (y) => {
          const items = await getIndicatorsByYear(y.id);
          if (items.some((i) => i.indicatorId === indicator.indicatorId)) {
            results.push({ yearId: y.id });
          }
        })
      );
      return results;
    },
    enabled: yearsOpen && allYears !== undefined && indicator.indicatorId !== undefined,
  });

  const sortedYearsAll = allYears ? [...allYears].sort((a, b) => b.year - a.year) : [];
  const associatedYearIds = new Set(
    (indicatorAllParties ?? []).map((r) => r.yearId)
  );

  const updateMutation = useMutation({
    mutationFn: (data: {
      name?: string;
      formula?: string;
      frequency?: string;
      valueType?: string;
      responsibleId?: number | null;
      goal?: number | null;
      notes?: string | null;
    }) =>
      updateIndicator(indicator.indicatorYearId!, data),
    onSuccess: () => {
      toast.success("Indicador atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["indicators", yearId] });
      setIsEditing(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao atualizar indicador");
    },
  });

  const createMeasurementMutation = useMutation({
    mutationFn: (data: { measurementDate: string; value: number; notes?: string }) =>
      createMeasurement(indicator.indicatorYearId!, data),
    onSuccess: () => {
      toast.success("Medição registada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["indicators", yearId] });
      setMDate("");
      setMValue("");
      setMNotes("");
      setMeasurementFormOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao registar medição");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteIndicator(indicator.indicatorYearId!),
    onSuccess: () => {
      toast.success("Indicador eliminado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["indicators", yearId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao eliminar indicador");
    },
  });

  const associateYearMutation = useMutation({
    mutationFn: ({ indicatorId, yId }: { indicatorId: number; yId: number }) =>
      associateIndicatorYears(indicatorId, [yId]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indicators-all-for-year-assoc"] });
      toast.success("Ano associado com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao associar ano");
    },
  });

  const disassociateYearMutation = useMutation({
    mutationFn: ({ indicatorId, yId }: { indicatorId: number; yId: number }) =>
      disassociateIndicatorYears(indicatorId, [yId]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indicators-all-for-year-assoc"] });
      toast.success("Ano desassociado com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao desassociar ano");
    },
  });

  const handleSaveEdit = () => {
    updateMutation.mutate({
      name: editForm.name,
      formula: editForm.formula,
      frequency: editForm.frequency,
      valueType: editForm.valueType,
      responsibleId: editForm.responsibleId,
      goal: editForm.goal ? Number(editForm.goal) : null,
      notes: editForm.notes || null,
    });
  };

  const handleAssociate = (processYearId: number) => {
    setOptimisticProcessIds((prev) => new Set(prev).add(processYearId));
    associateIndicatorProcesses(indicator.indicatorYearId!, [processYearId])
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["indicators", yearId] });
        toast.success("Processo associado com sucesso!");
      })
      .catch((err: any) => {
        setOptimisticProcessIds((prev) => {
          const next = new Set(prev);
          next.delete(processYearId);
          return next;
        });
        toast.error(err?.response?.data?.message ?? "Erro ao associar processo");
      });
  };

  const handleDisassociate = (processYearId: number) => {
    setOptimisticProcessIds((prev) => {
      const next = new Set(prev);
      next.delete(processYearId);
      return next;
    });
    disassociateIndicatorProcesses(indicator.indicatorYearId!, [processYearId])
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["indicators", yearId] });
        toast.success("Processo desassociado com sucesso!");
      })
      .catch((err: any) => {
        setOptimisticProcessIds((prev) => new Set(prev).add(processYearId));
        toast.error(err?.response?.data?.message ?? "Erro ao desassociar processo");
      });
  };

  const displayName = indicator.responsible
    ? `${indicator.responsible.firstName} ${indicator.responsible.lastName}`
    : indicator.owner ?? "—";

  const measurements = indicator.measurements ?? [];

  return (
    <>
      <div className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-all">
        <div
          className="flex items-center gap-3 px-5 py-4 cursor-pointer"
          onClick={() => setDetailOpen(true)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate">{indicator.name}</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  frequencyColors[indicator.frequency] ?? "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {frequencyLabels[indicator.frequency] ?? indicator.frequency}
              </span>
              {indicator.valueType && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                  {valueTypeShort[indicator.valueType] ?? indicator.valueType}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <User size={12} />
                {displayName}
              </span>
              {indicator.goal != null && (
                <span className="flex items-center gap-1">
                  <Target size={12} />
                  {indicator.goal}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <span className="flex items-center gap-1 px-2" title="Medições">
              <TrendingUp size={14} />
              {measurements.length}
            </span>
            <span className="flex items-center gap-1 px-2" title="Processos Associados">
              <Link2 size={14} />
              {indicator.processes?.length ?? 0}
            </span>
            <div ref={menuRef} className="relative">
<button
                onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
              >
                <MoreVertical size={16} />
              </button>
           {menuOpen && (
            <div className="absolute right-0 top-8 z-50 w-48 bg-card border border-border rounded-xl shadow-xl py-1">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setYearsOpen(true); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <Calendar size={16} className="text-muted-foreground" />
                Gerir Anos
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setLogOpen(true); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <History size={16} className="text-muted-foreground" />
                Histórico
              </button>
              {!isExternal && (
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setConfirmDeleteOpen(true); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <Trash2 size={16} />
                  Eliminar
                </button>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="text-primary" size={20} />
              {isEditing ? "Editar Indicador" : indicator.name}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? "Altere os dados do indicador." : "Detalhes e gestão do indicador."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-name">Nome *</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Nome do indicador"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-formula">Fórmula/Métrica *</Label>
                  <Input
                    id="edit-formula"
                    value={editForm.formula}
                    onChange={(e) => setEditForm((f) => ({ ...f, formula: e.target.value }))}
                    placeholder="Fórmula ou métrica de cálculo"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label>Frequência</Label>
                    <Select
                      value={editForm.frequency}
                      onValueChange={(v) => setEditForm((f) => ({ ...f, frequency: v as IndicatorFrequency }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(frequencyLabels).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Tipo de Valor</Label>
                    <Select
                      value={editForm.valueType}
                      onValueChange={(v) => setEditForm((f) => ({ ...f, valueType: v as IndicatorValueType }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(valueTypeLabels).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label>Responsável</Label>
                    <Select
                      value={editForm.responsibleId?.toString() ?? "none"}
                      onValueChange={(v) => setEditForm((f) => ({ ...f, responsibleId: v === "none" ? null : Number(v) }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {users?.map((u: UserSummary) => (
                          <SelectItem key={u.id} value={u.id.toString()}>
                            {u.firstName} {u.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-goal">Objetivo</Label>
                    <Input
                      id="edit-goal"
                      type="number"
                      step="0.01"
                      value={editForm.goal}
                      onChange={(e) => setEditForm((f) => ({ ...f, goal: e.target.value }))}
                      placeholder="Valor objetivo"
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-notes">Notas</Label>
                  <textarea
                    id="edit-notes"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none resize-none"
                    value={editForm.notes}
                    onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Notas adicionais..."
                  />
                </div>
                <div className="flex items-center gap-3 justify-end pt-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                  <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "A guardar..." : "Guardar"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-muted/50 border border-border rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground text-lg">{indicator.name}</h3>
                  {!isExternal && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                    className="text-xs font-bold text-primary hover:text-primary/80 uppercase tracking-wider cursor-pointer"
                  >
                    Editar
                  </button>
                )}
                </div>
                <div className="bg-muted p-3 rounded-lg border border-border text-foreground text-sm leading-relaxed font-mono">
                  {indicator.formula}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Frequência</div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        frequencyColors[indicator.frequency] ?? "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {frequencyLabels[indicator.frequency] ?? indicator.frequency}
                    </span>
                  </div>
                  {indicator.valueType && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Tipo de Valor</div>
                      <span className="text-sm font-medium">{valueTypeLabels[indicator.valueType] ?? indicator.valueType}</span>
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Responsável</div>
                    <span className="text-sm font-medium">{displayName}</span>
                  </div>
                  {indicator.goal != null && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Objetivo</div>
                      <span className="text-sm font-medium">{indicator.goal}</span>
                    </div>
                  )}
                </div>
                {indicator.notes && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Notas</div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{indicator.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Process Association */}
            <div>
              <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Link2 size={14} />
                  Processos Associados
                </h4>
                <button
                  onClick={(e) => { e.stopPropagation(); setProcessOpen(true); }}
                  className="flex items-center gap-1 text-sm bg-blue-50 border border-blue-200 hover:border-blue-400 hover:text-blue-700 text-blue-600 px-3 py-1.5 rounded-md shadow-sm transition-all cursor-pointer"
                >
                  <Link2 size={14} />
                  Gerir Processos
                </button>
              </div>
              {indicator.processes && indicator.processes.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                  {indicator.processes.map((proc) => (
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center border-2 border-dashed border-border rounded-lg text-muted-foreground text-sm">
                  Nenhum processo associado.
                </div>
              )}
            </div>

            {/* Measurements */}
            <div>
              <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={14} />
                  Medições
                </h4>
                {indicator.indicatorYearId && !isExternal && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setMeasurementFormOpen(true); }}
                    className="flex items-center gap-1 text-sm bg-emerald-50 border border-emerald-200 hover:border-emerald-400 hover:text-emerald-700 text-emerald-600 px-3 py-1.5 rounded-md shadow-sm transition-all cursor-pointer"
                  >
                    <Plus size={14} />
                    Nova Medição
                  </button>
                )}
              </div>

              {measurementFormOpen && (
                <div className="bg-muted/50 border border-border rounded-xl p-4 mb-3 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="grid gap-1">
                      <Label className="text-xs">Data</Label>
                      <Input
                        type="date"
                        value={mDate}
                        onChange={(e) => setMDate(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs">Valor</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={mValue}
                        onChange={(e) => setMValue(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs">Notas</Label>
                      <Input
                        value={mNotes}
                        onChange={(e) => setMNotes(e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setMeasurementFormOpen(false)}>Cancelar</Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!mDate || !mValue) {
                          toast.error("Preencha a data e o valor.");
                          return;
                        }
                        createMeasurementMutation.mutate({
                          measurementDate: mDate,
                          value: Number(mValue),
                          notes: mNotes || undefined,
                        });
                      }}
                      disabled={createMeasurementMutation.isPending}
                    >
                      {createMeasurementMutation.isPending ? "A guardar..." : "Registar"}
                    </Button>
                  </div>
                </div>
              )}

              {measurements.length > 0 ? (
                <div className="space-y-2">
                  {[...measurements]
                    .sort((a, b) => (a.measurementDate > b.measurementDate ? -1 : 1))
                    .map((m) => (
                      <div key={m.id} className="flex items-center justify-between text-sm bg-card border border-border px-4 py-3 rounded-lg shadow-sm">
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-muted-foreground">{m.measurementDate}</span>
                          <span className="font-bold text-foreground">{m.value}</span>
                          {m.notes && <span className="text-muted-foreground">— {m.notes}</span>}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="py-8 text-center border-2 border-dashed border-border rounded-lg text-muted-foreground text-sm">
                  Ainda sem registos de medições.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {indicator.indicatorYearId && (
        <ProcessAssociationDialog
          open={processOpen}
          onOpenChange={(o) => { if (!o) setProcessOpen(false); }}
          title="Associar Processos"
          description={`Selecione os processos associados ao indicador "${indicator.name}".`}
          allProcesses={processOptions ?? []}
          associatedIds={optimisticProcessIds}
          onAssociate={handleAssociate}
          onDisassociate={handleDisassociate}
        />
      )}

      {indicator.indicatorId && (
        <YearAssociationDialog
          open={yearsOpen}
          onOpenChange={(o) => { if (!o) { setYearsOpen(false); } }}
          title="Gerir Anos"
          description={`Selecione os anos em que o indicador "${indicator.name}" está ativo.`}
          allYears={sortedYearsAll}
          associatedYearIds={associatedYearIds}
          currentYearId={yearId}
          onAssociate={(yId) => associateYearMutation.mutate({ indicatorId: indicator.indicatorId!, yId })}
          onDisassociate={(yId) => disassociateYearMutation.mutate({ indicatorId: indicator.indicatorId!, yId })}
          isPending={associateYearMutation.isPending || disassociateYearMutation.isPending}
          minYears={1}
        />
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Eliminar Indicador"
        description={`Tem a certeza que deseja eliminar o indicador "${indicator.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Eliminar"
        onConfirm={() => deleteMutation.mutate()}
      />

      {indicator.indicatorId && (
        <LogDialog
          open={logOpen}
          onOpenChange={setLogOpen}
          entityType="INDICATOR"
          baseEntityId={indicator.indicatorId}
          title={`Histórico — ${indicator.name}`}
        />
      )}
    </>
  );
};