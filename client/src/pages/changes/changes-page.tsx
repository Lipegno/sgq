import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChangeResponse, ChangeStatus, ChangeRequest } from "@/types";
import { getChanges, createChange, patchChange, deleteChange } from "@/api/core";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Search, History, RefreshCw, MoreHorizontal } from "lucide-react";
import { LogDialog } from "@/components/log-dialog";
import type { EntityType } from "@/types";

type SortKey = "description" | "status" | "startDate" | "expectedEndDate";
type SortDir = "asc" | "desc";

function statusVariant(status: ChangeStatus) {
  switch (status) {
    case "INITIATED":
      return "secondary" as const;
    case "IN_PROGRESS":
      return "default" as const;
    case "FINISHED":
      return "outline" as const;
    case "CANCELLED":
      return "destructive" as const;
  }
}

function statusLabel(status: ChangeStatus) {
  switch (status) {
    case "INITIATED":
      return "Iniciada";
    case "IN_PROGRESS":
      return "Em Curso";
    case "FINISHED":
      return "Concluída";
    case "CANCELLED":
      return "Cancelada";
  }
}

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface ChangeFormData {
  description: string;
  origin: string;
  whatWillBeDone: string;
  why: string;
  startDate: string;
  timeLimitInDays: string;
  expectedEndDate: string;
  realEndDate: string;
  where: string;
  how: string;
  howMuch: string;
  status: ChangeStatus;
  notes: string;
}

const emptyForm: ChangeFormData = {
  description: "",
  origin: "",
  whatWillBeDone: "",
  why: "",
  startDate: "",
  timeLimitInDays: "",
  expectedEndDate: "",
  realEndDate: "",
  where: "",
  how: "",
  howMuch: "",
  status: "INITIATED",
  notes: "",
};

function formToRequest(f: ChangeFormData, userId: number): ChangeRequest {
  return {
    description: f.description || null,
    origin: f.origin || null,
    whatWillBeDone: f.whatWillBeDone || null,
    why: f.why || null,
    createdById: userId,
    startDate: f.startDate || null,
    timeLimitInDays: f.timeLimitInDays ? Number(f.timeLimitInDays) : null,
    expectedEndDate: f.expectedEndDate || null,
    realEndDate: f.realEndDate || null,
    where: f.where || null,
    how: f.how || null,
    howMuch: f.howMuch || null,
    status: f.status,
    notes: f.notes || null,
  };
}

export default function ChangesPage() {
  const { user, isExternal } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusId, setStatusId] = useState<number | null>(null);
  const [statusValue, setStatusValue] = useState<ChangeStatus>("INITIATED");
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ChangeFormData>(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ChangeStatus | "ALL">("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("startDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [pageLogOpen, setPageLogOpen] = useState(false);

  const {
    data: changes,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["changes"],
    queryFn: getChanges,
  });

  const createMutation = useMutation({
    mutationFn: (data: ChangeRequest) => createChange(data),
    onSuccess: () => {
      toast.success("Alteração criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["changes"] });
      setCreateOpen(false);
      setForm(emptyForm);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao criar alteração");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ChangeRequest }) => patchChange(id, data),
    onSuccess: () => {
      toast.success("Alteração atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["changes"] });
      setEditOpen(false);
      setEditId(null);
      setForm(emptyForm);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao atualizar alteração");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ChangeStatus }) =>
      patchChange(id, { status }),
    onSuccess: () => {
      toast.success("Estado atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["changes"] });
      setStatusOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao atualizar estado");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteChange,
    onSuccess: () => {
      toast.success("Alteração eliminada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["changes"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao eliminar alteração");
    },
  });

  const handleEdit = (c: ChangeResponse) => {
    setEditId(c.id);
    setForm({
      description: c.description ?? "",
      origin: c.origin ?? "",
      whatWillBeDone: c.whatWillBeDone ?? "",
      why: c.why ?? "",
      startDate: c.startDate ?? "",
      timeLimitInDays: c.timeLimitInDays?.toString() ?? "",
      expectedEndDate: c.expectedEndDate ?? "",
      realEndDate: c.realEndDate ?? "",
      where: c.where ?? "",
      how: c.how ?? "",
      howMuch: c.howMuch ?? "",
      status: c.status,
      notes: c.notes ?? "",
    });
    setEditOpen(true);
  };

  const handleStatusClick = (c: ChangeResponse) => {
    setStatusId(c.id);
    setStatusValue(c.status);
    setStatusOpen(true);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let list = changes ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          (c.description ?? "").toLowerCase().includes(q) ||
          (c.origin ?? "").toLowerCase().includes(q) ||
          (c.createdBy ? `${c.createdBy.firstName} ${c.createdBy.lastName}`.toLowerCase().includes(q) : false),
      );
    }
    if (statusFilter !== "ALL") {
      list = list.filter((c) => c.status === statusFilter);
    }
    list = [...list].sort((a, b) => {
      let aVal: string | number | null;
      let bVal: string | number | null;
      switch (sortKey) {
        case "description":
          aVal = a.description ?? "";
          bVal = b.description ?? "";
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "startDate":
          aVal = a.startDate ? new Date(a.startDate).getTime() : 0;
          bVal = b.startDate ? new Date(b.startDate).getTime() : 0;
          break;
        case "expectedEndDate":
          aVal = a.expectedEndDate ? new Date(a.expectedEndDate).getTime() : 0;
          bVal = b.expectedEndDate ? new Date(b.expectedEndDate).getTime() : 0;
          break;
      }
      if (aVal! < bVal!) return sortDir === "asc" ? -1 : 1;
      if (aVal! > bVal!) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [changes, search, statusFilter, sortKey, sortDir]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full mt-8">
        <Skeleton className="h-10 w-1/3 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto w-full mt-8">
        <p className="text-destructive">Erro ao carregar as alterações.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full mt-8 mb-40">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 shadow-sm">
            <RefreshCw size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Alterações</h1>
            <p className="text-muted-foreground text-sm mt-1">Gerir alterações planeadas no SGQ.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPageLogOpen(true)}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
            title="Histórico de alterações"
          >
            <History size={20} />
          </button>
          {!isExternal && (
            <Button
              onClick={() => {
                setForm(emptyForm);
                setCreateOpen(true);
              }}
            >
              <Plus className="size-4" />
              Nova Alteração
            </Button>
          )}
        </div>
      </div>

      {(!changes || changes.length === 0) ? (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="text-slate-400" size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Nenhuma alteração encontrada</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2">
            Clique em "Nova Alteração" para começar.
          </p>
        </div>
      ) : (
        <>
          {/* Search & filter bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
              <Input
                placeholder="Pesquisar por descrição, origem ou responsável..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as ChangeStatus | "ALL")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os estados</SelectItem>
                <SelectItem value="INITIATED">Iniciada</SelectItem>
                <SelectItem value="IN_PROGRESS">Em Curso</SelectItem>
                <SelectItem value="FINISHED">Concluída</SelectItem>
                <SelectItem value="CANCELLED">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => handleSort("description")}>
                      Descrição
                      {sortKey === "description" ? (sortDir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3" />}
                    </button>
                  </TableHead>
                  <TableHead className="w-28 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => handleSort("status")}>
                      Estado
                      {sortKey === "status" ? (sortDir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3" />}
                    </button>
                  </TableHead>
                  <TableHead className="w-36 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Origem</TableHead>
                  <TableHead className="w-28 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => handleSort("startDate")}>
                      Início
                      {sortKey === "startDate" ? (sortDir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3" />}
                    </button>
                  </TableHead>
                  <TableHead className="w-28 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => handleSort("expectedEndDate")}>
                      Fim Previsto
                      {sortKey === "expectedEndDate" ? (sortDir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3" />}
                    </button>
                  </TableHead>
                  <TableHead className="w-20 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Responsável</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum resultado corresponde aos filtros.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c: ChangeResponse) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer [&>td]:py-3"
                      onClick={() => handleEdit(c)}
                    >
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {c.description || "Sem descrição"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={statusVariant(c.status)}
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusClick(c);
                          }}
                        >
                          {statusLabel(c.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.origin || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(c.startDate)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(c.expectedEndDate)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.createdBy ? `${c.createdBy.firstName} ${c.createdBy.lastName}` : "—"}
                      </TableCell>
                      <TableCell>
                        {!isExternal && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(c); }}>
                              <Pencil className="size-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(c.id); }}>
                              <Trash2 className="size-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Alteração</DialogTitle>
            <DialogDescription>Registe uma nova alteração planeada.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <ChangeFormFields form={form} setForm={setForm} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={() => createMutation.mutate(formToRequest(form, Number(user?.id ?? 1)))}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "A criar..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isExternal ? "Detalhes da Alteração" : "Editar Alteração"}</DialogTitle>
            <DialogDescription>{isExternal ? "Visualizar detalhes da alteração." : "Altere os dados da alteração."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <ChangeFormFields form={form} setForm={setForm} readOnly={isExternal} />
          </div>
          <DialogFooter>
            {isExternal ? (
              <DialogClose asChild>
                <Button variant="outline">Fechar</Button>
              </DialogClose>
            ) : (
              <>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button
                  onClick={() =>
                    updateMutation.mutate({
                      id: editId!,
                      data: formToRequest(form, Number(user?.id ?? 1)),
                    })
                  }
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "A guardar..." : "Guardar"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Estado</DialogTitle>
            <DialogDescription>Altere o estado desta alteração.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Novo estado</Label>
              <select
                id="status"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
                value={statusValue}
                onChange={e => setStatusValue(e.target.value as ChangeStatus)}
              >
                <option value="INITIATED">Iniciada</option>
                <option value="IN_PROGRESS">Em Curso</option>
                <option value="FINISHED">Concluída</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={() => statusMutation.mutate({ id: statusId!, status: statusValue })}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending ? "A guardar..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LogDialog
        open={pageLogOpen}
        onOpenChange={setPageLogOpen}
        entityTypes={["CHANGE"] as EntityType[]}
        title="Histórico — Alterações"
      />
    </div>
  );
}

function ChangeFormFields({
  form,
  setForm,
  readOnly = false,
}: {
  form: ChangeFormData;
  setForm: React.Dispatch<React.SetStateAction<ChangeFormData>>;
  readOnly?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2 grid gap-2">
        <Label htmlFor="description">Descrição *</Label>
        {readOnly ? <p className="text-sm text-foreground py-2 px-1">{form.description || '-'}</p>
        : <Input
          id="description"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Descrição da alteração"
        />}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="origin">Origem</Label>
        {readOnly ? <p className="text-sm text-foreground py-2 px-1">{form.origin || '-'}</p>
        : <Input
          id="origin"
          value={form.origin}
          onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}
          placeholder="Ex: Auditoria interna"
        />}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="status">Estado</Label>
        {readOnly ? <p className="text-sm text-foreground py-2 px-1">{statusLabel(form.status)}</p>
        : <select
          id="status"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
          value={form.status}
          onChange={e => setForm(f => ({ ...f, status: e.target.value as ChangeStatus }))}
        >
          <option value="INITIATED">Iniciada</option>
          <option value="IN_PROGRESS">Em Curso</option>
          <option value="FINISHED">Concluída</option>
          <option value="CANCELLED">Cancelada</option>
        </select>}
      </div>
      <div className="col-span-2 grid gap-2">
        <Label htmlFor="whatWillBeDone">O quê será feito</Label>
        {readOnly ? <p className="text-sm text-foreground py-2 px-1">{form.whatWillBeDone || '-'}</p>
        : <Input
          id="whatWillBeDone"
          value={form.whatWillBeDone}
          onChange={e => setForm(f => ({ ...f, whatWillBeDone: e.target.value }))}
          placeholder="Descreva o que será feito"
        />}
      </div>
      <div className="col-span-2 grid gap-2">
        <Label htmlFor="why">Porquê</Label>
        {readOnly ? <p className="text-sm text-foreground py-2 px-1">{form.why || '-'}</p>
        : <Input
          id="why"
          value={form.why}
          onChange={e => setForm(f => ({ ...f, why: e.target.value }))}
          placeholder="Razão da alteração"
        />}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="startDate">Data de início</Label>
        {readOnly ? <p className="text-sm text-foreground py-2 px-1">{form.startDate || '-'}</p>
        : <Input
          id="startDate"
          type="date"
          value={form.startDate}
          onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
        />}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="expectedEndDate">Data prevista de fim</Label>
        {readOnly ? <p className="text-sm text-foreground py-2 px-1">{form.expectedEndDate || '-'}</p>
        : <Input
          id="expectedEndDate"
          type="date"
          value={form.expectedEndDate}
          onChange={e => setForm(f => ({ ...f, expectedEndDate: e.target.value }))}
        />}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="timeLimitInDays">Prazo (dias)</Label>
        {readOnly ? <p className="text-sm text-foreground py-2 px-1">{form.timeLimitInDays || '-'}</p>
        : <Input
          id="timeLimitInDays"
          type="number"
          min={1}
          value={form.timeLimitInDays}
          onChange={e => setForm(f => ({ ...f, timeLimitInDays: e.target.value }))}
          placeholder="Ex: 30"
        />}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="where">Onde</Label>
        {readOnly ? <p className="text-sm text-foreground py-2 px-1">{form.where || '-'}</p>
        : <Input
          id="where"
          value={form.where}
          onChange={e => setForm(f => ({ ...f, where: e.target.value }))}
          placeholder="Local ou departamento"
        />}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="how">Como</Label>
        {readOnly ? <p className="text-sm text-foreground py-2 px-1">{form.how || '-'}</p>
        : <Input
          id="how"
          value={form.how}
          onChange={e => setForm(f => ({ ...f, how: e.target.value }))}
          placeholder="Método de implementação"
        />}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="howMuch">Quanto</Label>
        {readOnly ? <p className="text-sm text-foreground py-2 px-1">{form.howMuch || '-'}</p>
        : <Input
          id="howMuch"
          value={form.howMuch}
          onChange={e => setForm(f => ({ ...f, howMuch: e.target.value }))}
          placeholder="Recursos necessários"
        />}
      </div>
      <div className="col-span-2 grid gap-2">
        <Label htmlFor="notes">Notas</Label>
        {readOnly ? <p className="text-sm text-foreground whitespace-pre-wrap py-2 px-1">{form.notes || '-'}</p>
        : <textarea
          id="notes"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none resize-y"
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Notas adicionais..."
        />}
      </div>
    </div>
  );
}
