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
  Lightbulb,
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
  getImprovementOpportunitiesByYear,
  createImprovementOpportunity,
  updateImprovementOpportunity,
  deleteImprovementOpportunity,
  createImprovementAction,
  updateImprovementAction,
  deleteImprovementAction,
  uploadImprovementActionDocument,
  deleteImprovementActionDocument,
  updateImprovementOpportunityYear,
  associateImprovementOpportunityYears,
  getDepartments,
} from "@/api/core";
import { LogDialog } from "@/components/log-dialog";
import { YearSelector } from "@/components/year-selector";
import YearAssociationDialog from "@/components/year-association-dialog";
import ConfirmDialog from "@/components/confirm-dialog";
import type {
  ImprovementOpportunityResponse,
  ImprovementOpportunityYearResponse,
  ImprovementActionResponse,
  ImprovementOpportunityOrigin,
  ImprovementOpportunityStatus,
  ImprovementActionStatus,
  EntityType,
  DepartmentResponse,
} from "@/types";

const ORIGIN_LABELS: Record<ImprovementOpportunityOrigin, string> = {
  SUGGESTION: "Sugestão",
  COMPLAINT: "Reclamação",
  INTERNAL_AUDIT: "Auditoria Interna",
  EXTERNAL_AUDIT: "Auditoria Externa",
  MANAGEMENT_REVIEW: "Revisão pela Gestão",
  OTHER: "Outro",
};

const ORIGIN_OPTIONS: { value: ImprovementOpportunityOrigin; label: string }[] = [
  { value: "SUGGESTION", label: "Sugestão" },
  { value: "COMPLAINT", label: "Reclamação" },
  { value: "INTERNAL_AUDIT", label: "Auditoria Interna" },
  { value: "EXTERNAL_AUDIT", label: "Auditoria Externa" },
  { value: "MANAGEMENT_REVIEW", label: "Revisão pela Gestão" },
  { value: "OTHER", label: "Outro" },
];

const STATUS_LABELS: Record<ImprovementOpportunityStatus, string> = {
  OPEN: "Aberta",
  UNDER_TREATMENT: "Em Tratamento",
  FINISHED: "Concluída",
  CLASSIFIED: "Classificada",
};

const STATUS_OPTIONS: { value: ImprovementOpportunityStatus; label: string }[] = [
  { value: "OPEN", label: "Aberta" },
  { value: "UNDER_TREATMENT", label: "Em Tratamento" },
  { value: "CLASSIFIED", label: "Classificada" },
  { value: "FINISHED", label: "Concluída" },
];

const IA_STATUS_LABELS: Record<ImprovementActionStatus, string> = {
  REGISTERED: "Registada",
  IN_PROGRESS: "Em Progresso",
  FINISHED: "Concluída",
};

const IA_STATUS_OPTIONS: { value: ImprovementActionStatus; label: string }[] = [
  { value: "REGISTERED", label: "Registada" },
  { value: "IN_PROGRESS", label: "Em Progresso" },
  { value: "FINISHED", label: "Concluída" },
];

type FilterStatus = "ALL" | ImprovementOpportunityStatus;
type SortMode = "newest" | "oldest" | "status";

function statusBadgeVariant(status: ImprovementOpportunityStatus) {
  switch (status) {
    case "OPEN": return "destructive" as const;
    case "UNDER_TREATMENT": return "default" as const;
    case "FINISHED": return "outline" as const;
    case "CLASSIFIED": return "secondary" as const;
  }
}

function statusSelectClass(status: ImprovementOpportunityStatus) {
  switch (status) {
    case "OPEN": return "bg-destructive/10 text-destructive border-destructive/30";
    case "UNDER_TREATMENT": return "bg-primary/10 text-primary border-primary/30";
    case "CLASSIFIED": return "bg-secondary/10 text-secondary-foreground border-secondary/30";
    case "FINISHED": return "bg-muted text-muted-foreground border-border";
  }
}

function iaStatusSelectClass(status: ImprovementActionStatus) {
  switch (status) {
    case "REGISTERED": return "bg-secondary/10 text-secondary-foreground border-secondary/30";
    case "IN_PROGRESS": return "bg-primary/10 text-primary border-primary/30";
    case "FINISHED": return "bg-muted text-muted-foreground border-border";
  }
}

function iaStatusBadgeVariant(status: ImprovementActionStatus) {
  switch (status) {
    case "REGISTERED": return "secondary" as const;
    case "IN_PROGRESS": return "default" as const;
    case "FINISHED": return "outline" as const;
  }
}

function getCurrentYearStatus(io: ImprovementOpportunityResponse, yearId: number): ImprovementOpportunityYearResponse | undefined {
  return io.years.find((y) => y.yearId === yearId);
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["improvement-opportunities"] });
}

export default function ImprovementOpportunitiesPage() {
  const queryClient = useQueryClient();
  const { user, isExternal } = useAuth();

  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [selectedIO, setSelectedIO] = useState<ImprovementOpportunityResponse | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [departmentFilter, setDepartmentFilter] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addCause, setAddCause] = useState("");
  const [addOrigin, setAddOrigin] = useState<ImprovementOpportunityOrigin>("SUGGESTION");
  const [addDepartmentId, setAddDepartmentId] = useState<number | null>(null);

  const [addWhatWillBeDone, setAddWhatWillBeDone] = useState("");
  const [addWhy, setAddWhy] = useState("");
  const [addWho, setAddWho] = useState("");
  const [addWhere, setAddWhere] = useState("");
  const [addStartDate, setAddStartDate] = useState("");
  const [addExpectedEndDate, setAddExpectedEndDate] = useState("");
  const [addHow, setAddHow] = useState("");
  const [addHowMuch, setAddHowMuch] = useState("");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCause, setEditCause] = useState("");
  const [editOrigin, setEditOrigin] = useState<ImprovementOpportunityOrigin>("SUGGESTION");
  const [editDepartmentId, setEditDepartmentId] = useState<number | null>(null);

  const [editYearDialogOpen, setEditYearDialogOpen] = useState(false);
  const [editYearStatus, setEditYearStatus] = useState<ImprovementOpportunityStatus>("OPEN");
  const [editYearEvaluation, setEditYearEvaluation] = useState("");
  const [editYearEvalDescription, setEditYearEvalDescription] = useState("");

  const [editWhatWillBeDone, setEditWhatWillBeDone] = useState("");
  const [editWhy, setEditWhy] = useState("");
  const [editWho, setEditWho] = useState("");
  const [editWhere, setEditWhere] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editExpectedEndDate, setEditExpectedEndDate] = useState("");
  const [editHow, setEditHow] = useState("");
  const [editHowMuch, setEditHowMuch] = useState("");
  const [editEffectivenessVerification, setEditEffectivenessVerification] = useState("");
  const [editVerificationDate, setEditVerificationDate] = useState("");
  const [editVerificationResponsible, setEditVerificationResponsible] = useState("");

  const [yearAssociateDialogOpen, setYearAssociateDialogOpen] = useState(false);
  const [ioAssociatedYearIds, setIoAssociatedYearIds] = useState<Set<number>>(new Set());
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);

  const [confirmDeleteIO, setConfirmDeleteIO] = useState(false);
  const [pageLogOpen, setPageLogOpen] = useState(false);

  const [iaDialogOpen, setIaDialogOpen] = useState(false);
  const [iaName, setIaName] = useState("");
  const [iaDescription, setIaDescription] = useState("");

  const [editIaDialogOpen, setEditIaDialogOpen] = useState(false);
  const [editIaId, setEditIaId] = useState<number | null>(null);
  const [editIaName, setEditIaName] = useState("");
  const [editIaDescription, setEditIaDescription] = useState("");
  const [editIaStatus, setEditIaStatus] = useState<ImprovementActionStatus>("REGISTERED");
  const [editIaProgress, setEditIaProgress] = useState("");

  const { data: years } = useQuery({ queryKey: ["years"], queryFn: getYears });
  const { data: departments } = useQuery({ queryKey: ["departments"], queryFn: getDepartments });
  const effectiveYearId = selectedYearId;

  useEffect(() => {
    if (selectedYearId !== null) return;
    if (!years || years.length === 0) return;
    const currentYearVal = new Date().getFullYear();
    const match = years.find(y => y.year === currentYearVal) ?? years[0];
    setSelectedYearId(match.id);
  }, [selectedYearId, years]);

  const { data: improvementOpportunities, isLoading } = useQuery({
    queryKey: ["improvement-opportunities", effectiveYearId],
    queryFn: () => getImprovementOpportunitiesByYear(effectiveYearId!),
    enabled: effectiveYearId !== null,
  });

  /* Close actions menu when clicking outside */
  useEffect(() => {
    if (!actionsMenuOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("#io-actions-menu") && !target.closest("#io-actions-toggle")) {
        setActionsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [actionsMenuOpen]);

  /* Sync selectedIO with latest query data so detail panel updates after mutations */
  useEffect(() => {
    if (selectedIO && improvementOpportunities) {
      const updated = improvementOpportunities.find((io) => io.id === selectedIO.id);
      if (updated) setSelectedIO(updated);
    }
  }, [improvementOpportunities]);

  const createMutation = useMutation({
    mutationFn: createImprovementOpportunity,
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Oportunidade de melhoria registada com sucesso.");
      setAddDialogOpen(false);
      resetAddForm();
    },
    onError: (err) => {
      console.error("Create IO error:", err);
      toast.error("Erro ao registar oportunidade de melhoria.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateImprovementOpportunity>[1] }) =>
      updateImprovementOpportunity(id, data),
    onSuccess: (updated) => {
      invalidateAll(queryClient);
      toast.success("Oportunidade de melhoria atualizada.");
      setEditDialogOpen(false);
      setSelectedIO(updated);
    },
    onError: () => toast.error("Erro ao atualizar oportunidade de melhoria."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteImprovementOpportunity,
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Oportunidade de melhoria eliminada.");
      setSelectedIO(null);
    },
    onError: () => toast.error("Erro ao eliminar oportunidade de melhoria."),
  });

  const updateYearMutation = useMutation({
    mutationFn: ({
      ioId, yearId, data,
    }: { ioId: number; yearId: number; data: Parameters<typeof updateImprovementOpportunityYear>[2] }) =>
      updateImprovementOpportunityYear(ioId, yearId, data),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Estado da oportunidade de melhoria atualizado.");
      setEditYearDialogOpen(false);
    },
    onError: () => toast.error("Erro ao atualizar estado."),
  });

  const associateYearsMutation = useMutation({
    mutationFn: ({ ioId, associateYearIds, disassociateYearIds }: { ioId: number; associateYearIds: number[]; disassociateYearIds: number[] }) =>
      associateImprovementOpportunityYears(ioId, associateYearIds, disassociateYearIds),
    onSuccess: (_data, variables) => {
      invalidateAll(queryClient);
      toast.success("Anos atualizados com sucesso.");
      setIoAssociatedYearIds((prev) => {
        const next = new Set(prev);
        variables.associateYearIds.forEach((yid) => next.add(yid));
        variables.disassociateYearIds.forEach((yid) => next.delete(yid));
        return next;
      });
    },
    onError: () => toast.error("Erro ao associar anos."),
  });

  const createIAMutation = useMutation({
    mutationFn: ({ ioId, data }: { ioId: number; data: Parameters<typeof createImprovementAction>[1] }) =>
      createImprovementAction(ioId, data),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Ação de melhoria registada.");
      setIaDialogOpen(false);
      setIaName("");
      setIaDescription("");
    },
    onError: () => toast.error("Erro ao registar ação de melhoria."),
  });

  const updateIAMutation = useMutation({
    mutationFn: ({
      ioId, actionId, data,
    }: { ioId: number; actionId: number; data: Parameters<typeof updateImprovementAction>[2] }) =>
      updateImprovementAction(ioId, actionId, data),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Ação de melhoria atualizada.");
      setEditIaDialogOpen(false);
    },
    onError: () => toast.error("Erro ao atualizar ação de melhoria."),
  });

  const deleteIAMutation = useMutation({
    mutationFn: ({ ioId, actionId }: { ioId: number; actionId: number }) =>
      deleteImprovementAction(ioId, actionId),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Ação de melhoria eliminada.");
    },
    onError: () => toast.error("Erro ao eliminar ação de melhoria."),
  });

  const uploadDocMutation = useMutation({
    mutationFn: ({ ioId, actionId, file }: { ioId: number; actionId: number; file: File }) =>
      uploadImprovementActionDocument(ioId, actionId, file, user!.id),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Documento carregado.");
    },
    onError: () => toast.error("Erro ao carregar documento."),
  });

  const deleteDocMutation = useMutation({
    mutationFn: ({ ioId, actionId, documentId }: { ioId: number; actionId: number; documentId: number }) =>
      deleteImprovementActionDocument(ioId, actionId, documentId),
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
    setAddOrigin("SUGGESTION");
    setAddDepartmentId(null);
    setAddWhatWillBeDone("");
    setAddWhy("");
    setAddWho("");
    setAddWhere("");
    setAddStartDate("");
    setAddExpectedEndDate("");
    setAddHow("");
    setAddHowMuch("");
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

      whatWillBeDone: addWhatWillBeDone.trim() || null,
      why: addWhy.trim() || null,
      who: addWho.trim() || null,
      where: addWhere.trim() || null,
      startDate: addStartDate || null,
      expectedEndDate: addExpectedEndDate || null,
      how: addHow.trim() || null,
      howMuch: addHowMuch.trim() || null,
    });
  }

  function openEdit(io: ImprovementOpportunityResponse) {
    setEditId(io.id);
    setEditName(io.name);
    setEditDescription(io.description ?? "");
    setEditCause(io.cause ?? "");
    setEditOrigin(io.origin);
    setEditDepartmentId(io.department?.id ?? null);
    setEditDialogOpen(true);

    setEditWhatWillBeDone(io.whatWillBeDone ?? "");
    setEditWhy(io.why ?? "");
    setEditWho(io.who ?? "");
    setEditWhere(io.where ?? "");
    setEditStartDate(io.startDate ?? "");
    setEditExpectedEndDate(io.expectedEndDate ?? "");
    setEditHow(io.how ?? "");
    setEditHowMuch(io.howMuch ?? "");
    setEditEffectivenessVerification(io.effectivenessVerification ?? "");
    setEditVerificationDate(io.verificationDate ?? "");
    setEditVerificationResponsible(io.verificationResponsible ?? "");
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

        whatWillBeDone: editWhatWillBeDone.trim() || null,
        why: editWhy.trim() || null,
        who: editWho.trim() || null,
        where: editWhere.trim() || null,
        startDate: editStartDate || null,
        expectedEndDate: editExpectedEndDate || null,
        how: editHow.trim() || null,
        howMuch: editHowMuch.trim() || null,
        effectivenessVerification: editEffectivenessVerification.trim() || null,
        verificationDate: editVerificationDate || null,
        verificationResponsible: editVerificationResponsible.trim() || null,
      },
    });
  }

  function openEditYear(io: ImprovementOpportunityResponse) {
    const ys = getCurrentYearStatus(io, effectiveYearId!);
    setEditYearStatus(ys?.status ?? "OPEN");
    setEditYearEvaluation(ys?.evaluation ?? "");
    setEditYearEvalDescription(ys?.evaluationDescription ?? "");
    setEditYearDialogOpen(true);
  }

  function handleEditYear() {
    if (!selectedIO || !effectiveYearId) return;
    updateYearMutation.mutate({
      ioId: selectedIO.id,
      yearId: effectiveYearId,
      data: {
        status: editYearStatus,
        evaluation: editYearEvaluation.trim() || null,
        evaluationDescription: editYearEvalDescription.trim() || null,
      },
    });
  }

  const filtered = useMemo(() => {
    let list = improvementOpportunities ?? [];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (io) =>
          io.name.toLowerCase().includes(q) ||
          (io.description ?? "").toLowerCase().includes(q) ||
          io.origin.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "ALL") {
      list = list.filter((io) => {
        const ys = getCurrentYearStatus(io, effectiveYearId!);
        return ys?.status === statusFilter;
      });
    }

    if (departmentFilter !== null) {
      list = list.filter((io) => io.department?.id === departmentFilter);
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
  }, [improvementOpportunities, search, statusFilter, departmentFilter, sortMode, effectiveYearId]);

  return (
    <div className="py-8 w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-sm">
            <Lightbulb size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Oportunidades de Melhoria</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Registo e acompanhamento de oportunidades de melhoria.
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
              setSelectedIO(null);
            }}
          />
          {!isExternal && (
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus size={18} />
              Registar OM
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: IO List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {filtered.length} Oportunidade{filtered.length !== 1 ? "s" : ""} de Melhoria
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
                  <p className="text-sm font-bold text-muted-foreground">Nenhuma oportunidade de melhoria</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nenhuma oportunidade de melhoria registada para este ano.
                  </p>
                </div>
              ) : (
                filtered.map((io) => {
                  const yearStatus = getCurrentYearStatus(io, effectiveYearId!);
                  return (
                    <div
                      key={io.id}
                      onClick={() => setSelectedIO(io)}
                      className={`p-4 hover:bg-muted/50 transition-all cursor-pointer group ${
                        selectedIO?.id === io.id ? "bg-primary/5 border-l-4 border-l-primary pl-[13px]" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant={statusBadgeVariant(yearStatus?.status ?? "OPEN")}>
                          {STATUS_LABELS[yearStatus?.status ?? "OPEN"]}
                        </Badge>
                        <span className="text-xs font-medium text-muted-foreground opacity-50">
                          #{io.id}
                        </span>
                      </div>
                      <h3 className="font-bold text-foreground text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-2">
                        {io.name}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target size={12} />
                          {ORIGIN_LABELS[io.origin]}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 size={12} className={io.improvementActions.length > 0 ? "text-emerald-500" : ""} />
                          {io.improvementActions.length} aç{io.improvementActions.length !== 1 ? "ões" : "ão"}
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
          {selectedIO ? (
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              {/* Header section */}
              <div className="p-6 border-b border-border bg-muted/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <select
                      value={getCurrentYearStatus(selectedIO, effectiveYearId!)?.status ?? "OPEN"}
                      onChange={(e) => {
                        const newStatus = e.target.value as ImprovementOpportunityStatus;
                        if (!selectedIO || !effectiveYearId) return;
                        updateYearMutation.mutate({
                          ioId: selectedIO.id,
                          yearId: effectiveYearId,
                          data: { status: newStatus },
                        });
                      }}
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border cursor-pointer transition-all outline-none ${
                        statusSelectClass(getCurrentYearStatus(selectedIO, effectiveYearId!)?.status ?? "OPEN")
                      }`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value} className="text-foreground bg-card">{s.label}</option>
                      ))}
                    </select>
                    <h2 className="text-xl font-bold text-foreground">{selectedIO.name}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isExternal && (
                        <div className="relative">
                          <button
                            id="io-actions-toggle"
                            onClick={() => setActionsMenuOpen((prev) => !prev)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer"
                          >
                            <MoreVertical size={18} className="text-muted-foreground" />
                          </button>
                          {actionsMenuOpen && (
                            <div
                              id="io-actions-menu"
                              className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 py-1 min-w-[160px]"
                            >
                              <button
                                onClick={() => {
                                  setActionsMenuOpen(false);
                                  openEdit(selectedIO);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left cursor-pointer"
                              >
                                <Pencil size={14} />
                                Editar
                              </button>
                              <button
                                onClick={() => {
                                  setActionsMenuOpen(false);
                                  if (selectedIO) {
                                    setIoAssociatedYearIds(new Set(selectedIO.years.map((y) => y.yearId)));
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
                                  setConfirmDeleteIO(true);
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
                      <span className="font-medium text-foreground">{ORIGIN_LABELS[selectedIO.origin]}</span>
                    </span>
                  </div>
                  {selectedIO.responsible && (
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-muted-foreground" />
                      <span className="text-sm">
                        <span className="text-muted-foreground">Responsável: </span>
                        <span className="font-medium text-foreground">
                          {selectedIO.responsible.firstName} {selectedIO.responsible.lastName}
                        </span>
                      </span>
                    </div>
                  )}
                  {selectedIO.department && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        <span className="text-muted-foreground">Departamento: </span>
                        <span className="font-medium text-foreground">{selectedIO.department.name}</span>
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
                      {selectedIO.description || "Sem descrição."}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <ArrowRight size={14} className="text-primary" />
                      Análise de Causa
                    </h3>
                    <p className="text-sm text-foreground leading-relaxed font-medium">
                      {selectedIO.cause || "Nenhuma análise de causa documentada."}
                    </p>
                  </div>
                </div>

                {/* Evaluation & Status */}
                {(() => {
                  const ys = getCurrentYearStatus(selectedIO, effectiveYearId!);
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
                          onClick={() => openEditYear(selectedIO)}
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

                {/* Improvement Actions */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      Ações de Melhoria ({selectedIO.improvementActions.length})
                    </h3>
                    {!isExternal && (
                    <Button size="sm" onClick={() => setIaDialogOpen(true)}>
                      <Plus size={14} />
                      Nova Ação
                    </Button>
                  )}
                  </div>

                  <div className="space-y-4">
                    {selectedIO.improvementActions.map((action) => (
<ImprovementActionCard
                         key={action.id}
                         action={action}
                         ioId={selectedIO.id}
                         onEdit={(data) =>
                           updateIAMutation.mutate({ ioId: selectedIO.id, actionId: action.id, data })
                         }
                         onDelete={(actionId) => deleteIAMutation.mutate({ ioId: selectedIO.id, actionId })}
                         onUpload={(file) =>
                           uploadDocMutation.mutate({ ioId: selectedIO.id, actionId: action.id, file })
                         }
                         onDeleteDoc={(documentId) =>
                           deleteDocMutation.mutate({ ioId: selectedIO.id, actionId: action.id, documentId })
                         }
                         isExternal={isExternal}
                       />
                    ))}

                    {selectedIO.improvementActions.length === 0 && (
                      <div className="py-10 bg-muted/30 border-2 border-dashed border-border rounded-2xl text-center">
                        <Zap size={32} className="mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm font-bold text-muted-foreground">
                          Nenhuma ação de melhoria definida
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Uma oportunidade de melhoria requer uma ação apropriada.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {/* MATRIZ 5W2H (PLANO DE AÇÃO) */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Target size={14} className="text-primary" />
                    Plano de Ação (Matriz 5W2H)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="md:col-span-2 border-b md:border-b-0 md:border-r border-border pb-2 md:pb-0 md:pr-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">What (O que fazer)</p>
                      <p className="font-medium text-foreground mt-0.5">{selectedIO.whatWillBeDone || "—"}</p>
                    </div>
                    <div className="md:col-span-2 border-b md:border-b-0 border-border pb-2 md:pb-0">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Why (Porquê)</p>
                      <p className="font-medium text-foreground mt-0.5">{selectedIO.why || "—"}</p>
                    </div>
                    <div className="border-b md:border-b-0 md:border-r border-border pb-2 md:pb-0 md:pr-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Who (Quem)</p>
                      <p className="font-medium text-foreground mt-0.5">{selectedIO.who || "—"}</p>
                    </div>
                    <div className="border-b md:border-b-0 md:border-r border-border pb-2 md:pb-0 md:pr-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Where (Onde)</p>
                      <p className="font-medium text-foreground mt-0.5">{selectedIO.where || "—"}</p>
                    </div>
                    <div className="border-b md:border-b-0 md:border-r border-border pb-2 md:pb-0 md:pr-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">When (Quando)</p>
                      <p className="font-medium text-foreground mt-0.5">
                        {selectedIO.startDate || selectedIO.expectedEndDate ? (
                          <>De {selectedIO.startDate || "?"} até {selectedIO.expectedEndDate || "?"}</>
                        ) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">How Much (Quanto custa)</p>
                      <p className="font-medium text-foreground mt-0.5">{selectedIO.howMuch || "—"}</p>
                    </div>
                    <div className="md:col-span-4 border-t border-border pt-3 mt-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">How (Como fazer)</p>
                      <p className="font-medium text-foreground mt-0.5">{selectedIO.how || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* VERIFICAÇÃO DE EFICÁCIA */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-primary" />
                    Verificação de Eficácia
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="md:col-span-4 pb-2 border-b border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Evidências / Verificação efetuada</p>
                      <p className="font-medium text-foreground mt-1 whitespace-pre-wrap">
                        {selectedIO.effectivenessVerification || "Nenhuma verificação efetuada até ao momento."}
                      </p>
                    </div>
                    <div className="md:col-span-2 border-b md:border-b-0 md:border-r border-border pb-2 md:pb-0 md:pr-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Data da Verificação</p>
                      <p className="font-medium text-foreground mt-0.5">{selectedIO.verificationDate || "—"}</p>
                    </div>
                    <div className="md:col-span-2 pb-2 md:pb-0">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Responsável pela Verificação</p>
                      <p className="font-medium text-foreground mt-0.5">{selectedIO.verificationResponsible || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card border-2 border-dashed border-border rounded-2xl h-full flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <Lightbulb size={36} className="text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Oportunidades de Melhoria</h2>
              <p className="text-muted-foreground text-sm mt-2 max-w-md">
                Selecione uma oportunidade de melhoria para ver os detalhes ou registe uma nova ocorrência.
              </p>
              {!isExternal && (
                <Button className="mt-6" onClick={() => setAddDialogOpen(true)}>
                  <Plus size={18} />
                  Registar OM
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add IO Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="text-primary" size={20} />
              Registar Oportunidade de Melhoria
            </DialogTitle>
            <DialogDescription>
              Registe uma nova oportunidade de melhoria ou sugestão.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label>Nome / Título</Label>
              <Input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Ex: Melhoria no processo de comunicação"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Origem</Label>
              <select
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground"
                value={addOrigin}
                onChange={(e) => setAddOrigin(e.target.value as ImprovementOpportunityOrigin)}
              >
                {ORIGIN_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Departamento</Label>
              <Select
                value={addDepartmentId?.toString() ?? "none"}
                onValueChange={(v) => setAddDepartmentId(v === "none" ? null : Number(v))}
              >
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {departments?.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Descrição</Label>
              <textarea
                className="w-full h-24 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={addDescription}
                onChange={(e) => setAddDescription(e.target.value)}
                placeholder="Detalhes da oportunidade de melhoria..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Análise de Causa (inicial)</Label>
              <textarea
                className="w-full h-20 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={addCause}
                onChange={(e) => setAddCause(e.target.value)}
              />
            </div>
          </div>
          {/* Secção Matriz 5W2H */}
            <div className="border-t border-border pt-4 mt-4">
              <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Target size={16} className="text-primary" /> Plano de Ação (Matriz 5W2H)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <Label>O que será feito? (What)</Label>
                  <textarea className="w-full h-16 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20" value={addWhatWillBeDone} onChange={(e) => setAddWhatWillBeDone(e.target.value)} placeholder="Ação concreta a realizar..." />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <Label>Por que será feito? (Why)</Label>
                  <textarea className="w-full h-16 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20" value={addWhy} onChange={(e) => setAddWhy(e.target.value)} placeholder="Justificação ou objetivo..." />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Quem fará? (Who)</Label>
                  <Input value={addWho} onChange={(e) => setAddWho(e.target.value)} placeholder="Responsável pela execução" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Onde será feito? (Where)</Label>
                  <Input value={addWhere} onChange={(e) => setAddWhere(e.target.value)} placeholder="Local ou setor" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Data de Início (When - Start)</Label>
                  <Input type="date" value={addStartDate} onChange={(e) => setAddStartDate(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Data de Fim Prevista (When - End)</Label>
                  <Input type="date" value={addExpectedEndDate} onChange={(e) => setAddExpectedEndDate(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <Label>Como será feito? (How)</Label>
                  <textarea className="w-full h-16 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20" value={addHow} onChange={(e) => setAddHow(e.target.value)} placeholder="Método ou passos..." />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <Label>Quanto custará? (How Much)</Label>
                  <Input value={addHowMuch} onChange={(e) => setAddHowMuch(e.target.value)} placeholder="Custo estimado (ex: 0€, 500€...)" />
                </div>
              </div>
            </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleAdd} disabled={!addName.trim() || createMutation.isPending}>
              Registar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit IO Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil size={20} />
              Editar Oportunidade de Melhoria
            </DialogTitle>
            <DialogDescription>
              Altere os dados da oportunidade de melhoria.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label>Nome / Título</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Origem</Label>
              <select
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground"
                value={editOrigin}
                onChange={(e) => setEditOrigin(e.target.value as ImprovementOpportunityOrigin)}
              >
                {ORIGIN_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Departamento</Label>
              <Select
                value={editDepartmentId?.toString() ?? "none"}
                onValueChange={(v) => setEditDepartmentId(v === "none" ? null : Number(v))}
              >
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {departments?.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Descrição</Label>
              <textarea
                className="w-full h-24 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Análise de Causa</Label>
              <textarea
                className="w-full h-20 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={editCause}
                onChange={(e) => setEditCause(e.target.value)}
              />
            </div>
          </div>
                  {/* Secção Matriz 5W2H */}
            <div className="border-t border-border pt-4 mt-4">
              <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Target size={16} className="text-primary" /> Plano de Ação (Matriz 5W2H)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <Label>O que será feito? (What)</Label>
                  <textarea className="w-full h-16 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20" value={editWhatWillBeDone} onChange={(e) => setEditWhatWillBeDone(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <Label>Por que será feito? (Why)</Label>
                  <textarea className="w-full h-16 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20" value={editWhy} onChange={(e) => setEditWhy(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Quem fará? (Who)</Label>
                  <Input value={editWho} onChange={(e) => setEditWho(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Onde será feito? (Where)</Label>
                  <Input value={editWhere} onChange={(e) => setEditWhere(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Data de Início</Label>
                  <Input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Data de Fim Prevista</Label>
                  <Input type="date" value={editExpectedEndDate} onChange={(e) => setEditExpectedEndDate(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <Label>Como será feito? (How)</Label>
                  <textarea className="w-full h-16 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20" value={editHow} onChange={(e) => setEditHow(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <Label>Quanto custará? (How Much)</Label>
                  <Input value={editHowMuch} onChange={(e) => setEditHowMuch(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Secção Verificação de Eficácia */}
            <div className="border-t border-border pt-4 mt-4">
              <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-500" /> Verificação de Eficácia
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <Label>Evidências / Verificação efetuada</Label>
                  <textarea className="w-full h-20 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20" value={editEffectivenessVerification} onChange={(e) => setEditEffectivenessVerification(e.target.value)} placeholder="Resultados obtidos com esta melhoria..." />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Data da Verificação</Label>
                  <Input type="date" value={editVerificationDate} onChange={(e) => setEditVerificationDate(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Responsável pela Verificação</Label>
                  <Input value={editVerificationResponsible} onChange={(e) => setEditVerificationResponsible(e.target.value)} />
                </div>
              </div>
            </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleEdit} disabled={!editName.trim() || updateMutation.isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit IO Year (Status + Evaluation) Dialog */}
      <Dialog open={editYearDialogOpen} onOpenChange={setEditYearDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 size={20} />
              Estado e Avaliação
            </DialogTitle>
            <DialogDescription>
              Atualize o estado e a avaliação desta oportunidade de melhoria.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label>Estado</Label>
              <select
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground"
                value={editYearStatus}
                onChange={(e) => setEditYearStatus(e.target.value as ImprovementOpportunityStatus)}
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
        description="Selecione os anos em que esta oportunidade de melhoria deve estar presente."
        allYears={years ?? []}
        associatedYearIds={ioAssociatedYearIds}
        currentYearId={effectiveYearId}
        onAssociate={(yearId) => {
          if (selectedIO) {
            associateYearsMutation.mutate({
              ioId: selectedIO.id,
              associateYearIds: [yearId],
              disassociateYearIds: [],
            });
          }
        }}
        onDisassociate={(yearId) => {
          if (selectedIO) {
            associateYearsMutation.mutate({
              ioId: selectedIO.id,
              associateYearIds: [],
              disassociateYearIds: [yearId],
            });
          }
        }}
        isPending={associateYearsMutation.isPending}
      />

      {/* Delete IO Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDeleteIO}
        onOpenChange={setConfirmDeleteIO}
        title="Eliminar Oportunidade de Melhoria"
        description="Tem a certeza que deseja eliminar esta oportunidade de melhoria?"
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (selectedIO) deleteMutation.mutate(selectedIO.id);
        }}
      />

      {/* Add IA Dialog */}
      <Dialog open={iaDialogOpen} onOpenChange={setIaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="text-emerald-500" size={20} />
              Nova Ação de Melhoria
            </DialogTitle>
            <DialogDescription>
              Defina uma ação para tratar a oportunidade de melhoria.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label>Título da Ação</Label>
              <Input
                value={iaName}
                onChange={(e) => setIaName(e.target.value)}
                placeholder="Ex: Implementar novo processo de comunicação"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Descrição / Tarefa</Label>
              <textarea
                className="w-full h-24 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={iaDescription}
                onChange={(e) => setIaDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={() => {
                if (!selectedIO) return;
                createIAMutation.mutate({
                  ioId: selectedIO.id,
                  data: { name: iaName.trim(), description: iaDescription.trim() || null },
                });
              }}
              disabled={!iaName.trim() || createIAMutation.isPending}
            >
              Registar Ação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LogDialog
        open={pageLogOpen}
        onOpenChange={setPageLogOpen}
        entityTypes={["IMPROVEMENT_OPPORTUNITY", "IMPROVEMENT_ACTION"] as EntityType[]}
        yearId={effectiveYearId ?? undefined}
        title="Histórico — Oportunidades de Melhoria"
      />
    </div>
  );
}

/* ─── Improvement Action Card ─── */

function ImprovementActionCard({
  action,
  ioId,
  onEdit,
  onDelete,
  onUpload,
  onDeleteDoc,
  isExternal,
}: {
  action: ImprovementActionResponse;
  ioId: number;
  onEdit: (data: { name?: string; description?: string | null; status?: ImprovementActionStatus; progressDescription?: string | null }) => void;
  onDelete: (actionId: number) => void;
  onUpload: (file: File) => void;
  onDeleteDoc: (documentId: number) => void;
  isExternal: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(action.name);
  const [editDescription, setEditDescription] = useState(action.description ?? "");
  const [editStatus, setEditStatus] = useState(action.status);
  const [editProgress, setEditProgress] = useState(action.progressDescription ?? "");
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
        <h4 className="font-bold text-foreground mb-4">Editar Ação de Melhoria</h4>
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
                onChange={(e) => setEditStatus(e.target.value as ImprovementActionStatus)}
              >
                {IA_STATUS_OPTIONS.map((s) => (
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
            {action.name.charAt(0)}
          </div>
          <div>
            <h4 className="font-bold text-foreground">{action.name}</h4>
            {action.responsible && (
              <p className="text-xs text-muted-foreground">
                Responsável: {action.responsible.firstName} {action.responsible.lastName}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={action.status}
            onChange={(e) => {
              onEdit({ status: e.target.value as ImprovementActionStatus });
            }}
            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border cursor-pointer transition-all outline-none ${iaStatusSelectClass(action.status)}`}
          >
            {IA_STATUS_OPTIONS.map((s) => (
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
                    setEditName(action.name);
                    setEditDescription(action.description ?? "");
                    setEditStatus(action.status);
                    setEditProgress(action.progressDescription ?? "");
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

      {action.description && (
        <p className="text-sm text-muted-foreground mb-4 border-l-2 border-primary/20 pl-4">
          {action.description}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
        <div>
          <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Progresso
          </h5>
          <p className="text-sm text-foreground">
            {action.progressDescription || "Fase inicial de implementação."}
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
            {action.documents.map((doc) => {
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
            {action.documents.length === 0 && (
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
        title="Eliminar Ação de Melhoria"
        description="Tem a certeza que deseja eliminar esta ação de melhoria?"
        confirmLabel="Eliminar"
        onConfirm={() => onDelete(action.id)}
      />
    </div>
  );
}