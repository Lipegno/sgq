import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getYears, createYear } from "@/api/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar, Plus } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

export default function YearsPage() {
  const { roles } = useAuth();
  const isSuperAdmin = roles.includes("ROLE_SUPERADMIN");
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [newYear, setNewYear] = useState("");

  const { data: years, isLoading } = useQuery({
    queryKey: ["years"],
    queryFn: getYears,
  });

  const createMutation = useMutation({
    mutationFn: createYear,
    onSuccess: () => {
      toast.success("Ano criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["years"] });
      setCreateOpen(false);
      setNewYear("");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao criar ano");
    },
  });

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso negado.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">A carregar anos...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 max-w-4xl mx-auto w-full mb-40 mt-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 shadow-sm">
            <Calendar size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Anos</h1>
            <p className="text-muted-foreground text-sm mt-1">Gerir os anos disponíveis no sistema.</p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4 mr-1" /> Criar Ano
        </Button>
      </div>

      <div className="space-y-3">
        {years?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
            Sem anos criados.
          </div>
        )}
        {years?.sort((a, b) => b.year - a.year).map((year) => (
          <div
            key={year.id}
            className="border rounded-lg p-4 shadow-sm hover:border-primary/30 transition-colors"
          >
            <h3 className="font-semibold text-lg">{year.year}</h3>
          </div>
        ))}
      </div>

      {/* Create Year Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const yearNum = parseInt(newYear);
              if (yearNum >= 2000 && yearNum <= 2100) {
                createMutation.mutate({ year: yearNum });
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>Criar Ano</DialogTitle>
              <DialogDescription>Introduza o ano que pretende adicionar ao sistema.</DialogDescription>
            </DialogHeader>
            <FieldGroup className="mt-4">
              <Field>
                <Label htmlFor="year-input">Ano</Label>
                <Input
                  id="year-input"
                  type="number"
                  min={2000}
                  max={2100}
                  placeholder="2025"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                />
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={createMutation.isPending || !newYear}>
                {createMutation.isPending ? "Criando..." : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}