import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  AlertTriangle,
  Plus,
  Search,
  Trash2,
  FileText,
  CheckCircle2,
  X,
  Target,
  Upload,
  Download,
  Info,
  ArrowRight,
  User,
  ShieldCheck,
  Zap,
  Pencil,
  ArrowUpDown,
  CalendarDays,
  MoreVertical,
  History,
} from "lucide-react";
import {
  getYears,
  getNonConformitiesByYear,
  createNonConformity,
  updateNonConformity,
  deleteNonConformity,
  createCorrectiveAction,
  updateCorrectiveAction,
  deleteCorrectiveAction,
  uploadCorrectiveActionDocument,
  deleteCorrectiveActionDocument,
  updateNonConformityYear,
  associateNonConformityYears,
  getDepartments,
} from "@/api/core";
import { LogDialog } from "@/components/log-dialog";
import { YearSelector } from "@/components/year-selector";
import YearAssociationDialog from "@/components/year-association-dialog";
import ConfirmDialog from "@/components/confirm-dialog";
import type {
  NonConformityResponse,
  NonConformityYearResponse,
  CorrectiveActionResponse,
  NonConformityOrigin,
  NonConformityStatus,
  CorrectiveActionStatus,
  EntityType,
  DepartmentResponse,
} from "@/types";

const ORIGIN_LABELS: Record<NonConformityOrigin, string> = {
  INTERNAL_AUDIT: "Auditoria Interna",
  CLIENT: "Cliente",
  EXTERNAL_AUDIT: "Auditoria Externa",
  NOT_SPECIFIED: "Não Especificada",
};

const ORIGIN_OPTIONS: { value: NonConformityOrigin; label: string }[] = [
  { value: "INTERNAL_AUDIT", label: "Auditoria Interna" },
  { value: "EXTERNAL_AUDIT", label: "Auditoria Externa" },
  { value: "CLIENT", label: "Reclamação de Cliente" },
  { value: "NOT_SPECIFIED", label: "Não Especificada" },
];

const STATUS_LABELS: Record<NonConformityStatus, string> = {
  OPEN: "Aberta",
  UNDER_TREATMENT: "Em Tratamento",
  FINISHED: "Concluída",
  CLASSIFIED: "Classificada",
};

const STATUS_OPTIONS: { value: NonConformityStatus; label: string }[] = [
  { value: "OPEN", label: "Aberta" },
  { value: "UNDER_TREATMENT", label: "Em Tratamento" },
  { value: "CLASSIFIED", label: "Classificada" },
  { value: "FINISHED", label: "Concluída" },
];

const CA_STATUS_LABELS: Record<CorrectiveActionStatus, string> = {
  REGISTERED: "Registada",
  IN_PROGRESS: "Em Progresso",
  FINISHED: "Concluída",
};

const CA_STATUS_OPTIONS: { value: CorrectiveActionStatus; label: string }[] = [
  { value: "REGISTERED", label: "Registada" },
  { value: "IN_PROGRESS", label: "Em Progresso" },
  { value: "FINISHED", label: "Concluída" },
];

type FilterStatus = "ALL" | NonConformityStatus;
type SortMode = "newest" | "oldest" | "status";

function statusBadgeVariant(status: NonConformityStatus) {
  switch (status) {
    case "OPEN": return "destructive" as const;
    case "UNDER_TREATMENT": return "default" as const;
    case "FINISHED": return "outline" as const;
    case "CLASSIFIED": return "secondary" as const;
  }
}

function statusSelectClass(status: NonConformityStatus) {
  switch (status) {
    case "OPEN": return "bg-destructive/10 text-destructive border-destructive/30";
    case "UNDER_TREATMENT": return "bg-primary/10 text-primary border-primary/30";
    case "CLASSIFIED": return "bg-secondary/10 text-secondary-foreground border-secondary/30";
    case "FINISHED": return "bg-muted text-muted-foreground border-border";
  }
}

function caStatusSelectClass(status: CorrectiveActionStatus) {
  switch (status) {
    case "REGISTERED": return "bg-secondary/10 text-secondary-foreground border-secondary/30";
    case "IN_PROGRESS": return "bg-primary/10 text-primary border-primary/30";
    case "FINISHED": return "bg-muted text-muted-foreground border-border";
  }
}

function caStatusBadgeVariant(status: CorrectiveActionStatus) {
  switch (status) {
    case "REGISTERED": return "secondary" as const;
    case "IN_PROGRESS": return "default" as const;
    case "FINISHED": return "outline" as const;
  }
}

function getCurrentYearStatus(nc: NonConformityResponse, yearId: number): NonConformityYearResponse | undefined {
  return nc.years.find((y) => y.yearId === yearId);
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["non-conformities"] });
}

export default function NonConformitiesPage() {
  const queryClient = useQueryClient();
  const { user, isExternal } = useAuth();

  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [selectedNC, setSelectedNC] = useState<NonConformityResponse | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [departmentFilter, setDepartmentFilter] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addCause, setAddCause] = useState("");
  const [addOrigin, setAddOrigin] = useState<NonConformityOrigin>("NOT_SPECIFIED");
  const [addDepartmentId, setAddDepartmentId] = useState<number | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCause, setEditCause] = useState("");
  const [editOrigin, setEditOrigin] = useState<NonConformityOrigin>("NOT_SPECIFIED");
  const [editDepartmentId, setEditDepartmentId] = useState<number | null>(null);

  const [editYearDialogOpen, setEditYearDialogOpen] = useState(false);
  const [editYearStatus, setEditYearStatus] = useState<NonConformityStatus>("OPEN");
  const [editYearEvaluation, setEditYearEvaluation] = useState("");
  const [editYearEvalDescription, setEditYearEvalDescription] = useState("");

  const [yearAssociateDialogOpen, setYearAssociateDialogOpen] = useState(false);
  const [ncAssociatedYearIds, setNcAssociatedYearIds] = useState<Set<number>>(new Set());
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);

  const [confirmDeleteNC, setConfirmDeleteNC] = useState(false);
  const [pageLogOpen, setPageLogOpen] = useState(false);

  const [caDialogOpen, setCaDialogOpen] = useState(false);
  const [caName, setCaName] = useState("");
  const [caDescription, setCaDescription] = useState("");

  const [editCaDialogOpen, setEditCaDialogOpen] = useState(false);
  const [editCaId, setEditCaId] = useState<number | null>(null);
  const [editCaName, setEditCaName] = useState("");
  const [editCaDescription, setEditCaDescription] = useState("");
  const [editCaStatus, setEditCaStatus] = useState<CorrectiveActionStatus>("REGISTERED");
  const [editCaProgress, setEditCaProgress] = useState("");

  const [editWhatWillBeDone, setEditWhatWillBeDone] = useState("");
  const [editWhy, setEditWhy] = useState("");
  const [editWho, setEditWho] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editExpectedEndDate, setEditExpectedEndDate] = useState("");
  const [editWhere, setEditWhere] = useState("");
  const [editHow, setEditHow] = useState("");
  const [editHowMuch, setEditHowMuch] = useState("");

  const [editEffectivenessVerification, setEditEffectivenessVerification] = useState("");
  const [editVerificationDate, setEditVerificationDate] = useState("");
  const [editVerificationResponsible, setEditVerificationResponsible] = useState("");

  const { data: years } = useQuery({ queryKey: ["years"], queryFn: getYears });
  const { data: departments } = useQuery({ queryKey: ["departments"], queryFn: getDepartments });
  const effectiveYearId = selectedYearId;

  // Variáveis para a matriz 5W2H
const [addWhatWillBeDone, setAddWhatWillBeDone] = useState("");
const [addWhy, setAddWhy] = useState("");
const [addWho, setAddWho] = useState("");
const [addStartDate, setAddStartDate] = useState("");
const [addExpectedEndDate, setAddExpectedEndDate] = useState("");
const [addWhere, setAddWhere] = useState("");
const [addHow, setAddHow] = useState("");
const [addHowMuch, setAddHowMuch] = useState("");

// Variáveis para a Verificação de Eficácia
const [addEffectivenessVerification, setAddEffectivenessVerification] = useState("");
const [addVerificationDate, setAddVerificationDate] = useState("");
const [addVerificationResponsible, setAddVerificationResponsible] = useState("");

  useEffect(() => {
    if (selectedYearId !== null) return;
    if (!years || years.length === 0) return;
    const currentYearVal = new Date().getFullYear();
    const match = years.find(y => y.year === currentYearVal) ?? years[0];
    setSelectedYearId(match.id);
  }, [selectedYearId, years]);

  const { data: nonConformities, isLoading } = useQuery({
    queryKey: ["non-conformities", effectiveYearId],
    queryFn: () => getNonConformitiesByYear(effectiveYearId!),
    enabled: effectiveYearId !== null,
  });

  /* Close actions menu when clicking outside */
  useEffect(() => {
    if (!actionsMenuOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("#nc-actions-menu") && !target.closest("#nc-actions-toggle")) {
        setActionsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [actionsMenuOpen]);

  /* Sync selectedNC with latest query data so detail panel updates after mutations */
  useEffect(() => {
    if (selectedNC && nonConformities) {
      const updated = nonConformities.find((nc) => nc.id === selectedNC.id);
      if (updated) setSelectedNC(updated);
    }
  }, [nonConformities]);

  const createMutation = useMutation({
    mutationFn: createNonConformity,
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Não conformidade registada com sucesso.");
      setAddDialogOpen(false);
      resetAddForm();
    },
    onError: (err) => {
      console.error("Create NC error:", err);
      toast.error("Erro ao registar não conformidade.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateNonConformity>[1] }) =>
      updateNonConformity(id, data),
    onSuccess: (updated) => {
      invalidateAll(queryClient);
      toast.success("Não conformidade atualizada.");
      setEditDialogOpen(false);
      setSelectedNC(updated);
    },
    onError: () => toast.error("Erro ao atualizar não conformidade."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNonConformity,
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Não conformidade eliminada.");
      setSelectedNC(null);
    },
    onError: () => toast.error("Erro ao eliminar não conformidade."),
  });

  const updateYearMutation = useMutation({
    mutationFn: ({
      ncId, yearId, data,
    }: { ncId: number; yearId: number; data: Parameters<typeof updateNonConformityYear>[2] }) =>
      updateNonConformityYear(ncId, yearId, data),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Estado da não conformidade atualizado.");
      setEditYearDialogOpen(false);
    },
    onError: () => toast.error("Erro ao atualizar estado."),
  });

  const associateYearsMutation = useMutation({
    mutationFn: ({ ncId, associateYearIds, disassociateYearIds }: { ncId: number; associateYearIds: number[]; disassociateYearIds: number[] }) =>
      associateNonConformityYears(ncId, associateYearIds, disassociateYearIds),
    onSuccess: (_data, variables) => {
      invalidateAll(queryClient);
      toast.success("Anos atualizados com sucesso.");
      setNcAssociatedYearIds((prev) => {
        const next = new Set(prev);
        variables.associateYearIds.forEach((yid) => next.add(yid));
        variables.disassociateYearIds.forEach((yid) => next.delete(yid));
        return next;
      });
    },
    onError: () => toast.error("Erro ao associar anos."),
  });

  const createCAMutation = useMutation({
    mutationFn: ({ ncId, data }: { ncId: number; data: Parameters<typeof createCorrectiveAction>[1] }) =>
      createCorrectiveAction(ncId, data),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Ação corretiva registada.");
      setCaDialogOpen(false);
      setCaName("");
      setCaDescription("");
    },
    onError: () => toast.error("Erro ao registar ação corretiva."),
  });

  const updateCAMutation = useMutation({
    mutationFn: ({
      ncId, actionId, data,
    }: { ncId: number; actionId: number; data: Parameters<typeof updateCorrectiveAction>[2] }) =>
      updateCorrectiveAction(ncId, actionId, data),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Ação corretiva atualizada.");
      setEditCaDialogOpen(false);
    },
    onError: () => toast.error("Erro ao atualizar ação corretiva."),
  });

  const deleteCAMutation = useMutation({
    mutationFn: ({ ncId, actionId }: { ncId: number; actionId: number }) =>
      deleteCorrectiveAction(ncId, actionId),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Ação corretiva eliminada.");
    },
    onError: () => toast.error("Erro ao eliminar ação corretiva."),
  });

  const uploadDocMutation = useMutation({
    mutationFn: ({ ncId, actionId, file }: { ncId: number; actionId: number; file: File }) =>
      uploadCorrectiveActionDocument(ncId, actionId, file, user!.id),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Documento carregado.");
    },
    onError: () => toast.error("Erro ao carregar documento."),
  });

  const deleteDocMutation = useMutation({
    mutationFn: ({ ncId, actionId, documentId }: { ncId: number; actionId: number; documentId: number }) =>
      deleteCorrectiveActionDocument(ncId, actionId, documentId),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Documento eliminado.");
    },
    onError: () => toast.error("Erro ao eliminar documento."),
  });

  function resetAddForm() {
    setAddName("");
    setAddDescription("");
    setAddCause("");
    setAddOrigin("NOT_SPECIFIED");
    setAddDepartmentId(null);

    setAddWhatWillBeDone("");
    setAddWhy("");
    setAddWho("");
    setAddStartDate("");
    setAddExpectedEndDate("");
    setAddWhere("");
    setAddHow("");
    setAddHowMuch("");
  
    setAddEffectivenessVerification("");
    setAddVerificationDate("");
    setAddVerificationResponsible("");
  }

  function handleAdd() {
    if (!addName.trim() || !effectiveYearId) return;
    createMutation.mutate({
      name: addName.trim(),
      description: addDescription.trim() || null,
      cause: addCause.trim() || null,
      origin: addOrigin,
      yearIds: [effectiveYearId],
      responsibleId: user?.id ?? null,
      departmentId: addDepartmentId,
      
      // Mapeamento dos novos campos 5W2H e eficácia
      whatWillBeDone: addWhatWillBeDone.trim() || null,
      why: addWhy.trim() || null,
      who: addWho.trim() || null,
      startDate: addStartDate || null,
      expectedEndDate: addExpectedEndDate || null,
      where: addWhere.trim() || null,
      how: addHow.trim() || null,
      howMuch: addHowMuch.trim() || null,
      effectivenessVerification: addEffectivenessVerification.trim() || null,
      verificationDate: addVerificationDate || null,
      verificationResponsible: addVerificationResponsible.trim() || null,
  });
  }

  function openEdit(nc: NonConformityResponse) {
    setEditId(nc.id);
    setEditName(nc.name);
    setEditDescription(nc.description ?? "");
    setEditCause(nc.cause ?? "");
    setEditOrigin(nc.origin);
    setEditDepartmentId(nc.department?.id ?? null);
    // Adiciona isto para carregar os novos campos:
    setEditWhatWillBeDone(nc.whatWillBeDone || "");
    setEditWhy(nc.why || "");
    setEditWho(nc.who || "");
    setEditStartDate(nc.startDate ? nc.startDate.split("T")[0] : ""); // Formata a data para o input HTML
    setEditExpectedEndDate(nc.expectedEndDate ? nc.expectedEndDate.split("T")[0] : "");
    setEditWhere(nc.where || "");
    setEditHow(nc.how || "");
    setEditHowMuch(nc.howMuch || "");
    
    setEditEffectivenessVerification(nc.effectivenessVerification || "");
    setEditVerificationDate(nc.verificationDate ? nc.verificationDate.split("T")[0] : "");
    setEditVerificationResponsible(nc.verificationResponsible || "");

    setEditDialogOpen(true);
  }

  function handleEdit() {
    if (!editId) return;
    updateMutation.mutate({
      id: editId,
      data: {
        name: editName.trim(),
        description: editDescription.trim() || null,
        cause: editCause.trim() || null,
        origin: editOrigin,
        departmentId: editDepartmentId,
        // Envia os dados editados do plano de ação
        whatWillBeDone: editWhatWillBeDone.trim() || null,
        why: editWhy.trim() || null,
        who: editWho.trim() || null,
        startDate: editStartDate || null,
        expectedEndDate: editExpectedEndDate || null,
        where: editWhere.trim() || null,
        how: editHow.trim() || null,
        howMuch: editHowMuch.trim() || null,
        effectivenessVerification: editEffectivenessVerification.trim() || null,
        verificationDate: editVerificationDate || null,
        verificationResponsible: editVerificationResponsible.trim() || null,
      },
    });
  }

  function openEditYear(nc: NonConformityResponse) {
    const ys = getCurrentYearStatus(nc, effectiveYearId!);
    setEditYearStatus(ys?.status ?? "OPEN");
    setEditYearEvaluation(ys?.evaluation ?? "");
    setEditYearEvalDescription(ys?.evaluationDescription ?? "");
    setEditYearDialogOpen(true);
  }

  function handleEditYear() {
    if (!selectedNC || !effectiveYearId) return;
    updateYearMutation.mutate({
      ncId: selectedNC.id,
      yearId: effectiveYearId,
      data: {
        status: editYearStatus,
        evaluation: editYearEvaluation.trim() || null,
        evaluationDescription: editYearEvalDescription.trim() || null,
      },
    });
  }

  const filtered = useMemo(() => {
    let list = nonConformities ?? [];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (nc) =>
          nc.name.toLowerCase().includes(q) ||
          (nc.description ?? "").toLowerCase().includes(q) ||
          nc.origin.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "ALL") {
      list = list.filter((nc) => {
        const ys = getCurrentYearStatus(nc, effectiveYearId!);
        return ys?.status === statusFilter;
      });
    }

    if (departmentFilter !== null) {
      list = list.filter((nc) => nc.department?.id === departmentFilter);
    }

    list = [...list].sort((a, b) => {
      if (sortMode === "status") {
        const sa = getCurrentYearStatus(a, effectiveYearId!)?.status ?? "OPEN";
        const sb = getCurrentYearStatus(b, effectiveYearId!)?.status ?? "OPEN";
        const order = ["OPEN", "UNDER_TREATMENT", "CLASSIFIED", "FINISHED"];
        return order.indexOf(sa) - order.indexOf(sb);
      }
      return sortMode === "oldest" ? a.id - b.id : b.id - a.id;
    });

    return list;
  }, [nonConformities, search, statusFilter, departmentFilter, sortMode, effectiveYearId]);

  return (
    <div className="py-8 w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-xl flex items-center justify-center shadow-sm">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Não Conformidades</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gestão de desvios, análise de causas e ações corretivas.
            </p>
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
            selectedYearId={effectiveYearId}
            onYearChange={(id) => {
              setSelectedYearId(id);
              setSelectedNC(null);
            }}
          />
          {!isExternal && (
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus size={18} />
              Registar NC
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: NC List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {filtered.length} Não Conformidade{filtered.length !== 1 ? "s" : ""}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const modes: SortMode[] = ["newest", "oldest", "status"];
                  setSortMode((prev) => modes[(modes.indexOf(prev) + 1) % modes.length]);
                }}
                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all text-xs"
                title={`Ordenar: ${sortMode === "newest" ? "Mais recentes" : sortMode === "oldest" ? "Mais antigos" : "Por estado"}`}
              >
                <ArrowUpDown size={14} />
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col max-h-[800px]">
            <div className="p-3 border-b border-border space-y-2 bg-muted/30">
              <div className="flex items-center gap-3">
                <Search size={16} className="text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  className="bg-transparent border-none focus:ring-0 text-sm w-full text-foreground outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {(["ALL", "OPEN", "UNDER_TREATMENT", "CLASSIFIED", "FINISHED"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                      statusFilter === s
                        ? s === "ALL"
                          ? "bg-primary text-primary-foreground"
                          : "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {s === "ALL" ? "Todas" : STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
              {departments && departments.length > 0 && (
                <Select
                  value={departmentFilter !== null ? String(departmentFilter) : "ALL"}
                  onValueChange={(v) => setDepartmentFilter(v === "ALL" ? null : Number(v))}
                >
                  <SelectTrigger className="h-8 text-xs font-bold">
                    <SelectValue placeholder="Todos os departamentos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos os departamentos</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="overflow-y-auto divide-y divide-border/50">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center">
                  <ShieldCheck size={40} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-bold text-muted-foreground">Nenhuma não conformidade</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nenhum desvio registado para este ano.
                  </p>
                </div>
              ) : (
                filtered.map((nc) => {
                  const yearStatus = getCurrentYearStatus(nc, effectiveYearId!);
                  return (
                    <div
                      key={nc.id}
                      onClick={() => setSelectedNC(nc)}
                      className={`p-4 hover:bg-muted/50 transition-all cursor-pointer group ${
                        selectedNC?.id === nc.id ? "bg-destructive/5 border-l-4 border-l-destructive pl-[13px]" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant={statusBadgeVariant(yearStatus?.status ?? "OPEN")}>
                          {STATUS_LABELS[yearStatus?.status ?? "OPEN"]}
                        </Badge>
                        <span className="text-xs font-medium text-muted-foreground opacity-50">
                          #{nc.id}
                        </span>
                      </div>
                      <h3 className="font-bold text-foreground text-sm leading-snug group-hover:text-destructive transition-colors line-clamp-2 mb-2">
                        {nc.name}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target size={12} />
                          {ORIGIN_LABELS[nc.origin]}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 size={12} className={nc.correctiveActions.length > 0 ? "text-emerald-500" : ""} />
                          {nc.correctiveActions.length} aç{nc.correctiveActions.length !== 1 ? "ões" : "ão"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Details */}
        <div className="lg:col-span-2">
          {selectedNC ? (
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              {/* Header section */}
              <div className="p-6 border-b border-border bg-muted/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <select
                      value={getCurrentYearStatus(selectedNC, effectiveYearId!)?.status ?? "OPEN"}
                      onChange={(e) => {
                        const newStatus = e.target.value as NonConformityStatus;
                        if (!selectedNC || !effectiveYearId) return;
                        updateYearMutation.mutate({
                          ncId: selectedNC.id,
                          yearId: effectiveYearId,
                          data: { status: newStatus },
                        });
                      }}
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border cursor-pointer transition-all outline-none ${
                        statusSelectClass(getCurrentYearStatus(selectedNC, effectiveYearId!)?.status ?? "OPEN")
                      }`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value} className="text-foreground bg-card">{s.label}</option>
                      ))}
                    </select>
                    <h2 className="text-xl font-bold text-foreground">{selectedNC.name}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isExternal && (
                        <div className="relative">
                          <button
                            id="nc-actions-toggle"
                            onClick={() => setActionsMenuOpen((prev) => !prev)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer"
                          >
                            <MoreVertical size={18} className="text-muted-foreground" />
                          </button>
                          {actionsMenuOpen && (
                            <div
                              id="nc-actions-menu"
                              className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 py-1 min-w-[160px]"
                            >
                              <button
                                onClick={() => {
                                  setActionsMenuOpen(false);
                                  openEdit(selectedNC);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left cursor-pointer"
                              >
                                <Pencil size={14} />
                                Editar
                              </button>
                              <button
                                onClick={() => {
                                  setActionsMenuOpen(false);
                                  if (selectedNC) {
                                    setNcAssociatedYearIds(new Set(selectedNC.years.map((y) => y.yearId)));
                                  }
                                  setYearAssociateDialogOpen(true);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left cursor-pointer"
                              >
                                <CalendarDays size={14} />
                                Gerir Anos
                              </button>
                              <div className="border-t border-border my-1" />
                              <button
                                onClick={() => {
                                  setActionsMenuOpen(false);
                                  setConfirmDeleteNC(true);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left cursor-pointer"
                              >
                                <Trash2 size={14} />
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Target size={14} className="text-muted-foreground" />
                    <span className="text-sm">
                      <span className="text-muted-foreground">Origem: </span>
                      <span className="font-medium text-foreground">{ORIGIN_LABELS[selectedNC.origin]}</span>
                    </span>
                  </div>
                  {selectedNC.responsible && (
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-muted-foreground" />
                      <span className="text-sm">
                        <span className="text-muted-foreground">Responsável: </span>
                        <span className="font-medium text-foreground">
                          {selectedNC.responsible.firstName} {selectedNC.responsible.lastName}
                        </span>
                      </span>
                    </div>
                  )}
                  {selectedNC.department && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        <span className="text-muted-foreground">Departamento: </span>
                        <span className="font-medium text-foreground">{selectedNC.department.name}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-8 max-h-[700px] overflow-y-auto">
                {/* Description & Cause */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Info size={14} />
                      Descrição
                    </h3>
                    <p className="text-sm text-foreground leading-relaxed bg-muted/50 p-4 rounded-xl border border-border">
                      {selectedNC.description || "Sem descrição."}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <ArrowRight size={14} className="text-destructive" />
                      Análise de Causa
                    </h3>
                    <p className="text-sm text-foreground leading-relaxed font-medium">
                      {selectedNC.cause || "Nenhuma análise de causa documentada."}
                    </p>
                  </div>
                </div>

{/* Corrective Actions */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      Ações Corretivas ({selectedNC.correctiveActions.length})
                    </h3>
                    {!isExternal && (
                    <Button size="sm" onClick={() => setCaDialogOpen(true)}>
                      <Plus size={14} />
                      Nova Ação
                    </Button>
                  )}
                  </div>

                  <div className="space-y-4">
                    {selectedNC.correctiveActions.map((ca) => (
<CorrectiveActionCard
                         key={ca.id}
                         ca={ca}
                         ncId={selectedNC.id}
                         onEdit={(data) =>
                           updateCAMutation.mutate({ ncId: selectedNC.id, actionId: ca.id, data })
                         }
                         onDelete={(actionId) => deleteCAMutation.mutate({ ncId: selectedNC.id, actionId })}
                         onUpload={(file) =>
                           uploadDocMutation.mutate({ ncId: selectedNC.id, actionId: ca.id, file })
                         }
                         onDeleteDoc={(documentId) =>
                           deleteDocMutation.mutate({ ncId: selectedNC.id, actionId: ca.id, documentId })
                         }
                         isExternal={isExternal}
                       />
                    ))}

                    {selectedNC.correctiveActions.length === 0 && (
                      <div className="py-10 bg-muted/30 border-2 border-dashed border-border rounded-2xl text-center">
                        <Zap size={32} className="mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm font-bold text-muted-foreground">
                          Nenhuma ação corretiva definida
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Uma não conformidade requer uma ação apropriada.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-6 border-b border-border bg-muted/10">
  <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
    <Target size={16} className="text-primary" />
    Plano de Ação (5W2H)
  </h3>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
    <div className="col-span-1 md:col-span-2 bg-background p-3 rounded-xl border border-border">
      <span className="text-xs font-semibold text-muted-foreground block mb-0.5">WHAT — O que será feito?</span>
      <p className="text-foreground font-medium">{selectedNC.whatWillBeDone || <span className="text-muted-foreground italic text-xs">Não definido</span>}</p>
    </div>

    <div className="col-span-1 md:col-span-2 bg-background p-3 rounded-xl border border-border">
      <span className="text-xs font-semibold text-muted-foreground block mb-0.5">WHY — Porquê?</span>
      <p className="text-foreground font-medium">{selectedNC.why || <span className="text-muted-foreground italic text-xs">Não definido</span>}</p>
    </div>

    <div className="bg-background p-3 rounded-xl border border-border">
      <span className="text-xs font-semibold text-muted-foreground block mb-0.5">WHO — Por quem?</span>
      <p className="text-foreground font-medium">{selectedNC.who || <span className="text-muted-foreground italic text-xs">Não definido</span>}</p>
    </div>

    <div className="bg-background p-3 rounded-xl border border-border">
      <span className="text-xs font-semibold text-muted-foreground block mb-0.5">WHERE — Onde?</span>
      <p className="text-foreground font-medium">{selectedNC.where || <span className="text-muted-foreground italic text-xs">Não definido</span>}</p>
    </div>

    <div className="bg-background p-3 rounded-xl border border-border">
      <span className="text-xs font-semibold text-muted-foreground block mb-0.5">WHEN — Início</span>
      <p className="text-foreground font-medium">{selectedNC.startDate ? new Date(selectedNC.startDate).toLocaleDateString('pt-PT') : <span className="text-muted-foreground italic text-xs">Não definido</span>}</p>
    </div>

    <div className="bg-background p-3 rounded-xl border border-border">
      <span className="text-xs font-semibold text-muted-foreground block mb-0.5">WHEN — Fim Previsto</span>
      <p className="text-foreground font-medium">{selectedNC.expectedEndDate ? new Date(selectedNC.expectedEndDate).toLocaleDateString('pt-PT') : <span className="text-muted-foreground italic text-xs">Não definido</span>}</p>
    </div>

    <div className="bg-background p-3 rounded-xl border border-border">
      <span className="text-xs font-semibold text-muted-foreground block mb-0.5">HOW — Como?</span>
      <p className="text-foreground font-medium">{selectedNC.how || <span className="text-muted-foreground italic text-xs">Não definido</span>}</p>
    </div>

    <div className="bg-background p-3 rounded-xl border border-border">
      <span className="text-xs font-semibold text-muted-foreground block mb-0.5">HOW MUCH — Quanto?</span>
      <p className="text-foreground font-medium">{selectedNC.howMuch || <span className="text-muted-foreground italic text-xs">Não definido</span>}</p>
    </div>
  </div>
</div>

{/* --- NOVA SECÇÃO: VERIFICAÇÃO DE EFICÁCIA --- */}
<div className="p-6 border-b border-border bg-muted/5">
  <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
    <CheckCircle2 size={16} className="text-success" />
    Verificação da Eficácia
  </h3>
  
  <div className="space-y-4 text-sm">
    <div className="bg-background p-3 rounded-xl border border-border">
      <span className="text-xs font-semibold text-muted-foreground block mb-0.5">Evidências objetivas da eficácia das ações tomadas</span>
      <p className="text-foreground font-medium whitespace-pre-wrap">{selectedNC.effectivenessVerification || <span className="text-muted-foreground italic text-xs">Nenhuma evidência registada até ao momento.</span>}</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-background p-3 rounded-xl border border-border">
        <span className="text-xs font-semibold text-muted-foreground block mb-0.5">Data de Verificação</span>
        <p className="text-foreground font-medium">{selectedNC.verificationDate ? new Date(selectedNC.verificationDate).toLocaleDateString('pt-PT') : <span className="text-muted-foreground italic text-xs">Não verificada</span>}</p>
      </div>

      <div className="bg-background p-3 rounded-xl border border-border">
        <span className="text-xs font-semibold text-muted-foreground block mb-0.5">Responsável pela Verificação</span>
        <p className="text-foreground font-medium">{selectedNC.verificationResponsible || <span className="text-muted-foreground italic text-xs">Não atribuído</span>}</p>
      </div>
    </div>
  </div>
</div>


                {/* Evaluation & Status */}
                {(() => {
                  const ys = getCurrentYearStatus(selectedNC, effectiveYearId!);
                  if (!ys) return null;
                  return (
                    <div className="bg-muted/30 p-5 rounded-xl border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Avaliação Pós-Análise
                        </h3>
                        {!isExternal && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => openEditYear(selectedNC)}
                        >
                          <Pencil size={12} />
                          Editar
                        </Button>
                      )}
                      </div>
                      {ys.evaluation && (
                        <Badge variant="secondary" className="mb-2">{ys.evaluation}</Badge>
                      )}
                      {ys.evaluationDescription && (
                        <p className="text-sm text-foreground leading-relaxed mt-2">
                          {ys.evaluationDescription}
                        </p>
                      )}
                      {!ys.evaluation && !ys.evaluationDescription && (
                        <p className="text-sm text-muted-foreground italic">
                          Nenhuma avaliação registada.
                        </p>
                      )}
                    </div>
                  );
                })()}

              </div>
            </div>
          ) : (
            <div className="bg-card border-2 border-dashed border-border rounded-2xl h-full flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={36} className="text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Gestão de Não Conformidades</h2>
              <p className="text-muted-foreground text-sm mt-2 max-w-md">
                Selecione uma não conformidade para ver os detalhes ou registe uma nova ocorrência.
              </p>
              {!isExternal && (
                <Button className="mt-6" onClick={() => setAddDialogOpen(true)}>
                  <Plus size={18} />
                  Registar NC
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add NC Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
  <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <AlertTriangle className="text-destructive" size={20} />
        Registar Não Conformidade
      </DialogTitle>
      <DialogDescription>
        Preencha os dados do desvio e o respetivo plano de ação (5W2H).
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-6">
      {/* SECÇÃO 1: Dados Gerais da Ocorrência */}
      <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">1. Dados da Ocorrência</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 col-span-2">
            <Label>Nome / Título</Label>
            <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Ex: Desvio no processo..." />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Origem</Label>
            <select className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground" value={addOrigin} onChange={(e) => setAddOrigin(e.target.value as NonConformityOrigin)}>
              {ORIGIN_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Departamento</Label>
            <Select value={addDepartmentId?.toString() ?? "none"} onValueChange={(v) => setAddDepartmentId(v === "none" ? null : Number(v))}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {departments?.map((d) => (<SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <Label>Descrição do Problema</Label>
            <textarea className="w-full h-20 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={addDescription} onChange={(e) => setAddDescription(e.target.value)} placeholder="Detalhes do que aconteceu..." />
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <Label>Análise de Causa (inicial)</Label>
            <textarea className="w-full h-16 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={addCause} onChange={(e) => setAddCause(e.target.value)} />
          </div>
        </div>
      </div>

      {/* SECÇÃO 2: Plano de Ação (5W2H) */}
      <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">2. Plano de Ação (5W2H)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 col-span-2">
            <Label>WHAT — O que será feito?</Label>
            <Input value={addWhatWillBeDone} onChange={(e) => setAddWhatWillBeDone(e.target.value)} placeholder="Ação corretiva a implementar" />
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <Label>WHY — Porquê?</Label>
            <Input value={addWhy} onChange={(e) => setAddWhy(e.target.value)} placeholder="Motivo/Objetivo da ação" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>WHO — Por quem?</Label>
            <Input value={addWho} onChange={(e) => setAddWho(e.target.value)} placeholder="Responsável pela execução" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>WHERE — Onde?</Label>
            <Input value={addWhere} onChange={(e) => setAddWhere(e.target.value)} placeholder="Local ou setor de aplicação" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>WHEN — Quando (Início)?</Label>
            <Input type="date" value={addStartDate} onChange={(e) => setAddStartDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>WHEN — Fim Previsto</Label>
            <Input type="date" value={addExpectedEndDate} onChange={(e) => setAddExpectedEndDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>HOW — Como?</Label>
            <Input value={addHow} onChange={(e) => setAddHow(e.target.value)} placeholder="Método ou passos da execução" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>HOW MUCH — Quanto custa?</Label>
            <Input value={addHowMuch} onChange={(e) => setAddHowMuch(e.target.value)} placeholder="Custo estimado (Ex: 0€ ou 500€)" />
          </div>
        </div>
      </div>

      {/* SECÇÃO 3: Verificação de Eficácia */}
      <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">3. Verificação da Eficácia</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 col-span-2">
            <Label>Evidências objetivas da eficácia das ações tomadas</Label>
            <textarea className="w-full h-16 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={addEffectivenessVerification} onChange={(e) => setAddEffectivenessVerification(e.target.value)} placeholder="Resultados observados, auditorias, testes..." />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Data de Verificação</Label>
            <Input type="date" value={addVerificationDate} onChange={(e) => setAddVerificationDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Responsável pela Verificação</Label>
            <Input value={addVerificationResponsible} onChange={(e) => setAddVerificationResponsible(e.target.value)} placeholder="Nome do auditor/responsável" />
          </div>
        </div>
      </div>
    </div>

    <DialogFooter className="mt-6">
      <DialogClose asChild>
        <Button variant="outline">Cancelar</Button>
      </DialogClose>
      <Button onClick={handleAdd} disabled={!addName.trim() || createMutation.isPending}>
        Registar
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* Edit NC Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
  <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Pencil className="text-primary" size={20} />
        Editar Não Conformidade
      </DialogTitle>
      <DialogDescription>
        Modifique os dados da ocorrência ou atualize o plano de ação correspondente.
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-6">
      {/* SECÇÃO 1: Dados Gerais da Ocorrência - EDIÇÃO */}
      <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">1. Dados da Ocorrência</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 col-span-2">
            <Label>Nome / Título</Label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Ex: Desvio no processo..." />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Origem</Label>
            <select className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground outline-none" value={editOrigin} onChange={(e) => setEditOrigin(e.target.value as NonConformityOrigin)}>
              {ORIGIN_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Departamento</Label>
            <Select value={editDepartmentId?.toString() ?? "none"} onValueChange={(v) => setEditDepartmentId(v === "none" ? null : Number(v))}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {departments?.map((d) => (<SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <Label>Descrição do Problema</Label>
            <textarea className="w-full h-20 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Detalhes do que aconteceu..." />
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <Label>Análise de Causa (inicial)</Label>
            <textarea className="w-full h-16 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={editCause} onChange={(e) => setEditCause(e.target.value)} />
          </div>
        </div>
      </div>

      {/* SECÇÃO 2: Plano de Ação (5W2H) - EDIÇÃO */}
      <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">2. Plano de Ação (5W2H)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 col-span-2">
            <Label>WHAT — O que será feito?</Label>
            <Input value={editWhatWillBeDone} onChange={(e) => setEditWhatWillBeDone(e.target.value)} placeholder="Ação corretiva a implementar" />
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <Label>WHY — Porquê?</Label>
            <Input value={editWhy} onChange={(e) => setEditWhy(e.target.value)} placeholder="Motivo/Objetivo da ação" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>WHO — Por quem?</Label>
            <Input value={editWho} onChange={(e) => setEditWho(e.target.value)} placeholder="Responsável pela execução" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>WHERE — Onde?</Label>
            <Input value={editWhere} onChange={(e) => setEditWhere(e.target.value)} placeholder="Local ou setor de aplicação" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>WHEN — Quando (Início)?</Label>
            <Input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>WHEN — Fim Previsto</Label>
            <Input type="date" value={editExpectedEndDate} onChange={(e) => setEditExpectedEndDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>HOW — Como?</Label>
            <Input value={editHow} onChange={(e) => setEditHow(e.target.value)} placeholder="Método ou passos da execução" />
          </div>
          <div className="flex flex-col gap-1.5">
              <Label>HOW Much — Quanto?</Label>
            <Input value={editHowMuch} onChange={(e) => setEditHowMuch(e.target.value)} placeholder="Custo estimado" />
          </div>
        </div>
      </div>

      {/* SECÇÃO 3: Verificação de Eficácia - EDIÇÃO */}
      <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">3. Verificação da Eficácia</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 col-span-2">
            <Label>Evidências objetivas da eficácia das ações tomadas</Label>
            <textarea className="w-full h-16 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={editEffectivenessVerification} onChange={(e) => setEditEffectivenessVerification(e.target.value)} placeholder="Resultados observados, auditorias, testes..." />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Data de Verificação</Label>
            <Input type="date" value={editVerificationDate} onChange={(e) => setEditVerificationDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Responsável pela Verificação</Label>
            <Input value={editVerificationResponsible} onChange={(e) => setEditVerificationResponsible(e.target.value)} placeholder="Nome do auditor/responsável" />
          </div>
        </div>
      </div>
    </div>

    <DialogFooter className="mt-6">
      <DialogClose asChild>
        <Button variant="outline">Cancelar</Button>
      </DialogClose>
      <Button onClick={handleEdit} disabled={!editName.trim() || updateMutation.isPending}>
        Guardar Alterações
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* Edit NC Year (Status + Evaluation) Dialog */}
      <Dialog open={editYearDialogOpen} onOpenChange={setEditYearDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 size={20} />
              Estado e Avaliação
            </DialogTitle>
            <DialogDescription>
              Atualize o estado e a avaliação desta não conformidade.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label>Estado</Label>
              <select
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground"
                value={editYearStatus}
                onChange={(e) => setEditYearStatus(e.target.value as NonConformityStatus)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Avaliação</Label>
              <Input
                value={editYearEvaluation}
                onChange={(e) => setEditYearEvaluation(e.target.value)}
                placeholder="Ex: Crítica, Menor, Grave..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Descrição da Avaliação</Label>
              <textarea
                className="w-full h-24 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={editYearEvalDescription}
                onChange={(e) => setEditYearEvalDescription(e.target.value)}
                placeholder="Descreva o impacto e as consequências..."
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleEditYear} disabled={updateYearMutation.isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Year Association Dialog */}
      <YearAssociationDialog
        open={yearAssociateDialogOpen}
        onOpenChange={setYearAssociateDialogOpen}
        title="Gerir Anos"
        description="Selecione os anos em que esta não conformidade deve estar presente."
        allYears={years ?? []}
        associatedYearIds={ncAssociatedYearIds}
        currentYearId={effectiveYearId}
        onAssociate={(yearId) => {
          if (selectedNC) {
            associateYearsMutation.mutate({
              ncId: selectedNC.id,
              associateYearIds: [yearId],
              disassociateYearIds: [],
            });
          }
        }}
        onDisassociate={(yearId) => {
          if (selectedNC) {
            associateYearsMutation.mutate({
              ncId: selectedNC.id,
              associateYearIds: [],
              disassociateYearIds: [yearId],
            });
          }
        }}
        isPending={associateYearsMutation.isPending}
      />

      {/* Delete NC Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDeleteNC}
        onOpenChange={setConfirmDeleteNC}
        title="Eliminar Não Conformidade"
        description="Tem a certeza que deseja eliminar esta não conformidade?"
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (selectedNC) deleteMutation.mutate(selectedNC.id);
        }}
      />

      {/* Add CA Dialog */}
      <Dialog open={caDialogOpen} onOpenChange={setCaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="text-emerald-500" size={20} />
              Nova Ação Corretiva
            </DialogTitle>
            <DialogDescription>
              Defina uma ação para tratar a não conformidade.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label>Título da Ação</Label>
              <Input
                value={caName}
                onChange={(e) => setCaName(e.target.value)}
                placeholder="Ex: Recalibrar equipamento"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Descrição / Tarefa</Label>
              <textarea
                className="w-full h-24 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={caDescription}
                onChange={(e) => setCaDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={() => {
                if (!selectedNC) return;
                createCAMutation.mutate({
                  ncId: selectedNC.id,
                  data: { name: caName.trim(), description: caDescription.trim() || null },
                });
              }}
              disabled={!caName.trim() || createCAMutation.isPending}
            >
              Registar Ação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LogDialog
        open={pageLogOpen}
        onOpenChange={setPageLogOpen}
        entityTypes={["NON_CONFORMITY", "CORRECTIVE_ACTION"] as EntityType[]}
        yearId={effectiveYearId ?? undefined}
        title="Histórico — Não Conformidades"
      />
    </div>
  );
}

/* ─── Corrective Action Card ─── */

function CorrectiveActionCard({
  ca,
  ncId,
  onEdit,
  onDelete,
  onUpload,
  onDeleteDoc,
  isExternal,
}: {
  ca: CorrectiveActionResponse;
  ncId: number;
  onEdit: (data: { name?: string; description?: string | null; status?: CorrectiveActionStatus; progressDescription?: string | null }) => void;
  onDelete: (actionId: number) => void;
  onUpload: (file: File) => void;
  onDeleteDoc: (documentId: number) => void;
  isExternal: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(ca.name);
  const [editDescription, setEditDescription] = useState(ca.description ?? "");
  const [editStatus, setEditStatus] = useState(ca.status);
  const [editProgress, setEditProgress] = useState(ca.progressDescription ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  function handleSave() {
    onEdit({
      name: editName.trim(),
      description: editDescription.trim() || null,
      status: editStatus,
      progressDescription: editProgress.trim() || null,
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="border border-border rounded-xl p-5 bg-card shadow-sm">
        <h4 className="font-bold text-foreground mb-4">Editar Ação Corretiva</h4>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <div>
            <Label>Descrição</Label>
            <textarea
              className="w-full h-20 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Estado</Label>
              <select
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as CorrectiveActionStatus)}
              >
                {CA_STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Progresso</Label>
              <Input
                value={editProgress}
                onChange={(e) => setEditProgress(e.target.value)}
                placeholder="Descrição do progresso..."
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={handleSave}>Guardar</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl p-5 bg-card shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold text-sm">
            {ca.name.charAt(0)}
          </div>
          <div>
            <h4 className="font-bold text-foreground">{ca.name}</h4>
            {ca.responsible && (
              <p className="text-xs text-muted-foreground">
                Responsável: {ca.responsible.firstName} {ca.responsible.lastName}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={ca.status}
            onChange={(e) => {
              onEdit({ status: e.target.value as CorrectiveActionStatus });
            }}
            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border cursor-pointer transition-all outline-none ${caStatusSelectClass(ca.status)}`}
          >
            {CA_STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value} className="text-foreground bg-card">{s.label}</option>
            ))}
          </select>
          <div className="relative" ref={menuRef}>
            {!isExternal && (
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors cursor-pointer"
            >
              <MoreVertical size={14} className="text-muted-foreground" />
            </button>
          )}
            {menuOpen && !isExternal && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 py-1 min-w-[140px]">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setEditName(ca.name);
                    setEditDescription(ca.description ?? "");
                    setEditStatus(ca.status);
                    setEditProgress(ca.progressDescription ?? "");
                    setEditing(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left cursor-pointer"
                >
                  <Pencil size={13} />
                  Editar
                </button>
                <div className="border-t border-border my-1" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left cursor-pointer"
                >
                  <Trash2 size={13} />
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {ca.description && (
        <p className="text-sm text-muted-foreground mb-4 border-l-2 border-primary/20 pl-4">
          {ca.description}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
        <div>
          <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Progresso
          </h5>
          <p className="text-sm text-foreground">
            {ca.progressDescription || "Fase inicial de implementação."}
          </p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Documentos
            </h5>
            <label className="text-xs font-bold text-primary hover:underline cursor-pointer">
              + Upload
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUpload(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <div className="space-y-1.5">
            {ca.documents.map((doc) => {
              const latest = doc.versions?.[doc.versions.length - 1];
              return (
                <div
                  key={doc.documentId}
                  className="flex items-center justify-between p-2 bg-muted rounded-lg border border-border group/doc"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText size={14} className="text-primary shrink-0" />
                    <span className="text-xs font-medium text-foreground truncate">
                      {latest?.fileName ?? "Documento"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover/doc:opacity-100 transition-all shrink-0">
                    {latest && (
                      <button
                        onClick={async () => {
                          const { downloadDocumentVersion } = await import("@/api/core");
                          await downloadDocumentVersion(latest.versionId, latest.fileName);
                        }}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Download size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteDoc(doc.documentId)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
            {ca.documents.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2 border border-dashed border-border rounded-lg">
                Nenhum documento
              </p>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar Ação Corretiva"
        description="Tem a certeza que deseja eliminar esta ação corretiva?"
        confirmLabel="Eliminar"
        onConfirm={() => onDelete(ca.id)}
      />
    </div>
  );
}
