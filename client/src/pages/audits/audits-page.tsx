import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  ClipboardCheck,
  Plus,
  Search,
  Trash2,
  MoreVertical,
  Pencil,
  CalendarDays,
  ArrowUpDown,
  X,
  User,
  History,
  Upload,
  Download,
  FileText,
  UserPlus,
  ChevronDown,
  ChevronRight,
  Mail,
} from "lucide-react";
import {
  getYears,
  getAuditsByYear,
  createAudit,
  updateAudit,
  deleteAudit,
  uploadAuditDocument,
  deleteAuditDocument,
  getUsers,
  createExternalUser,
  getExternalUsersByYear,
  getDepartments,
} from "@/api/core";
import ConfirmDialog from "@/components/confirm-dialog";
import { YearSelector } from "@/components/year-selector";
import { LogDialog } from "@/components/log-dialog";
import { useAuth } from "@/context/auth-context";
import type {
  AuditResponse,
  AuditType,
  AuditStatus,
  EntityType,
  ExternalUserResponse,
  DepartmentResponse,
} from "@/types";

const STATUS_LABELS: Record<AuditStatus, string> = {
  PLANNED: "Planeada",
  PLANNED_NOT_CONFIRMED: "Planeada (Não Confirmada)",
  PLANNED_CONFIRMED: "Planeada (Confirmada)",
  FINISHED: "Concluída",
  CANCELED: "Cancelada",
};

const STATUS_OPTIONS: { value: AuditStatus; label: string }[] = [
  { value: "PLANNED_NOT_CONFIRMED", label: "Planeada (Não Confirmada)" },
  { value: "PLANNED_CONFIRMED", label: "Planeada (Confirmada)" },
  { value: "FINISHED", label: "Concluída" },
  { value: "CANCELED", label: "Cancelada" },
];

const TYPE_LABELS: Record<AuditType, string> = {
  INTERNAL: "Interna",
  EXTERNAL: "Externa",
};

const TYPE_OPTIONS: { value: AuditType; label: string }[] = [
  { value: "INTERNAL", label: "Interna" },
  { value: "EXTERNAL", label: "Externa" },
];

function statusBadgeVariant(status: AuditStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "FINISHED": return "default" as const;
    case "PLANNED_CONFIRMED": return "secondary" as const;
    case "CANCELED": return "destructive" as const;
    default: return "outline" as const;
  }
}

function typeBadgeVariant(type: AuditType): "default" | "secondary" | "outline" {
  return type === "INTERNAL" ? "default" as const : "secondary" as const;
}

export default function AuditsPage() {
  const queryClient = useQueryClient();
  const { isExternal } = useAuth();

  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [pageLogOpen, setPageLogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<"asc" | "desc">("desc");
  const [typeFilter, setTypeFilter] = useState<"ALL" | AuditType>("ALL");

  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<AuditResponse | null>(null);
  const viewOnly = isExternal && editItem !== null;
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<AuditType>("INTERNAL");
  const [formTeam, setFormTeam] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formResponsibleId, setFormResponsibleId] = useState<number | null>(null);
  const [formStatus, setFormStatus] = useState<AuditStatus>("PLANNED_NOT_CONFIRMED");
  const [formPlannedDate, setFormPlannedDate] = useState("");
  const [formDepartmentId, setFormDepartmentId] = useState<number | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [extSectionOpen, setExtSectionOpen] = useState(false);
  const [extEmail, setExtEmail] = useState("");
  const [extPassword, setExtPassword] = useState("");
  const [extConfirmPassword, setExtConfirmPassword] = useState("");
  const [extFirstName, setExtFirstName] = useState("");
  const [extLastName, setExtLastName] = useState("");
  const [extYearIds, setExtYearIds] = useState<number[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDocId, setUploadingDocId] = useState<number | null>(null);

  const { data: years } = useQuery({ queryKey: ["years"], queryFn: getYears });
  const effectiveYearId = selectedYearId;

  useEffect(() => {
    if (selectedYearId !== null) return;
    if (!years || years.length === 0) return;
    const currentYearVal = new Date().getFullYear();
    const match = years.find(y => y.year === currentYearVal) ?? years[0];
    setSelectedYearId(match.id);
  }, [selectedYearId, years]);

  const { data: users } = useQuery({ queryKey: ["users"], queryFn: getUsers });
  const { data: departments } = useQuery({ queryKey: ["departments"], queryFn: getDepartments });

  const { data: externalUsers, refetch: refetchExternalUsers } = useQuery({
    queryKey: ["externalUsers", editItem?.yearId],
    queryFn: () => getExternalUsersByYear(editItem!.yearId),
    enabled: editItem !== null && formType === "EXTERNAL",
  });

  const { data: audits, isLoading } = useQuery({
    queryKey: ["audits", effectiveYearId],
    queryFn: () => getAuditsByYear(effectiveYearId!),
    enabled: effectiveYearId !== null,
  });

  const items = useMemo(() => {
    let list = audits ?? [];
    if (typeFilter !== "ALL") {
      list = list.filter((a) => a.type === typeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.team ?? "").toLowerCase().includes(q) ||
          (a.notes ?? "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => (sortMode === "desc" ? b.id - a.id : a.id - b.id));
  }, [audits, typeFilter, searchQuery, sortMode]);

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["audits"] });
  }

  const createMutation = useMutation({
    mutationFn: createAudit,
    onSuccess: () => {
      invalidateAll();
      toast.success("Auditoria registada com sucesso.");
      setEditOpen(false);
      setEditItem(null);
    },
    onError: () => toast.error("Erro ao registar auditoria."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateAudit>[1] }) =>
      updateAudit(id, data),
    onSuccess: () => {
      invalidateAll();
      toast.success("Auditoria atualizada com sucesso.");
      setEditOpen(false);
      setEditItem(null);
    },
    onError: () => toast.error("Erro ao atualizar auditoria."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAudit,
    onSuccess: () => {
      invalidateAll();
      toast.success("Auditoria eliminada com sucesso.");
    },
    onError: () => toast.error("Erro ao eliminar auditoria."),
  });

  const createExternalUserMutation = useMutation({
    mutationFn: createExternalUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      refetchExternalUsers();
      toast.success("Utilizador externo criado com sucesso. Pode agora selecioná-lo como responsável.");
      setExtEmail("");
      setExtPassword("");
      setExtConfirmPassword("");
      setExtFirstName("");
      setExtLastName("");
      setExtSectionOpen(false);
    },
    onError: () => toast.error("Erro ao criar utilizador externo."),
  });

  function openCreate() {
    setEditItem(null);
    setFormName("");
    setFormType("INTERNAL");
    setFormTeam("");
    setFormNotes("");
    setFormResponsibleId(null);
    setFormStatus("PLANNED_NOT_CONFIRMED");
    setFormPlannedDate("");
    setFormDepartmentId(null);
    setExtSectionOpen(false);
    setExtYearIds([]);
    setEditOpen(true);
  }

  function openEdit(item: AuditResponse) {
    setEditItem(item);
    setFormName(item.name);
    setFormType(item.type);
    setFormTeam(item.team ?? "");
    setFormNotes(item.notes ?? "");
    setFormResponsibleId(item.responsible?.id ?? null);
    setFormStatus(item.status);
    setFormPlannedDate(item.plannedDate ?? "");
    setFormDepartmentId(item.department?.id ?? null);
    setExtSectionOpen(false);
    setExtYearIds([item.yearId]);
    setEditOpen(true);
  }

  function handleSubmit() {
    if (!formName.trim() || !effectiveYearId) return;

    if (editItem) {
      updateMutation.mutate({
        id: editItem.id,
        data: {
          name: formName.trim(),
          type: formType,
          team: formTeam.trim() || null,
          notes: formNotes.trim() || null,
          responsibleId: formResponsibleId,
          departmentId: formDepartmentId,
          status: formStatus,
          plannedDate: formPlannedDate || null,
        },
      });
    } else {
      createMutation.mutate({
        name: formName.trim(),
        type: formType,
        team: formTeam.trim() || null,
        notes: formNotes.trim() || null,
        responsibleId: formResponsibleId,
        departmentId: formDepartmentId,
        yearId: effectiveYearId,
        status: formStatus,
        plannedDate: formPlannedDate || null,
      });
    }
  }

  function handleCreateExternalUser() {
    if (!editItem) return;
    if (!extEmail.trim() || !extPassword || extPassword !== extConfirmPassword) {
      toast.error("Preencha todos os campos e certifique-se que as palavras-passe coincidem.");
      return;
    }
    if (extYearIds.length === 0) {
      toast.error("Selecione pelo menos um ano de acesso.");
      return;
    }
    createExternalUserMutation.mutate({
      email: extEmail.trim(),
      password: extPassword,
      confirmPassword: extConfirmPassword,
      firstName: extFirstName.trim(),
      lastName: extLastName.trim(),
      yearIds: extYearIds,
    });
  }

  async function handleUploadDocument(auditId: number) {
    const input = fileInputRef.current;
    if (!input?.files?.length) return;
    const file = input.files[0];
    const userId = users?.find((u) => u.id)?.id ?? 1;
    setUploadingDocId(auditId);
    try {
      await uploadAuditDocument(auditId, file, userId);
      invalidateAll();
      toast.success("Documento carregado com sucesso.");
    } catch {
      toast.error("Erro ao carregar documento.");
    } finally {
      setUploadingDocId(null);
      if (input) input.value = "";
    }
  }

  return (
    <div className="py-8 w-full max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center shadow-sm">
            <ClipboardCheck size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Auditorias</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Planeamento e registo de auditorias internas e externas.
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
            selectedYearId={selectedYearId}
            onYearChange={(id) => setSelectedYearId(id)}
          />
          {!isExternal && (
            <Button onClick={openCreate}>
              <Plus size={18} />
              Nova Auditoria
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 pt-4 pb-3 border-b border-border">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {items.length} {items.length === 1 ? "Auditoria" : "Auditorias"}
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              <input
                type="text"
                placeholder="Pesquisar..."
                className="pl-9 pr-4 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-56 text-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as "ALL" | AuditType)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={() => setSortMode((prev) => (prev === "desc" ? "asc" : "desc"))}
              className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all"
              title={sortMode === "desc" ? "Mais recentes primeiro" : "Mais antigos primeiro"}
            >
              <ArrowUpDown size={16} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardCheck size={28} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-bold text-muted-foreground">Nenhuma auditoria registada</p>
            <p className="text-xs text-muted-foreground mt-1 mb-6">
              Registe a primeira auditoria para este ano.
            </p>
            {!isExternal && (
              <Button onClick={openCreate}>
                <Plus size={16} />
                Nova Auditoria
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {items.map((item) => (
              <RowItem
                key={item.id}
                item={item}
                onEdit={openEdit}
                onDelete={(id) => setConfirmDeleteId(id)}
                isExternal={isExternal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit / Create Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { if (!open) { setEditOpen(false); setEditItem(null); } }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editItem ? <ClipboardCheck className="text-primary" size={20} /> : <Plus size={20} />}
              {viewOnly ? "Detalhes da Auditoria" : editItem ? "Editar Auditoria" : "Nova Auditoria"}
            </DialogTitle>
            <DialogDescription>
              {viewOnly ? "Visualizar detalhes da auditoria." : editItem ? "Altere os dados da auditoria." : "Registe uma nova auditoria."}
            </DialogDescription>
          </DialogHeader>

          {(() => { const ro = viewOnly; return (
          <div className="space-y-6 py-4">
            <div className="grid gap-1.5">
              <Label htmlFor="audit-name">Nome *</Label>
              {ro ? <p className="text-sm text-foreground py-2 px-1">{formName || '-'}</p>
              : <Input
                id="audit-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Auditoria Interna 2025"
              />}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Tipo</Label>
                {ro ? <p className="text-sm text-foreground py-2 px-1">{TYPE_OPTIONS.find(t => t.value === formType)?.label ?? formType}</p>
                : <Select value={formType} onValueChange={(v) => setFormType(v as AuditType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>}
              </div>
              <div className="grid gap-1.5">
                <Label>Estado</Label>
                {ro ? <p className="text-sm text-foreground py-2 px-1">{STATUS_OPTIONS.find(s => s.value === formStatus)?.label ?? formStatus}</p>
                : <Select value={formStatus} onValueChange={(v) => setFormStatus(v as AuditStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Data Planeada</Label>
                {ro ? <p className="text-sm text-foreground py-2 px-1">{formPlannedDate || '-'}</p>
                : <Input
                  type="date"
                  value={formPlannedDate}
                  onChange={(e) => setFormPlannedDate(e.target.value)}
                />}
              </div>
              <div className="grid gap-1.5">
                <Label>Responsável</Label>
                {ro ? <p className="text-sm text-foreground py-2 px-1">{formResponsibleId ? (users?.find(u => u.id === formResponsibleId) ? `${users.find(u => u.id === formResponsibleId)!.firstName} ${users.find(u => u.id === formResponsibleId)!.lastName}` : formResponsibleId.toString()) : "Sem responsável"}</p>
                : <Select
                  value={formResponsibleId?.toString() ?? "none"}
                  onValueChange={(v) => setFormResponsibleId(v === "none" ? null : Number(v))}
                  className="flex-1"
                >
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem responsável</SelectItem>
                    {users?.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.firstName} {u.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>}
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>Departamento</Label>
              {ro ? <p className="text-sm text-foreground py-2 px-1">{formDepartmentId ? (departments?.find(d => d.id === formDepartmentId)?.name ?? "—") : "—"}</p>
              : <Select
                value={formDepartmentId?.toString() ?? "none"}
                onValueChange={(v) => setFormDepartmentId(v === "none" ? null : Number(v))}
              >
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {departments?.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="audit-team">Equipa</Label>
              {ro ? <p className="text-sm text-foreground py-2 px-1">{formTeam || '-'}</p>
              : <Input
                id="audit-team"
                value={formTeam}
                onChange={(e) => setFormTeam(e.target.value)}
                placeholder="Membros da equipa de auditoria"
              />}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="audit-notes">Notas</Label>
              {ro ? <p className="text-sm text-foreground whitespace-pre-wrap py-2 px-1">{formNotes || '-'}</p>
              : <textarea
                id="audit-notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none resize-none"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Notas adicionais sobre a auditoria..."
              />}
            </div>

            {/* External User Section — only when editing an EXTERNAL audit */}
            {editItem && formType === "EXTERNAL" && !ro && (
              <div className="border border-blue-200 dark:border-blue-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExtSectionOpen(!extSectionOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <UserPlus size={16} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                      Utilizadores Externos
                    </span>
                    {externalUsers && externalUsers.length > 0 && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-800 px-2 py-0.5 rounded-full font-semibold">
                        {externalUsers.length}
                      </span>
                    )}
                  </div>
                  {extSectionOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {extSectionOpen && (
                  <div className="px-4 py-4 space-y-5 bg-white dark:bg-card">
                    {/* Existing external users */}
                    {externalUsers && externalUsers.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Utilizadores Externos Existentes</Label>
                        <div className="space-y-2">
                          {externalUsers.map((u) => (
                            <div
                              key={u.id}
                              className="flex items-center justify-between bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 rounded-lg px-3 py-2"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <User size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                  <span className="text-sm font-semibold text-foreground truncate">{u.firstName} {u.lastName}</span>
                                </div>
                                <div className="flex items-center gap-1 mt-0.5 ml-[22px]">
                                  <Mail size={11} className="text-muted-foreground shrink-0" />
                                  <span className="text-xs text-muted-foreground truncate">{u.email}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex flex-wrap gap-1">
                                  {u.accessibleYears.map((yr) => (
                                    <span key={yr} className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-semibold">
                                      {yr}
                                    </span>
                                  ))}
                                </div>
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-medium">Só leitura</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-blue-200 dark:border-blue-800 pt-4">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Criar Novo Utilizador Externo</Label>
                      <p className="text-xs text-muted-foreground mb-4">
                        Crie uma conta de só-leitura para o responsável da auditoria externa. O utilizador só terá acesso aos anos selecionados abaixo.
                      </p>
                      <div className="space-y-4">
                        <div className="grid gap-1.5">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Anos de Acesso *</Label>
                          <div className="flex flex-wrap gap-2">
                            {(years ?? [])
                              .sort((a, b) => b.year - a.year)
                              .map((y) => {
                                const checked = extYearIds.includes(y.id);
                                return (
                                  <button
                                    key={y.id}
                                    type="button"
                                    onClick={() => {
                                      setExtYearIds((prev) =>
                                        checked ? prev.filter((id) => id !== y.id) : [...prev, y.id]
                                      );
                                    }}
                                    className={`px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${
                                      checked
                                        ? "bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300"
                                        : "bg-card border-border text-muted-foreground hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-700 dark:hover:text-blue-400"
                                    }`}
                                  >
                                    {y.year}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="ext-email">Email *</Label>
                          <Input id="ext-email" type="email" value={extEmail} onChange={(e) => setExtEmail(e.target.value)} placeholder="externo@empresa.com" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-1.5">
                            <Label htmlFor="ext-first">Nome *</Label>
                            <Input id="ext-first" value={extFirstName} onChange={(e) => setExtFirstName(e.target.value)} placeholder="João" />
                          </div>
                          <div className="grid gap-1.5">
                            <Label htmlFor="ext-last">Apelido *</Label>
                            <Input id="ext-last" value={extLastName} onChange={(e) => setExtLastName(e.target.value)} placeholder="Silva" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-1.5">
                            <Label htmlFor="ext-pass">Palavra-passe *</Label>
                            <Input id="ext-pass" type="password" value={extPassword} onChange={(e) => setExtPassword(e.target.value)} placeholder="Mín. 8 caracteres" />
                          </div>
                          <div className="grid gap-1.5">
                            <Label htmlFor="ext-confirm">Confirmar *</Label>
                            <Input id="ext-confirm" type="password" value={extConfirmPassword} onChange={(e) => setExtConfirmPassword(e.target.value)} placeholder="Repetir palavra-passe" />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handleCreateExternalUser}
                            disabled={createExternalUserMutation.isPending || !extEmail.trim() || !extPassword || extPassword !== extConfirmPassword || extYearIds.length === 0}
                            className="flex items-center gap-1 text-sm bg-blue-50 border border-blue-200 hover:border-blue-400 hover:text-blue-700 text-blue-600 px-4 py-2 rounded-md shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                          >
                            <UserPlus size={14} />
                            {createExternalUserMutation.isPending ? "A criar..." : "Criar Utilizador Externo"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Documents Section */}
            {editItem && (
              <div>
                <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={14} />
                    Documentos
                  </h4>
                  {!ro && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingDocId !== null}
                      className="flex items-center gap-1 text-sm bg-blue-50 border border-blue-200 hover:border-blue-400 hover:text-blue-700 text-blue-600 px-3 py-1.5 rounded-md shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Upload size={14} />
                      Carregar Documento
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={() => {
                      if (editItem) handleUploadDocument(editItem.id);
                    }}
                  />
                </div>
                {editItem.documents.length > 0 ? (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                    {editItem.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between text-sm bg-card border border-border px-3 py-2 rounded-lg shadow-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText size={14} className="text-muted-foreground shrink-0" />
                          <span className="font-semibold text-foreground truncate">{doc.fileName}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {doc.fileUrl && (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors p-1 cursor-pointer"
                              title="Descarregar"
                            >
                              <Download size={14} />
                            </a>
                          )}
                          {!ro && (
                            <button
                              onClick={() => {
                                if (editItem) {
                                  deleteAuditDocument(editItem.id, doc.id).then(() => {
                                    invalidateAll();
                                    toast.success("Documento removido.");
                                  }).catch(() => toast.error("Erro ao remover documento."));
                                }
                              }}
                              className="text-muted-foreground hover:text-destructive transition-colors p-1 cursor-pointer"
                              title="Remover"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center border-2 border-dashed border-border rounded-lg text-muted-foreground text-sm">
                    Nenhum documento anexado.
                  </div>
                )}
              </div>
            )}
          </div>
          );
          })()}
          <DialogFooter className="gap-2">
            {viewOnly ? (
              <DialogClose asChild>
                <Button variant="outline">Fechar</Button>
              </DialogClose>
            ) : (
              <>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button
                  onClick={handleSubmit}
                  disabled={!formName.trim() || createMutation.isPending || updateMutation.isPending}
                >
                  {editItem ? "Guardar" : "Registar"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
        title="Eliminar Auditoria"
        description="Tem a certeza que deseja eliminar esta auditoria?"
        onConfirm={() => {
          if (confirmDeleteId !== null) deleteMutation.mutate(confirmDeleteId);
        }}
      />

      <LogDialog
        open={pageLogOpen}
        onOpenChange={setPageLogOpen}
        entityTypes={["AUDIT"] as EntityType[]}
        yearId={effectiveYearId ?? undefined}
        title="Histórico — Auditorias"
      />
    </div>
  );
}

function RowItem({
  item,
  onEdit,
  onDelete,
  isExternal: isExt,
}: {
  item: AuditResponse;
  onEdit: (item: AuditResponse) => void;
  onDelete: (id: number) => void;
  isExternal: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
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

  const responsibleName = item.responsible
    ? `${item.responsible.firstName} ${item.responsible.lastName}`
    : null;

  return (
    <div
      className="flex items-center gap-6 px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer group"
      onClick={() => onEdit(item)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="font-bold text-foreground text-sm truncate">{item.name}</h3>
          <Badge variant={typeBadgeVariant(item.type)}>{TYPE_LABELS[item.type]}</Badge>
          <Badge variant={statusBadgeVariant(item.status)}>{STATUS_LABELS[item.status]}</Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
          {item.plannedDate && (
            <span className="flex items-center gap-1">
              <CalendarDays size={12} />
              {item.plannedDate}
            </span>
          )}
          {responsibleName && (
            <span className="flex items-center gap-1">
              <User size={12} />
              {responsibleName}
            </span>
          )}
          {item.department && (
            <span>{item.department.name}</span>
          )}
          {item.team && (
            <span>Equipa: {item.team}</span>
          )}
          <span className="bg-muted px-2 py-0.5 rounded font-medium">
            {item.documents.length} {item.documents.length === 1 ? "doc" : "docs"}
          </span>
        </div>
      </div>

      {!isExt && (
        <div onClick={(e) => e.stopPropagation()}>
          <button
            ref={buttonRef}
            onClick={() => {
              if (!menuOpen && buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right + 16 });
              }
              setMenuOpen((prev) => !prev);
            }}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all cursor-pointer"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div
              ref={menuRef}
              style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 50 }}
              className="bg-card border border-border rounded-xl shadow-lg py-1 min-w-[160px]"
            >
              <button
                onClick={() => { setMenuOpen(false); onEdit(item); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left cursor-pointer"
              >
                <Pencil size={14} />
                Editar
              </button>
              <div className="border-t border-border my-1" />
              <button
                onClick={() => { setMenuOpen(false); onDelete(item.id); }}
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
  );
}