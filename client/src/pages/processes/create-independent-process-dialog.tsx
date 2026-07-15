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
import { useCreateProcess } from "@/hooks/use-create-process";
import { DialogDescription } from "@radix-ui/react-dialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDepartments } from "@/api/core";
import { Checkbox } from "@/components/ui/checkbox";

export const CreateIndependentProcessDialog = ({ isExternal, yearId }: { isExternal?: boolean; yearId: number | null }) => {
  const [open, setOpen] = useState(false);
  const [selectedDepts, setSelectedDepts] = useState<number[]>([]);

  const createProcessMutation = useCreateProcess();

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const name = formData.get("nome") as string;
    const obj = formData.get("objetivo") as string;

    if (!name?.trim() || !yearId) return;

    createProcessMutation.mutate(
      {
        name: name.trim(),
        objective: obj?.trim() || "",
        departmentIds: selectedDepts,
        yearId,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setSelectedDepts([]);
          e.currentTarget.reset();
        },
        onError: () => {
          setOpen(false);
          e.currentTarget.reset();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isExternal && (
      <DialogTrigger asChild>
        <Button variant={"ghost"}>
          <Plus />
        </Button>
      </DialogTrigger>
    )}
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar Processo Independente</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <FieldGroup className="mt-8">
            <Field>
              <Label htmlFor="nome">Nome</Label>
              <Input required id="nome" name="nome" placeholder="Nome" />
            </Field>
            <Field>
              <Label htmlFor="objetivo">Objetivo</Label>
              <Input required id="objetivo" name="objetivo" placeholder="Objetivo" />
            </Field>
            <Field>
              <Label>Departamentos</Label>
              {departments && departments.length > 0 ? (
                <div className="space-y-2 mt-1">
                  {departments.map((dept) => (
                    <label key={dept.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedDepts.includes(dept.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedDepts([...selectedDepts, dept.id]);
                          } else {
                            setSelectedDepts(selectedDepts.filter((id) => id !== dept.id));
                          }
                        }}
                      />
                      <span className="text-sm">{dept.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">Sem departamentos disponíveis.</p>
              )}
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={createProcessMutation.isPending}>
              {createProcessMutation.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
