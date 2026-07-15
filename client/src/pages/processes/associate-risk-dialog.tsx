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
import { Search, Plus, X, AlertTriangle } from "lucide-react";
import { getRiskOpportunitiesByYear, associateRiskProcesses, disassociateRiskProcesses } from "@/api/core";
import { toast } from "sonner";
import type { RiskOpportunityResponse } from "@/types";

interface AssociateRiskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processYearId: number;
  yearId: number | null;
  alreadyAssociatedIds: number[];
}

export function AssociateRiskDialog({
  open,
  onOpenChange,
  processYearId,
  yearId,
  alreadyAssociatedIds,
}: AssociateRiskDialogProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["risk-opportunities", yearId],
    queryFn: () => getRiskOpportunitiesByYear(yearId!),
    enabled: !!yearId && open,
  });

  const allItems = [
    ...(data?.risks ?? []),
    ...(data?.opportunities ?? []),
  ];
  const [optimisticAssociated, setOptimisticAssociated] = useState<Set<number>>(new Set(alreadyAssociatedIds));

  const typeLabels: Record<string, string> = {
    RISK: "Risco",
    OPPORTUNITY: "Oportunidade",
  };

  const typeColors: Record<string, string> = {
    RISK: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    OPPORTUNITY: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  };

  const associateMutation = useMutation({
    mutationFn: (riskOpportunityYearId: number) =>
      associateRiskProcesses(riskOpportunityYearId, [processYearId]),
    onSuccess: () => {
      toast.success("Risco/Oportunidade associado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
      queryClient.invalidateQueries({ queryKey: ["risk-opportunities"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao associar risco/oportunidade");
    },
  });

  const disassociateMutation = useMutation({
    mutationFn: (riskOpportunityYearId: number) =>
      disassociateRiskProcesses(riskOpportunityYearId, [processYearId]),
    onSuccess: () => {
      toast.success("Risco/Oportunidade desassociado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
      queryClient.invalidateQueries({ queryKey: ["risk-opportunities"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao desassociar risco/oportunidade");
    },
  });

  const handleAssociate = (riskOpportunityYearId: number) => {
    setOptimisticAssociated((prev) => new Set(prev).add(riskOpportunityYearId));
    associateMutation.mutate(riskOpportunityYearId);
  };

  const handleDisassociate = (riskOpportunityYearId: number) => {
    setOptimisticAssociated((prev) => {
      const next = new Set(prev);
      next.delete(riskOpportunityYearId);
      return next;
    });
    disassociateMutation.mutate(riskOpportunityYearId);
  };

  const mergedAssociated = allItems.filter(
    (item: RiskOpportunityResponse) =>
      optimisticAssociated.has(item.riskOpportunityYearId) &&
      item.description.toLowerCase().includes(search.toLowerCase())
  );
  const mergedAvailable = allItems.filter(
    (item: RiskOpportunityResponse) =>
      !optimisticAssociated.has(item.riskOpportunityYearId) &&
      item.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setSearch(""); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="text-red-600" size={20} />
            Associar Riscos & Oportunidades
          </DialogTitle>
          <DialogDescription>Associe ou desassocie riscos e oportunidades a este processo.</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-3 border-b bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
            <Input
              placeholder="Pesquisar riscos e oportunidades..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading && (
            <div className="py-8 text-center text-muted-foreground text-sm">A carregar riscos e oportunidades...</div>
          )}

          {!isLoading && mergedAssociated.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Riscos & Oportunidades Associados
              </h4>
              <div className="space-y-1.5">
                {mergedAssociated.map((item: RiskOpportunityResponse) => (
                  <div
                    key={item.riskOpportunityYearId}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg border bg-red-50 border-red-200"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">{item.code} — {item.description}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${typeColors[item.type]}`}>
                        {typeLabels[item.type] ?? item.type}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDisassociate(item.riskOpportunityYearId)}
                      disabled={disassociateMutation.isPending}
                      className="p-1 rounded-lg text-red-600 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                      title="Remover risco/oportunidade"
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
                Outros Riscos & Oportunidades
              </h4>
              <div className="space-y-1.5">
                {mergedAvailable.map((item: RiskOpportunityResponse) => (
                  <button
                    key={item.riskOpportunityYearId}
                    onClick={() => handleAssociate(item.riskOpportunityYearId)}
                    disabled={associateMutation.isPending}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg border bg-card border-border text-muted-foreground hover:border-foreground/30 hover:bg-muted transition-all cursor-pointer disabled:opacity-50"
                  >
                    <div className="text-left flex items-center gap-2 min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">{item.code} — {item.description}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${typeColors[item.type]}`}>
                        {typeLabels[item.type] ?? item.type}
                      </span>
                    </div>
                    <Plus size={16} className="text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isLoading && mergedAssociated.length === 0 && mergedAvailable.length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              {search.trim()
                ? `Nenhum risco/oportunidade encontrado para "${search}".`
                : "Nenhum risco ou oportunidade disponível para associação."}
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
