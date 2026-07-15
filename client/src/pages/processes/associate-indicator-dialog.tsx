import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, X, Link } from "lucide-react";
import { getIndicatorsSimple, associateIndicatorsToProcess, disassociateIndicatorsFromProcess } from "@/api/core";
import { toast } from "sonner";

interface AssociateIndicatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processYearId: number;
  yearId: number | null;
  alreadyAssociatedIds: number[];
}

export function AssociateIndicatorDialog({
  open,
  onOpenChange,
  processYearId,
  yearId,
  alreadyAssociatedIds,
}: AssociateIndicatorDialogProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["indicators", "simple", yearId],
    queryFn: () => getIndicatorsSimple(yearId!),
    enabled: !!yearId && open,
  });

  const allIndicators = data ?? [];
  const associatedIds = new Set(alreadyAssociatedIds);

  const available = allIndicators.filter(
    (ind) => !associatedIds.has(ind.indicatorYearId!) && ind.name.toLowerCase().includes(search.toLowerCase())
  );
  const current = allIndicators.filter(
    (ind) => associatedIds.has(ind.indicatorYearId!) && ind.name.toLowerCase().includes(search.toLowerCase())
  );

  const [optimisticAssociated, setOptimisticAssociated] = useState<Set<number>>(associatedIds);

  const associateMutation = useMutation({
    mutationFn: (indicatorYearId: number) =>
      associateIndicatorsToProcess(processYearId, [indicatorYearId]),
    onSuccess: () => {
      toast.success("Indicador associado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
      queryClient.invalidateQueries({ queryKey: ["indicators"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao associar indicador");
    },
  });

  const disassociateMutation = useMutation({
    mutationFn: (indicatorYearId: number) =>
      disassociateIndicatorsFromProcess(processYearId, [indicatorYearId]),
    onSuccess: () => {
      toast.success("Indicador desassociado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
      queryClient.invalidateQueries({ queryKey: ["indicators"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao desassociar indicador");
    },
  });

  const handleAssociate = (indicatorYearId: number) => {
    setOptimisticAssociated((prev) => new Set(prev).add(indicatorYearId));
    associateMutation.mutate(indicatorYearId);
  };

  const handleDisassociate = (indicatorYearId: number) => {
    setOptimisticAssociated((prev) => {
      const next = new Set(prev);
      next.delete(indicatorYearId);
      return next;
    });
    disassociateMutation.mutate(indicatorYearId);
  };

  const mergedAssociated = allIndicators.filter(
    (ind) => optimisticAssociated.has(ind.indicatorYearId!) && ind.name.toLowerCase().includes(search.toLowerCase())
  );
  const mergedAvailable = allIndicators.filter(
    (ind) => !optimisticAssociated.has(ind.indicatorYearId!) && ind.name.toLowerCase().includes(search.toLowerCase())
  );

  const frequencyLabels: Record<string, string> = {
    ANNUAL: "Anual",
    SEMESTER: "Semestral",
    TRIMESTER: "Trimestral",
    MONTHLY: "Mensal",
    WEEKLY: "Semanal",
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setSearch(""); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="text-primary" size={20} />
            Associar Indicadores
          </DialogTitle>
          <DialogDescription>Associe ou desassocie indicadores a este processo.</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-3 border-b bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
            <Input
              placeholder="Pesquisar indicadores..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading && (
            <div className="py-8 text-center text-muted-foreground text-sm">A carregar indicadores...</div>
          )}

          {!isLoading && mergedAssociated.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Indicadores Associados
              </h4>
              <div className="space-y-1.5">
                {mergedAssociated.map((ind) => (
                  <div
                    key={ind.indicatorYearId}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg border bg-primary/5 border-primary/20"
                  >
                    <div>
                      <div className="font-medium text-sm text-foreground">{ind.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {ind.formula}
                        {ind.frequency && <span className="ml-2">{frequencyLabels[ind.frequency] ?? ind.frequency}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDisassociate(ind.indicatorYearId!)}
                      disabled={disassociateMutation.isPending}
                      className="p-1 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-50"
                      title="Remover indicador"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoading && mergedAvailable.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Outros Indicadores
              </h4>
              <div className="space-y-1.5">
                {mergedAvailable.map((ind) => (
                  <button
                    key={ind.indicatorYearId}
                    onClick={() => handleAssociate(ind.indicatorYearId!)}
                    disabled={associateMutation.isPending}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg border bg-card border-border text-muted-foreground hover:border-foreground/30 hover:bg-muted transition-all cursor-pointer disabled:opacity-50"
                  >
                    <div className="text-left">
                      <div className="font-medium text-sm text-foreground">{ind.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {ind.formula}
                        {ind.frequency && <span className="ml-2">{frequencyLabels[ind.frequency] ?? ind.frequency}</span>}
                      </div>
                    </div>
                    <Plus size={16} className="text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isLoading && mergedAssociated.length === 0 && mergedAvailable.length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              {search.trim() ? `Nenhum indicador encontrado para "${search}".` : "Nenhum indicador disponível para associação."}
            </div>
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