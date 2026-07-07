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
import { Search, Plus, X, Shield } from "lucide-react";
import { getQualityObjectivesByYear, associateQualityObjectiveProcesses, disassociateQualityObjectiveProcesses } from "@/api/core";
import { toast } from "sonner";
import type { QualityObjectiveResponse } from "@/types";

interface AssociateQualityObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processYearId: number;
  yearId: number | null;
  alreadyAssociatedIds: number[];
}

export function AssociateQualityObjectiveDialog({
  open,
  onOpenChange,
  processYearId,
  yearId,
  alreadyAssociatedIds,
}: AssociateQualityObjectiveDialogProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["quality-objectives", yearId],
    queryFn: () => getQualityObjectivesByYear(yearId!),
    enabled: !!yearId && open,
  });

  const allObjectives = data ?? [];
  const [optimisticAssociated, setOptimisticAssociated] = useState<Set<number>>(new Set(alreadyAssociatedIds));

  const statusLabels: Record<string, string> = {
    ACHIEVED: "Alcançado",
    IN_PROGRESS: "Em Progresso",
  };

  const statusColors: Record<string, string> = {
    ACHIEVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    IN_PROGRESS: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  };

  const associateMutation = useMutation({
    mutationFn: (qualityObjectiveYearId: number) =>
      associateQualityObjectiveProcesses(qualityObjectiveYearId, [processYearId]),
    onSuccess: () => {
      toast.success("Objetivo da qualidade associado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
      queryClient.invalidateQueries({ queryKey: ["quality-objectives"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao associar objetivo da qualidade");
    },
  });

  const disassociateMutation = useMutation({
    mutationFn: (qualityObjectiveYearId: number) =>
      disassociateQualityObjectiveProcesses(qualityObjectiveYearId, [processYearId]),
    onSuccess: () => {
      toast.success("Objetivo da qualidade desassociado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
      queryClient.invalidateQueries({ queryKey: ["quality-objectives"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao desassociar objetivo da qualidade");
    },
  });

  const handleAssociate = (qo: QualityObjectiveResponse) => {
    setOptimisticAssociated((prev) => new Set(prev).add(qo.qualityObjectiveYearId));
    associateMutation.mutate(qo.qualityObjectiveYearId);
  };

  const handleDisassociate = (qo: QualityObjectiveResponse) => {
    setOptimisticAssociated((prev) => {
      const next = new Set(prev);
      next.delete(qo.qualityObjectiveYearId);
      return next;
    });
    disassociateMutation.mutate(qo.qualityObjectiveYearId);
  };

  const mergedAssociated = allObjectives.filter(
    (qo: QualityObjectiveResponse) =>
      optimisticAssociated.has(qo.qualityObjectiveYearId) &&
      qo.objectiveTitle.toLowerCase().includes(search.toLowerCase())
  );
  const mergedAvailable = allObjectives.filter(
    (qo: QualityObjectiveResponse) =>
      !optimisticAssociated.has(qo.qualityObjectiveYearId) &&
      qo.objectiveTitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setSearch(""); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="text-green-600" size={20} />
            Associar Objetivos da Qualidade
          </DialogTitle>
          <DialogDescription>Associe ou desassocie objetivos da qualidade a este processo.</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-3 border-b bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
            <Input
              placeholder="Pesquisar objetivos da qualidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading && (
            <div className="py-8 text-center text-muted-foreground text-sm">A carregar objetivos da qualidade...</div>
          )}

          {!isLoading && mergedAssociated.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Objetivos Associados
              </h4>
              <div className="space-y-1.5">
                {mergedAssociated.map((qo: QualityObjectiveResponse) => (
                  <div
                    key={qo.qualityObjectiveYearId}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg border bg-green-50 border-green-200"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="font-medium text-sm text-foreground">{qo.objectiveTitle}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColors[qo.status]}`}>
                        {statusLabels[qo.status] ?? qo.status}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDisassociate(qo)}
                      disabled={disassociateMutation.isPending}
                      className="p-1 rounded-lg text-green-600 hover:bg-green-100 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                      title="Remover objetivo da qualidade"
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
                Outros Objetivos
              </h4>
              <div className="space-y-1.5">
                {mergedAvailable.map((qo: QualityObjectiveResponse) => (
                  <button
                    key={qo.qualityObjectiveYearId}
                    onClick={() => handleAssociate(qo)}
                    disabled={associateMutation.isPending}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg border bg-card border-border text-muted-foreground hover:border-foreground/30 hover:bg-muted transition-all cursor-pointer disabled:opacity-50"
                  >
                    <div className="text-left flex items-center gap-2 min-w-0">
                      <div className="font-medium text-sm text-foreground">{qo.objectiveTitle}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColors[qo.status]}`}>
                        {statusLabels[qo.status] ?? qo.status}
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
                ? `Nenhum objetivo da qualidade encontrado para "${search}".`
                : "Nenhum objetivo da qualidade disponível para associação."}
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
