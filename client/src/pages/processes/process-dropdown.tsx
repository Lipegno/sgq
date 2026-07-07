import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowRightLeft, CalendarDays, History, MoreVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getYears, associateProcessYears, associateProcessYearsFull } from "@/api/core";
import { toast } from "sonner";
import { DeleteProcessDialog } from "./delete-process-dialog";
import { MoveProcessDialog } from "./move-process-dialog";
import { LogDialog } from "@/components/log-dialog";
import YearAssociationDialog from "@/components/year-association-dialog";
import { useAuth } from "@/context/auth-context";

export const ProcessDropdown = ({
  processId,
  processYearId,
  macroProcessId,
  yearId,
  processName,
  associatedYearIds,
}: {
  processId: number;
  processYearId: number;
  macroProcessId: number;
  yearId: number;
  processName: string;
  associatedYearIds: Set<number>;
}) => {
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [yearAssociateOpen, setYearAssociateOpen] = useState(false);
  const { isExternal } = useAuth();
  const { data: years } = useQuery({ queryKey: ["years"], queryFn: getYears });

  if (isExternal) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={"ghost"}>
            <MoreVertical size={20} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={e => {
                e.preventDefault();
                setMoveOpen(true);
              }}
            >
              <ArrowRightLeft size={16} />
              Mover Processo
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={e => {
                e.preventDefault();
                setYearAssociateOpen(true);
              }}
            >
              <CalendarDays size={16} />
              Gerir Anos
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={e => {
                e.preventDefault();
                setLogOpen(true);
              }}
            >
              <History size={16} />
              Histórico
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={e => {
                e.preventDefault();
                setDeleteOpen(true);
              }}
              variant="destructive"
            >
              <Trash2 size={16} />
              Apagar Processo
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteProcessDialog open={deleteOpen} onOpenChange={setDeleteOpen} processYearId={processYearId} />
      <MoveProcessDialog
        open={moveOpen}
        onOpenChange={setMoveOpen}
        processYearId={processYearId}
        currentMacroProcessYearId={macroProcessId === 0 ? null : macroProcessId}
        yearId={yearId}
      />
      <YearAssociationDialog
        open={yearAssociateOpen}
        onOpenChange={setYearAssociateOpen}
        title="Gerir Anos do Processo"
        description="Associe ou desassocie anos a este processo."
        allYears={years ?? []}
        associatedYearIds={associatedYearIds}
        currentYearId={yearId}
        onAssociate={(yid) => {
          associateProcessYears(processId, [yid], []).then(() => {
            queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
            toast.success("Ano associado com sucesso!");
          }).catch(() => toast.error("Erro ao associar ano"));
        }}
        onAssociateFull={(yid) => {
          associateProcessYearsFull(processId, [yid]).then(() => {
            queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
            toast.success("Ano associado com dados copiados!");
          }).catch(() => toast.error("Erro ao associar ano"));
        }}
        onDisassociate={(yid) => {
          associateProcessYears(processId, [], [yid]).then(() => {
            queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
            toast.success("Ano desassociado com sucesso!");
          }).catch(() => toast.error("Erro ao desassociar ano"));
        }}
        isPending={false}
      />
      <LogDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        entityType="PROCESS"
        baseEntityId={processId}
        title={`Histórico — ${processName}`}
      />
    </>
  );
};
