import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  InterestedPartyResponse,
  InterestedPartyType,
  CreateInterestedPartyRequest,
  UpdateInterestedPartyRequest,
  ProcessOptionResponse,
  YearResponse,
  DocumentWithVersionsResponse,
} from "@/types";
import {
  getInterestedPartiesByYear,
  createInterestedParty,
  updateInterestedParty,
  deleteInterestedParty,
  getProcessOptionsByYear,
  getYears,
  associateInterestedPartyYears,
  associateInterestedPartyYearsFull,
  disassociateInterestedPartyYears,
  associateInterestedPartyProcesses,
  disassociateInterestedPartyProcesses,
  uploadInterestedPartyEvidence,
  downloadDocumentVersion,
  deleteDocument,
} from "@/api/core";
import { useAuth } from "@/context/auth-context";
import YearAssociationDialog from "@/components/year-association-dialog";
import ProcessAssociationDialog from "@/components/process-association-dialog";
import { YearSelector } from "@/components/year-selector";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Users,
  Search,
  Globe,
  Pencil,
  Trash2,
  Link as LinkIcon,
  Phone,
  Calendar,
  X,
  ChevronRight,
  Paperclip,
  Upload,
  History,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LogDialog } from "@/components/log-dialog";
import type { EntityType } from "@/types";

type SortKey = "name" | "type" | "category";

const typeLabels: Record<InterestedPartyType, string> = {
  INTERNAL: "Interna",
  EXTERNAL: "Externa",
};

interface FormData {
  name: string;
  type: InterestedPartyType;
  category: string;
  contactInfo: string;
  needs: string;
  communicationAndMonitoringPlan: string;
  processYearIds: number[];
}

const emptyForm: FormData = {
  name: "",
  type: "INTERNAL",
  category: "",
  contactInfo: "",
  needs: "",
  communicationAndMonitoringPlan: "",
  processYearIds: [],
};

export default function InterestedPartiesPage() {
  const queryClient = useQueryClient();
  const { user, isExternal } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [yearId, setYearId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<InterestedPartyType | "ALL">("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [yearsOpen, setYearsOpen] = useState(false);
  const [yearsParty, setYearsParty] = useState<InterestedPartyResponse | null>(null);
  const [ipAssociatedYearIds, setIpAssociatedYearIds] = useState<Set<number>>(new Set());
  const [processOpen, setProcessOpen] = useState(false);
  const [optimisticProcessIds, setOptimisticProcessIds] = useState<Set<number>>(new Set());
  const [pageLogOpen, setPageLogOpen] = useState(false);
  const [partyLogOpen, setPartyLogOpen] = useState(false);
  const [partyLogId, setPartyLogId] = useState<number | null>(null);

  const { data: years, isLoading: yearsLoading } = useQuery({
    queryKey: ["years"],
    queryFn: getYears,
  });

  const { data: ipAllParties } = useQuery({
    queryKey: ["interested-parties-all-for-party", yearsParty?.id],
    queryFn: async () => {
      const allYrs = years ? [...years].sort((a, b) => b.year - a.year) : [];
      const results = await Promise.all(
        allYrs.map((y) =>
          getInterestedPartiesByYear(y.id).then((parties) =>
            parties.filter((p) => p.id === yearsParty!.id)
          )
        )
      );
      return results.flat();
    },
    enabled: yearsOpen && yearsParty !== null,
  });

  useEffect(() => {
    if (ipAllParties) {
      setIpAssociatedYearIds(new Set(ipAllParties.map((p) => p.yearId)));
    }
  }, [ipAllParties]);

  const sortedYearsAll = years ? [...years].sort((a, b) => b.year - a.year) : [];
  const currentYear = new Date().getFullYear();
  const selectedYearId = yearId ?? (sortedYearsAll.length > 0 ? (sortedYearsAll.find(y => y.year === currentYear)?.id ?? sortedYearsAll[0].id) : null);

  const {
    data: parties,
    isLoading: partiesLoading,
    isError,
  } = useQuery({
    queryKey: ["interested-parties", selectedYearId],
    queryFn: () => getInterestedPartiesByYear(selectedYearId!),
    enabled: !!selectedYearId,
  });

  const { data: processOptions } = useQuery({
    queryKey: ["process-options", selectedYearId],
    queryFn: () => getProcessOptionsByYear(selectedYearId!),
    enabled: !!selectedYearId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateInterestedPartyRequest) => createInterestedParty(data),
    onSuccess: () => {
      toast.success("Parte interessada criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["interested-parties", selectedYearId] });
      setCreateOpen(false);
      setForm(emptyForm);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao criar parte interessada");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateInterestedPartyRequest }) =>
      updateInterestedParty(id, data),
    onSuccess: () => {
      toast.success("Parte interessada atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["interested-parties", selectedYearId] });
      setEditOpen(false);
      setEditId(null);
      setForm(emptyForm);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao atualizar parte interessada");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInterestedParty,
    onSuccess: () => {
      toast.success("Parte interessada eliminada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["interested-parties", selectedYearId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao eliminar parte interessada");
    },
  });

  const uploadEvidenceMutation = useMutation({
    mutationFn: ({ interestedPartyYearId, file }: { interestedPartyYearId: number; file: File }) =>
      uploadInterestedPartyEvidence(interestedPartyYearId, file, user!.id),
    onSuccess: () => {
      toast.success("Evidência carregada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["interested-parties", selectedYearId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao carregar evidência");
    },
  });

  const deleteEvidenceMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      toast.success("Evidência eliminada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["interested-parties", selectedYearId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao eliminar evidência");
    },
  });

  const associateIPYearMutation = useMutation({
    mutationFn: ({ yearId, full }: { yearId: number; full: boolean }) => {
      if (full) {
        return associateInterestedPartyYearsFull(yearsParty!.id, [yearId]);
      }
      return associateInterestedPartyYears(yearsParty!.id, [yearId]);
    },
    onSuccess: (_data, variables) => {
      toast.success("Ano associado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["interested-parties"] });
      queryClient.invalidateQueries({ queryKey: ["interested-parties-all-for-party"] });
      setIpAssociatedYearIds((prev) => {
        const next = new Set(prev);
        next.add(variables.yearId);
        return next;
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao associar ano");
    },
  });

  const disassociateIPYearMutation = useMutation({
    mutationFn: (yearId: number) =>
      disassociateInterestedPartyYears(yearsParty!.id, [yearId]),
    onSuccess: (_data, yearId) => {
      toast.success("Ano desassociado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["interested-parties"] });
      queryClient.invalidateQueries({ queryKey: ["interested-parties-all-for-party"] });
      setIpAssociatedYearIds((prev) => {
        const next = new Set(prev);
        next.delete(yearId);
        return next;
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao desassociar ano");
    },
  });

  const handleEdit = (p: InterestedPartyResponse) => {
    setEditId(p.interestedPartyYearId);
    setForm({
      name: p.name ?? "",
      type: p.type,
      category: p.category ?? "",
      contactInfo: p.contactInfo ?? "",
      needs: p.needs ?? "",
      communicationAndMonitoringPlan: p.communicationAndMonitoringPlan ?? "",
      processYearIds: p.processes?.map((proc) => proc.processYearId) ?? [],
    });
    setEditOpen(true);
  };

  const editParty = parties?.find((p) => p.interestedPartyYearId === editId) ?? null;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let list = parties ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.contactInfo?.toLowerCase().includes(q) ||
          p.needs?.toLowerCase().includes(q),
      );
    }
    if (typeFilter !== "ALL") {
      list = list.filter((p) => p.type === typeFilter);
    }
    list = [...list].sort((a, b) => {
      let aVal: string;
      let bVal: string;
      switch (sortKey) {
        case "name":
          aVal = a.name ?? "";
          bVal = b.name ?? "";
          break;
        case "type":
          aVal = a.type;
          bVal = b.type;
          break;
        case "category":
          aVal = a.category ?? "";
          bVal = b.category ?? "";
          break;
      }
      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [parties, search, typeFilter, sortKey, sortDir]);

  if (yearsLoading) {
    return (
      <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full mt-8">
        <Skeleton className="h-10 w-1/3 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!years || years.length === 0) {
    return (
      <div className="max-w-5xl mx-auto w-full mt-8">
        <h1 className="text-2xl font-semibold mb-6">Partes Interessadas</h1>
        <p className="text-muted-foreground">Nenhum ano disponível. Crie anos primeiro.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full mt-8 mb-40">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 shadow-sm">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Partes Interessadas</h1>
            <p className="text-muted-foreground text-sm mt-1">Gerir partes interessadas, necessidades e expetativas.</p>
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
          <YearSelector
            selectedYearId={selectedYearId}
            onYearChange={(v) => setYearId(v)}
          />
          {!isExternal && (
            <Button
              onClick={() => {
                setForm(emptyForm);
                setCreateOpen(true);
              }}
              disabled={!selectedYearId}
            >
              <Plus className="size-4" />
              Nova Parte
            </Button>
          )}
        </div>
      </div>

      {/* Search & filter bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
          <Input
            placeholder="Pesquisar por nome ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as InterestedPartyType | "ALL")}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os tipos</SelectItem>
            <SelectItem value="INTERNAL">Interna</SelectItem>
            <SelectItem value="EXTERNAL">Externa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards list */}
      {partiesLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <p className="text-destructive">Erro ao carregar as partes interessadas.</p>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((p) => (
            <PartyCard
              key={p.id}
              party={p}
              onClick={() => handleEdit(p)}
              onDelete={() => deleteMutation.mutate(p.interestedPartyYearId)}
              onManageYears={() => {
                setYearsParty(p);
                setYearsOpen(true);
              }}
              onLog={() => {
                setPartyLogId(p.id);
                setPartyLogOpen(true);
              }}
              isExternal={isExternal}
            />
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="text-slate-400" size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Nenhuma parte interessada encontrada</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2">
            {parties && parties.length > 0
              ? "Tente ajustar os filtros de pesquisa."
              : "Clique em \"Nova Parte\" para começar."}
          </p>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Parte Interessada</DialogTitle>
            <DialogDescription>Registe uma nova parte interessada.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <PartyFormFields form={form} setForm={setForm} processOptions={processOptions ?? []} showAssociations={false} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={() =>
                createMutation.mutate({
                  name: form.name,
                  type: form.type,
                  category: form.category || null,
                  contactInfo: form.contactInfo || null,
                  yearId: selectedYearId!,
                  needs: form.needs || null,
                  communicationAndMonitoringPlan: form.communicationAndMonitoringPlan || null,
                  processYearIds: form.processYearIds.length ? form.processYearIds : null,
                })
              }
              disabled={createMutation.isPending || !form.name.trim() || !form.type}
            >
              {createMutation.isPending ? "A criar..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isExternal ? "Detalhes da Parte Interessada" : "Editar Parte Interessada"}</DialogTitle>
            <DialogDescription>{isExternal ? "Visualizar detalhes da parte interessada." : "Altere os dados da parte interessada."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <PartyFormFields form={form} setForm={setForm} processOptions={processOptions ?? []}
              readOnly={isExternal}
              onOpenProcessDialog={() => {
              if (editParty) {
                setOptimisticProcessIds(new Set(editParty.processes?.map((p) => p.processYearId) ?? []));
                setProcessOpen(true);
              }
            }}
            evidences={editParty?.evidences}
            onUploadEvidence={(file) => {
              if (editParty) {
                uploadEvidenceMutation.mutate({ interestedPartyYearId: editParty.interestedPartyYearId, file });
              }
            }}
            onDeleteEvidence={(documentId) => deleteEvidenceMutation.mutate(documentId)}
            uploadPending={uploadEvidenceMutation.isPending}
            deletePending={deleteEvidenceMutation.isPending}
            />
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
                      data: {
                        name: form.name || null,
                        type: form.type,
                        category: form.category || null,
                        contactInfo: form.contactInfo || null,
                        needs: form.needs || null,
                        communicationAndMonitoringPlan: form.communicationAndMonitoringPlan || null,
                      },
                    })
                  }
                  disabled={updateMutation.isPending || !form.name.trim() || !form.type}
                >
                  {updateMutation.isPending ? "A guardar..." : "Guardar"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Year Association Dialog */}
      <YearAssociationDialog
        open={yearsOpen}
        onOpenChange={(o) => { if (!o) { setYearsOpen(false); setYearsParty(null); } }}
        title="Gerir Anos"
        description={`Selecione os anos em que ${yearsParty?.name ?? ""} está ativa.`}
        allYears={sortedYearsAll}
        associatedYearIds={ipAssociatedYearIds}
        currentYearId={selectedYearId}
        onAssociate={(yearId) => associateIPYearMutation.mutate({ yearId, full: false })}
        onAssociateFull={(yearId) => associateIPYearMutation.mutate({ yearId, full: true })}
        onDisassociate={(yearId) => disassociateIPYearMutation.mutate(yearId)}
        isPending={associateIPYearMutation.isPending || disassociateIPYearMutation.isPending}
        minYears={1}
      />

      {/* Process Association Dialog */}
      {editParty && (
        <ProcessAssociationDialog
          open={processOpen}
          onOpenChange={(o) => { if (!o) setProcessOpen(false); }}
          allProcesses={processOptions ?? []}
          associatedIds={optimisticProcessIds}
          onAssociate={(processYearId) => {
            setOptimisticProcessIds((prev) => new Set(prev).add(processYearId));
            associateInterestedPartyProcesses(editParty.interestedPartyYearId, [processYearId])
              .then(() => {
                queryClient.invalidateQueries({ queryKey: ["interested-parties"] });
                queryClient.invalidateQueries({ queryKey: ["process-options"] });
                toast.success("Processo associado com sucesso!");
              })
              .catch((err: any) => {
                setOptimisticProcessIds((prev) => {
                  const next = new Set(prev);
                  next.delete(processYearId);
                  return next;
                });
                toast.error(err?.response?.data?.message ?? "Erro ao associar processo");
              });
          }}
          onDisassociate={(processYearId) => {
            setOptimisticProcessIds((prev) => {
              const next = new Set(prev);
              next.delete(processYearId);
              return next;
            });
            disassociateInterestedPartyProcesses(editParty.interestedPartyYearId, [processYearId])
              .then(() => {
                queryClient.invalidateQueries({ queryKey: ["interested-parties"] });
                queryClient.invalidateQueries({ queryKey: ["process-options"] });
                toast.success("Processo desassociado com sucesso!");
              })
              .catch((err: any) => {
                setOptimisticProcessIds((prev) => new Set(prev).add(processYearId));
                toast.error(err?.response?.data?.message ?? "Erro ao desassociar processo");
              });
          }}
        />
      )}

      <LogDialog
        open={pageLogOpen}
        onOpenChange={setPageLogOpen}
        entityTypes={["INTERESTED_PARTY"] as EntityType[]}
        yearId={selectedYearId ?? undefined}
        title="Histórico — Partes Interessadas"
      />

      <LogDialog
        open={partyLogOpen}
        onOpenChange={setPartyLogOpen}
        entityTypes={["INTERESTED_PARTY"] as EntityType[]}
        baseEntityId={partyLogId ?? undefined}
        title="Histórico da Parte Interessada"
      />
    </div>
  );
}

function PartyCard({
  party,
  onClick,
  onDelete,
  onManageYears,
  onLog,
  isExternal,
}: {
  party: InterestedPartyResponse;
  onClick: () => void;
  onDelete: () => void;
  onManageYears: () => void;
  onLog: () => void;
  isExternal: boolean;
}) {
  const isInternal = party.type === "INTERNAL";
  const hasDetails = party.processes && party.processes.length > 0;

  return (
    <div className="border border-slate-200 rounded-md shadow-sm overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors select-none"
        onClick={onClick}
      >
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            isInternal ? "bg-indigo-100 text-indigo-600" : "bg-amber-100 text-amber-600"
          }`}
        >
          <Users size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 truncate">{party.name}</h3>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isInternal ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              {typeLabels[party.type]}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 mt-0.5">
            {party.category && (
              <span className="flex items-center gap-1">
                <Globe size={12} className="text-slate-400" />
                {party.category}
              </span>
            )}
            {party.contactInfo && (
              <span className="flex items-center gap-1">
                <Phone size={12} className="text-slate-400" />
                {party.contactInfo}
              </span>
            )}
            {party.processes && party.processes.length > 0 && (
              <span className="flex items-center gap-1">
                <LinkIcon size={12} className="text-slate-400" />
                {party.processes.length} processo{party.processes.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {!isExternal && (
          <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                  <MoreVertical size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onManageYears}>
                  <Calendar size={14} />
                  Gerir Anos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLog}>
                  <History size={14} />
                  Histórico
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                  <Trash2 size={14} />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {hasDetails && (
        <div className="px-4 pb-3 pt-1 border-t border-slate-100 text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
          {party.processes && party.processes.length > 0 && (
            <span className="truncate">
              Processos: {party.processes.map((p) => p.processName).join(", ")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function PartyFormFields({
  form,
  setForm,
  processOptions,
  onOpenProcessDialog,
  evidences,
  onUploadEvidence,
  onDeleteEvidence,
  uploadPending,
  deletePending,
  showAssociations = true,
  readOnly = false,
}: {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  processOptions: ProcessOptionResponse[];
  onOpenProcessDialog?: () => void;
  evidences?: DocumentWithVersionsResponse[];
  onUploadEvidence?: (file: File) => void;
  onDeleteEvidence?: (documentId: number) => void;
  uploadPending?: boolean;
  deletePending?: boolean;
  showAssociations?: boolean;
  readOnly?: boolean;
}) {
  const associatedProcesses = processOptions.filter((p) =>
    form.processYearIds.includes(p.processYearId)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 grid gap-1.5">
            <Label htmlFor="name">Nome *</Label>
            {readOnly ? (
              <p className="text-sm text-foreground py-2 px-1">{form.name || '-'}</p>
            ) : (
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome da parte interessada"
              />
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="type">Tipo *</Label>
            {readOnly ? (
              <p className="text-sm text-foreground py-2 px-1">{typeLabels[form.type]}</p>
            ) : (
              <Select
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v as InterestedPartyType }))}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERNAL">Interna</SelectItem>
                  <SelectItem value="EXTERNAL">Externa</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="category">Categoria</Label>
            {readOnly ? (
              <p className="text-sm text-foreground py-2 px-1">{form.category || '-'}</p>
            ) : (
              <Input
                id="category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="Ex: Funcionário, Cliente"
              />
            )}
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="contactInfo">Contacto</Label>
          {readOnly ? (
            <p className="text-sm text-foreground py-2 px-1">{form.contactInfo || '-'}</p>
          ) : (
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input
                id="contactInfo"
                value={form.contactInfo}
                onChange={(e) => setForm((f) => ({ ...f, contactInfo: e.target.value }))}
                placeholder="Email ou telefone"
                className="pl-9"
              />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid gap-1.5">
          <Label htmlFor="needs">Necessidades e Expetativas</Label>
          {readOnly ? (
            <p className="text-sm text-foreground whitespace-pre-wrap py-2 px-1">{form.needs || '-'}</p>
          ) : (
            <textarea
              id="needs"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none resize-none"
              value={form.needs}
              onChange={(e) => setForm((f) => ({ ...f, needs: e.target.value }))}
              placeholder="Que necessidades e expetativas tem esta parte interessada?"
            />
          )}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="communicationAndMonitoringPlan">Plano de Comunicação e Monitorização</Label>
          {readOnly ? (
            <p className="text-sm text-foreground whitespace-pre-wrap py-2 px-1">{form.communicationAndMonitoringPlan || '-'}</p>
          ) : (
            <textarea
              id="communicationAndMonitoringPlan"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none resize-none"
              value={form.communicationAndMonitoringPlan}
              onChange={(e) => setForm((f) => ({ ...f, communicationAndMonitoringPlan: e.target.value }))}
              placeholder="Como comunicar e monitorizar esta parte interessada?"
            />
          )}
        </div>
      </div>

      {/* Process Association Section */}
      {showAssociations && (
        <>
      <div className="col-span-1 lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Processos Associados
          </h4>
          {onOpenProcessDialog && !readOnly && (
            <button
              onClick={onOpenProcessDialog}
              className="flex items-center gap-1 text-sm bg-blue-50 border border-blue-200 hover:border-blue-400 hover:text-blue-700 text-blue-600 px-3 py-1.5 rounded-md shadow-sm transition-all cursor-pointer"
            >
              <LinkIcon size={14} />
              Associar Processos
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {associatedProcesses.length > 0 ? (
            associatedProcesses.map((proc) => (
              <div
                key={proc.processYearId}
                className="flex items-center justify-between text-sm bg-white border border-slate-200 px-3 py-2 rounded shadow-sm"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800">{proc.processName}</span>
                  {proc.macroProcessName && (
                    <span className="text-xs text-slate-400 uppercase">{proc.macroProcessName}</span>
                  )}
                </div>
                {!readOnly && (
                  <button
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        processYearIds: f.processYearIds.filter((id) => id !== proc.processYearId),
                      }))
                    }
                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                    title="Desassociar"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
              Nenhum processo associado.
            </div>
          )}
        </div>
      </div>

      {/* Evidence Documents Section */}
      <div className="col-span-1 lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Evidências
          </h4>
          {onUploadEvidence && !readOnly && (
            <button
              onClick={() => document.getElementById("evidence-upload")?.click()}
              disabled={uploadPending}
              className="flex items-center gap-1 text-sm bg-emerald-50 border border-emerald-200 hover:border-emerald-400 hover:text-emerald-700 text-emerald-600 px-3 py-1.5 rounded-md shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Upload size={14} />
              {uploadPending ? "A carregar..." : "Carregar Evidência"}
            </button>
          )}
          <input
            id="evidence-upload"
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && onUploadEvidence) {
                onUploadEvidence(file);
                e.target.value = "";
              }
            }}
          />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {evidences && evidences.length > 0 ? (
            evidences.map((doc) => {
              const latestVersion = doc.versions?.[doc.versions.length - 1];
              return (
                <div
                  key={doc.documentId}
                  className="flex items-center justify-between text-sm bg-white border border-slate-200 px-3 py-2 rounded shadow-sm"
                >
                  <button
                    className="flex items-center gap-2 text-left hover:text-blue-600 transition-colors min-w-0 cursor-pointer"
                    onClick={() => {
                      if (latestVersion) {
                        downloadDocumentVersion(latestVersion.versionId, latestVersion.fileName);
                      }
                    }}
                    title={latestVersion?.fileName ?? "Documento"}
                  >
                    <Paperclip size={14} className="shrink-0" />
                    <div className="flex flex-col min-w-0">
                      {latestVersion && (
                        <span className="text-xs text-slate-400 truncate">
                          {latestVersion.uploadedBy
                            ? `${latestVersion.uploadedBy.firstName} ${latestVersion.uploadedBy.lastName} · `
                            : ""}
                          {new Date(latestVersion.uploadedAt).toLocaleDateString("pt-PT")}
                        </span>
                      )}
                      <span className="truncate">
                        {latestVersion?.fileName
                          ? latestVersion.fileName.replace(/_[0-9a-f-]{36}\./, ".")
                          : "Documento"}
                      </span>
                    </div>
                  </button>
                  {onDeleteEvidence && !readOnly && (
                    <button
                      onClick={() => onDeleteEvidence(doc.documentId)}
                      disabled={deletePending}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1 disabled:opacity-50"
                      title="Eliminar evidência"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
              Nenhuma evidência carregada.
            </div>
          )}
        </div>
      </div>
    </>
      )}
    </div>
  );
}