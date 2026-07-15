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
import { Search, Plus, X, UsersRound } from "lucide-react";
import { getInterestedPartiesByYear, associateInterestedPartyProcesses, disassociateInterestedPartyProcesses } from "@/api/core";
import { toast } from "sonner";
import type { InterestedPartyResponse } from "@/types";

interface AssociateInterestedPartyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processYearId: number;
  yearId: number | null;
  alreadyAssociatedIds: number[];
}

export function AssociateInterestedPartyDialog({
  open,
  onOpenChange,
  processYearId,
  yearId,
  alreadyAssociatedIds,
}: AssociateInterestedPartyDialogProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["interested-parties", yearId],
    queryFn: () => getInterestedPartiesByYear(yearId!),
    enabled: !!yearId && open,
  });

  const allParties = data ?? [];
  const [optimisticAssociated, setOptimisticAssociated] = useState<Set<number>>(new Set(alreadyAssociatedIds));

  const typeLabels: Record<string, string> = {
    INTERNAL: "Interna",
    EXTERNAL: "Externa",
  };

  const associateMutation = useMutation({
    mutationFn: (interestedPartyYearId: number) =>
      associateInterestedPartyProcesses(interestedPartyYearId, [processYearId]),
    onSuccess: () => {
      toast.success("Parte interessada associada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
      queryClient.invalidateQueries({ queryKey: ["interested-parties"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao associar parte interessada");
    },
  });

  const disassociateMutation = useMutation({
    mutationFn: (interestedPartyYearId: number) =>
      disassociateInterestedPartyProcesses(interestedPartyYearId, [processYearId]),
    onSuccess: () => {
      toast.success("Parte interessada desassociada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
      queryClient.invalidateQueries({ queryKey: ["interested-parties"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao desassociar parte interessada");
    },
  });

  const handleAssociate = (interestedPartyYearId: number) => {
    setOptimisticAssociated((prev) => new Set(prev).add(interestedPartyYearId));
    associateMutation.mutate(interestedPartyYearId);
  };

  const handleDisassociate = (interestedPartyYearId: number) => {
    setOptimisticAssociated((prev) => {
      const next = new Set(prev);
      next.delete(interestedPartyYearId);
      return next;
    });
    disassociateMutation.mutate(interestedPartyYearId);
  };

  const mergedAssociated = allParties.filter(
    (ip: InterestedPartyResponse) =>
      optimisticAssociated.has(ip.interestedPartyYearId) &&
      ip.name.toLowerCase().includes(search.toLowerCase())
  );
  const mergedAvailable = allParties.filter(
    (ip: InterestedPartyResponse) =>
      !optimisticAssociated.has(ip.interestedPartyYearId) &&
      ip.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setSearch(""); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UsersRound className="text-purple-600" size={20} />
            Associar Partes Interessadas
          </DialogTitle>
          <DialogDescription>Associe ou desassocie partes interessadas a este processo.</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-3 border-b bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
            <Input
              placeholder="Pesquisar partes interessadas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading && (
            <div className="py-8 text-center text-muted-foreground text-sm">A carregar partes interessadas...</div>
          )}

          {!isLoading && mergedAssociated.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Partes Interessadas Associadas
              </h4>
              <div className="space-y-1.5">
                {mergedAssociated.map((ip: InterestedPartyResponse) => (
                  <div
                    key={ip.interestedPartyYearId}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg border bg-purple-50 border-purple-200"
                  >
                    <div>
                      <div className="font-medium text-sm text-foreground">{ip.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {typeLabels[ip.type] ?? ip.type}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDisassociate(ip.interestedPartyYearId)}
                      disabled={disassociateMutation.isPending}
                      className="p-1 rounded-lg text-purple-600 hover:bg-purple-100 transition-colors cursor-pointer disabled:opacity-50"
                      title="Remover parte interessada"
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
                Outras Partes Interessadas
              </h4>
              <div className="space-y-1.5">
                {mergedAvailable.map((ip: InterestedPartyResponse) => (
                  <button
                    key={ip.interestedPartyYearId}
                    onClick={() => handleAssociate(ip.interestedPartyYearId)}
                    disabled={associateMutation.isPending}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg border bg-card border-border text-muted-foreground hover:border-foreground/30 hover:bg-muted transition-all cursor-pointer disabled:opacity-50"
                  >
                    <div className="text-left">
                      <div className="font-medium text-sm text-foreground">{ip.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {typeLabels[ip.type] ?? ip.type}
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
              {search.trim()
                ? `Nenhuma parte interessada encontrada para "${search}".`
                : "Nenhuma parte interessada disponível para associação."}
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
