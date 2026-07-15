import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Plus, Trash2 } from "lucide-react";
import { DeleteMacroProcessDialog } from "./delete-macro-process-dialog";
import { CreateProcessDialog } from "./create-process-dialog";
import { useAuth } from "@/context/auth-context";

interface MacroProcessDropdownProps {
  macroProcessId: number;
  macroProcessYearId: number;
  yearId: number | null;
}

export const MacroProcessDropdown = ({ macroProcessId, macroProcessYearId, yearId }: MacroProcessDropdownProps) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { isExternal } = useAuth();

  if (isExternal) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">
            <MoreVertical size={20} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setCreateOpen(true);
              }}
            >
              <Plus size={16} />
              Criar Processo
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setDeleteOpen(true);
              }}
            >
              <Trash2 size={16} className="text-destructive" />
              <span className="text-destructive">Apagar Macro Processo</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteMacroProcessDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        macroProcessId={macroProcessId}
      />
      <CreateProcessDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        macroProcessYearId={macroProcessYearId}
        yearId={yearId}
      />
    </>
  );
};