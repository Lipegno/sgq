import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DialogDescription } from "@radix-ui/react-dialog";
import { useDeleteMacroProcess } from "@/hooks/use-delete-macro-process";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  macroProcessId: number;
}

export const DeleteMacroProcessDialog = ({ open, onOpenChange, macroProcessId }: Props) => {
  const deleteMacroProcessMutation = useDeleteMacroProcess();

  const handleDelete = () => {
    deleteMacroProcessMutation.mutate(macroProcessId, {
      onSuccess: () => {
        onOpenChange(false);
      },
      onError: (error: any) => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Apagar Macroprocesso</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja apagar este macroprocesso? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>

          <Button onClick={handleDelete} variant="destructive">
            Apagar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
