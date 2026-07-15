import { useState, useEffect } from "react";
import { Plus, Search, History, Gauge } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getIndicatorsByYear,
  createIndicator,
  getUsers,
  getYears,
} from "@/api/core";
import { IndicatorItem } from "./indicator-item";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { LogDialog } from "@/components/log-dialog";
import { YearSelector } from "@/components/year-selector";
import type { EntityType, IndicatorFrequency, IndicatorValueType } from "@/types";

const frequencyLabels: Record<IndicatorFrequency, string> = {
  ANNUAL: "Anual",
  SEMESTER: "Semestral",
  TRIMESTER: "Trimestral",
  MONTHLY: "Mensal",
  WEEKLY: "Semanal",
};

const valueTypeLabels: Record<IndicatorValueType, string> = {
  NUMBER: "Número",
  PERCENTAGE: "Percentagem",
  RATIO: "Rácio",
  TIME: "Tempo",
  CURRENCY: "Moeda",
};

interface CreateForm {
  name: string;
  formula: string;
  frequency: IndicatorFrequency;
  valueType: IndicatorValueType;
  responsibleId: number | null;
  notes: string;
  goal: string;
}

const emptyForm: CreateForm = {
  name: "",
  formula: "",
  frequency: "ANNUAL",
  valueType: "NUMBER",
  responsibleId: null,
  notes: "",
  goal: "",
};

export default function IndicatorsPage() {
  const queryClient = useQueryClient();
  const { isExternal } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [yearId, setYearId] = useState<number | null>(null);
  const [pageLogOpen, setPageLogOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateForm>(emptyForm);

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const selectedYearId = yearId;

  const { data: allYears } = useQuery({
    queryKey: ["years"],
    queryFn: getYears,
  });

  useEffect(() => {
    if (!selectedYearId && allYears && allYears.length > 0) {
      const currentYear = new Date().getFullYear();
      const match = allYears.find((y) => y.year === currentYear) ?? allYears[0];
      setYearId(match.id);
    }
  }, [allYears, selectedYearId]);

  const { data, isLoading } = useQuery({
    queryKey: ["indicators", selectedYearId],
    queryFn: () => getIndicatorsByYear(selectedYearId!),
    enabled: !!selectedYearId,
  });

  const createMutation = useMutation({
    mutationFn: createIndicator,
    onSuccess: () => {
      toast.success("Indicador criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["indicators", selectedYearId] });
      setCreateOpen(false);
      setForm(emptyForm);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao criar indicador");
    },
  });

  const filteredIndicators = data?.filter((indicator) =>
    indicator.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full mt-8 mb-40">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 shadow-sm">
            <Gauge size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Indicadores de Desempenho</h1>
            <p className="text-muted-foreground text-sm mt-1">Gerir indicadores de desempenho e medições.</p>
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
          <YearSelector selectedYearId={yearId} onYearChange={setYearId} />
          {!isExternal && (
            <Button
              onClick={() => {
                setForm(emptyForm);
                setCreateOpen(true);
              }}
              disabled={!selectedYearId}
            >
              <Plus className="size-4" />
              Criar Indicador
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Pesquisar indicadores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* No year selected */}
      {!selectedYearId && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Gauge className="mb-4 text-muted-foreground/40" size={48} />
          <p className="text-lg font-medium">Selecione um ano para visualizar os indicadores</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl bg-black/10 dark:bg-white/10" />
          <Skeleton className="h-24 w-full rounded-xl bg-black/10 dark:bg-white/10" />
          <Skeleton className="h-24 w-full rounded-xl bg-black/10 dark:bg-white/10" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredIndicators && filteredIndicators.length === 0 && (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gauge className="text-slate-400" size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Nenhum indicador encontrado</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2">
            {searchQuery
              ? "Tente ajustar os filtros de pesquisa."
              : "Clique em \"Criar Indicador\" para começar."}
          </p>
        </div>
      )}

      {/* Indicator list */}
      {!isLoading &&
        filteredIndicators &&
        filteredIndicators.map((indicator) => (
          <IndicatorItem key={indicator.id} indicator={indicator} yearId={selectedYearId!} />
        ))}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo Indicador</DialogTitle>
            <DialogDescription>Crie um novo indicador de desempenho.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-1.5">
              <Label htmlFor="indicator-name">Nome *</Label>
              <Input
                id="indicator-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome do indicador"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="indicator-formula">Fórmula/Métrica *</Label>
              <Input
                id="indicator-formula"
                value={form.formula}
                onChange={(e) => setForm((f) => ({ ...f, formula: e.target.value }))}
                placeholder="Fórmula ou métrica de cálculo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="indicator-frequency">Frequência</Label>
                <Select
                  value={form.frequency}
                  onValueChange={(v) => setForm((f) => ({ ...f, frequency: v as IndicatorFrequency }))}
                >
                  <SelectTrigger id="indicator-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(frequencyLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="indicator-valueType">Tipo de Valor</Label>
                <Select
                  value={form.valueType}
                  onValueChange={(v) => setForm((f) => ({ ...f, valueType: v as IndicatorValueType }))}
                >
                  <SelectTrigger id="indicator-valueType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(valueTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="indicator-responsible">Responsável</Label>
                <Select
                  value={form.responsibleId?.toString() ?? "none"}
                  onValueChange={(v) => setForm((f) => ({ ...f, responsibleId: v === "none" ? null : Number(v) }))}
                >
                  <SelectTrigger id="indicator-responsible">
                    <SelectValue placeholder="Selecionar responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {users?.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.firstName} {u.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="indicator-goal">Objetivo</Label>
                <Input
                  id="indicator-goal"
                  type="number"
                  step="0.01"
                  value={form.goal}
                  onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
                  placeholder="Valor objetivo"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="indicator-notes">Notas</Label>
              <textarea
                id="indicator-notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none resize-none"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Notas adicionais..."
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={() =>
                createMutation.mutate({
                  name: form.name,
                  formula: form.formula,
                  frequency: form.frequency,
                  valueType: form.valueType,
                  responsibleId: form.responsibleId,
                  notes: form.notes || null,
                  yearId: selectedYearId!,
                  goal: form.goal ? Number(form.goal) : null,
                })
              }
              disabled={createMutation.isPending || !form.name.trim() || !form.formula.trim()}
            >
              {createMutation.isPending ? "A criar..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LogDialog
        entityTypes={["INDICATOR"] as EntityType[]}
        yearId={selectedYearId ?? undefined}
        open={pageLogOpen}
        onOpenChange={setPageLogOpen}
      />
    </div>
  );
}