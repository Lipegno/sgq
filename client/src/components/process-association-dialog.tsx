import { useState } from "react";
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
import type { ProcessOptionResponse } from "@/types";

function getSearchableText(proc: ProcessOptionResponse): string {
  return [proc.processName, proc.macroProcessName ?? ""].join(" ").toLowerCase();
}

interface ProcessAssociationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  allProcesses: ProcessOptionResponse[];
  associatedIds: Set<number>;
  onAssociate: (processYearId: number) => void;
  onDisassociate: (processYearId: number) => void;
  isPending?: boolean;
}

export default function ProcessAssociationDialog({
  open,
  onOpenChange,
  title = "Associar Processos",
  description = "Associe ou desassocie processos.",
  allProcesses,
  associatedIds,
  onAssociate,
  onDisassociate,
  isPending = false,
}: ProcessAssociationDialogProps) {
  const [search, setSearch] = useState("");

  const sorted = [...allProcesses].sort((a, b) => a.processName.localeCompare(b.processName));
  const filtered = search.trim()
    ? sorted.filter((p) => getSearchableText(p).includes(search.toLowerCase()))
    : sorted;

  const associated = filtered.filter((p) => associatedIds.has(p.processYearId));
  const other = filtered.filter((p) => !associatedIds.has(p.processYearId));

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setSearch(""); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="text-primary" size={20} />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-3 border-b bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
            <Input
              placeholder="Pesquisar processos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filtered.length === 0 && search.trim() && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Nenhum processo encontrado para "{search}".
            </div>
          )}

          {associated.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Processos Associados
              </h4>
              <div className="space-y-1.5">
                {associated.map((proc) => (
                  <div
                    key={proc.processYearId}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg border bg-primary/5 border-primary/20"
                  >
                    <div>
                      <div className="font-medium text-sm text-foreground">{proc.processName}</div>
                      {proc.macroProcessName && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border border-border px-1 rounded bg-muted mt-0.5 inline-block">
                          {proc.macroProcessName}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onDisassociate(proc.processYearId)}
                      disabled={isPending}
                      className="p-1 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-50"
                      title="Remover processo"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {other.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Outros Processos
              </h4>
              <div className="space-y-1.5">
                {other.map((proc) => (
                  <button
                    key={proc.processYearId}
                    onClick={() => onAssociate(proc.processYearId)}
                    disabled={isPending}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg border bg-card border-border text-muted-foreground hover:border-foreground/30 hover:bg-muted transition-all cursor-pointer disabled:opacity-50"
                  >
                    <div className="text-left">
                      <div className="font-medium text-sm text-foreground">{proc.processName}</div>
                      {proc.macroProcessName && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border border-border px-1 rounded bg-muted mt-0.5 inline-block">
                          {proc.macroProcessName}
                        </span>
                      )}
                    </div>
                    <Plus size={16} className="text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {!search.trim() && associated.length === 0 && other.length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Nenhum processo disponível.
            </div>
          )}

          {!search.trim() && associated.length === 0 && other.length > 0 && (
            <div className="py-4 text-center text-muted-foreground text-xs border-2 border-dashed border-border rounded-lg">
              Nenhum processo associado.
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
