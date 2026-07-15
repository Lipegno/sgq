import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DialogDescription } from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { useDeleteProcess } from "@/hooks/use-delete-process";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processYearId: number;
}

export const DeleteProcessDialog = ({ open, onOpenChange, processYearId }: Props) => {
  const deleteProcessMutation = useDeleteProcess();

  const handleDelete = () => {
    deleteProcessMutation.mutate(processYearId, {
      onSuccess: () => {
        onOpenChange(false);
      },
      onError: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Apagar Processo</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja apagar este processo? Esta ação não pode ser desfeita.
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
}