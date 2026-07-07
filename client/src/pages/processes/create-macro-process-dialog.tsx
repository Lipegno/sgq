import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateMacroProcess } from "@/hooks/use-create-macro-process";
import { DialogDescription } from "@radix-ui/react-dialog";
import { Plus } from "lucide-react";
import { useState } from "react";

interface CreateMacroProcessDialogProps {
  yearId: number | null;
  isExternal?: boolean;
}

export const CreateMacroProcessDialog = ({ yearId, isExternal }: CreateMacroProcessDialogProps) => {
  const [open, setOpen] = useState(false);

  const createMacroProcessMutation = useCreateMacroProcess();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const name = formData.get("nome") as string;

    if (!name?.trim() || !yearId) return;

    createMacroProcessMutation.mutate(
      { name: name.trim(), yearId },
      {
        onSuccess: () => {
          setOpen(false);
          e.currentTarget.reset();
        },
        onError: (error) => {
          setOpen(false);
          e.currentTarget.reset();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isExternal && (
      <DialogTrigger asChild>
        <Button disabled={!yearId}>
          <Plus /> Criar Macro Processo
        </Button>
      </DialogTrigger>
    )}
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar Macro Processo</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <FieldGroup className="mt-8">
            <Field>
              <Label htmlFor="nome">Nome</Label>
              <Input required id="nome" name="nome" placeholder="Nome" />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={createMacroProcessMutation.isPending}>
              {createMacroProcessMutation.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};