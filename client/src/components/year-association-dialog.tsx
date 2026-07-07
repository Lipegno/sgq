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
import { CalendarDays, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { YearResponse } from "@/types";

interface YearAssociationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  allYears: YearResponse[];
  associatedYearIds: Set<number>;
  currentYearId: number | null;
  onAssociate: (yearId: number) => void;
  onAssociateFull?: (yearId: number) => void;
  onDisassociate: (yearId: number) => void;
  isPending: boolean;
  minYears?: number;
  overlayClassName?: string;
  contentClassName?: string;
}

export default function YearAssociationDialog({
  open,
  onOpenChange,
  title,
  description,
  allYears,
  associatedYearIds,
  currentYearId,
  onAssociate,
  onAssociateFull,
  onDisassociate,
  isPending,
  minYears = 1,
  overlayClassName,
  contentClassName,
}: YearAssociationDialogProps) {
  const [pendingYear, setPendingYear] = useState<number | null>(null);

  const sortedYears = [...allYears].sort((a, b) => b.year - a.year);
  const associated = sortedYears.filter((y) => associatedYearIds.has(y.id));
  const other = sortedYears.filter((y) => !associatedYearIds.has(y.id));

  const hasFullOption = onAssociateFull !== undefined;

  function handleDisassociate(yearId: number) {
    if (associated.length <= minYears) {
      return;
    }
    onDisassociate(yearId);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setPendingYear(null); onOpenChange(o); }}>
      <DialogContent className={cn("sm:max-w-md", contentClassName)} overlayClassName={overlayClassName}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="text-primary" size={20} />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {pendingYear !== null && hasFullOption ? (
          <div className="py-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground">
              Associar ano {allYears.find((y) => y.id === pendingYear)?.year}
            </h3>
            <p className="text-xs text-muted-foreground">
              Como deseja associar este ano?
            </p>
            <button
              onClick={() => { onAssociate(pendingYear); setPendingYear(null); }}
              disabled={isPending}
              className="w-full text-left p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-muted transition-all group cursor-pointer"
            >
              <div className="font-bold text-foreground group-hover:text-primary text-sm">Apenas associar</div>
              <div className="text-xs text-muted-foreground">O item será associado ao novo ano sem copiar dados.</div>
            </button>
            <button
              onClick={() => { onAssociateFull!(pendingYear); setPendingYear(null); }}
              disabled={isPending}
              className="w-full text-left p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-muted transition-all group cursor-pointer"
            >
              <div className="font-bold text-foreground group-hover:text-primary text-sm">Copiar dados do ano atual</div>
              <div className="text-xs text-muted-foreground">Inclui processos e outros dados atualmente associados.</div>
            </button>
            <button
              onClick={() => setPendingYear(null)}
              className="w-full py-2 text-sm text-muted-foreground hover:text-foreground font-medium cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <>
            <div className="py-4 space-y-4 max-h-[400px] overflow-y-auto">
              {associated.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Anos Associados
                  </h4>
                  <div className="space-y-2">
                    {associated.map((y) => {
                      const canRemove = associated.length > minYears;
                      return (
                        <div
                          key={y.id}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-lg border bg-primary/5 border-primary/20 text-primary"
                        >
                          <span className="font-bold text-sm">{y.year}</span>
                          <div className="flex items-center gap-2">
                            {y.id === currentYearId && (
                              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                                atual
                              </span>
                            )}
                            {canRemove ? (
                              <button
                                onClick={() => handleDisassociate(y.id)}
                                disabled={isPending}
                                className="p-1 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-50"
                                title="Remover ano"
                              >
                                <X size={14} />
                              </button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">obrigatório</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {other.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Outros Anos
                  </h4>
                  <div className="space-y-2">
                    {other.map((y) => (
                      <button
                        key={y.id}
                        onClick={() => {
                          if (hasFullOption) {
                            setPendingYear(y.id);
                          } else {
                            onAssociate(y.id);
                          }
                        }}
                        disabled={isPending}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg border bg-card border-border text-muted-foreground hover:border-foreground/30 hover:bg-muted transition-all cursor-pointer disabled:opacity-50"
                      >
                        <span className="font-bold text-sm">{y.year}</span>
                        <Plus size={16} className="text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {other.length === 0 && associated.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Nenhum ano disponível.
                </p>
              )}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Fechar</Button>
              </DialogClose>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
