import { useState, useRef, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  updateProcess,
  addProcessResponsible,
  removeProcessResponsible,
  addProcessDepartment,
  removeProcessDepartment,
  getDepartments,
  getUsers,
  removeProcessDocument,
  uploadProcessDocument,
  uploadProcessFichaDocumento,
  clearProcessFichaDocumento,
  uploadProcessEntradasDocumento,
  removeProcessEntradasDocumento,
  uploadProcessSaidasDocumento,
  removeProcessSaidasDocumento,
  getQualityObjectivesByYear,
  getRiskOpportunitiesByYear,
  getInterestedPartiesByYear,
  stripUuidSuffix,
} from "@/api/core";
import { AssociateIndicatorDialog } from "./associate-indicator-dialog";
import { AssociateInterestedPartyDialog } from "./associate-interestedparty-dialog";
import { AssociateRiskDialog } from "./associate-risk-dialog";
import { AssociateQualityObjectiveDialog } from "./associate-qualityobjective-dialog";
import {
  Target, Users, Save, X, Building2, Plus, UserPlus,
  FileText, Upload, Download, ArrowRight, Shield, AlertTriangle, UsersRound,
  Paperclip, Trash2, ChevronDown,
} from "lucide-react";
import type {
  ProcessHierarchyItem,
  DocumentSummary,
  QualityObjectiveResponse,
  RiskOpportunityGroupedResponse,
  InterestedPartyResponse,
} from "@/types";
import { useAuth } from "@/context/auth-context";

interface ProcessDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  process: ProcessHierarchyItem;
  macroProcessId: number;
  yearId: number | null;
  isExternal?: boolean;
}

function Section({
  title,
  icon,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="space-y-2">
      <button
        className="w-full flex items-center justify-between border-b border-slate-200 pb-2 group cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
          {icon}
          {title}
        </h4>
        <div className="flex items-center gap-2">
          {count !== undefined && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {count}
            </span>
          )}
          <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
        {children}
      </div>
    </div>
  );
}

export function ProcessDetailDialog({
  open,
  onOpenChange,
  process,
  yearId,
  isExternal = false,
}: ProcessDetailDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canEdit = !isExternal && (
    user?.roles.includes("ROLE_SUPERADMIN") ||
    process.responsibles.some(r => r.id === user?.id)
  );
  const [editName, setEditName] = useState(process.name);
  const [editObjective, setEditObjective] = useState(process.objective);
  const [addResponsibleOpen, setAddResponsibleOpen] = useState(false);
  const [addDeptOpen, setAddDeptOpen] = useState(false);
  const [indicatorOpen, setIndicatorOpen] = useState(false);
  const [interestedPartyOpen, setInterestedPartyOpen] = useState(false);
  const [riskOpen, setRiskOpen] = useState(false);
  const [qualityObjectiveOpen, setQualityObjectiveOpen] = useState(false);
  const docFileRef = useRef<HTMLInputElement>(null);
  const fichaFileRef = useRef<HTMLInputElement>(null);
  const entradasFileRef = useRef<HTMLInputElement>(null);
  const saidasFileRef = useRef<HTMLInputElement>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingFicha, setUploadingFicha] = useState(false);
  const [uploadingEntradas, setUploadingEntradas] = useState(false);
  const [uploadingSaidas, setUploadingSaidas] = useState(false);

  useEffect(() => {
    setEditName(process.name);
    setEditObjective(process.objective);
  }, [process.name, process.objective]);

  const hasChanges = useMemo(() => {
    return editName !== process.name || editObjective !== process.objective;
  }, [editName, editObjective, process.name, process.objective]);

  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; objective?: string }) =>
      updateProcess(process.processId, data),
    onSuccess: () => {
      toast.success("Processo atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao atualizar processo");
    },
  });

  const addResponsibleMutation = useMutation({
    mutationFn: (userId: number) => addProcessResponsible(process.processId, userId),
    onSuccess: () => {
      toast.success("Responsável adicionado!");
      queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
      setAddResponsibleOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao adicionar responsável");
    },
  });

  const removeResponsibleMutation = useMutation({
    mutationFn: (userId: number) => removeProcessResponsible(process.processId, userId),
    onSuccess: () => {
      toast.success("Responsável removido!");
      queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao remover responsável");
    },
  });

  const addDeptMutation = useMutation({
    mutationFn: (deptId: number) => addProcessDepartment(process.processId, deptId),
    onSuccess: () => {
      toast.success("Departamento adicionado!");
      queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
      setAddDeptOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao adicionar departamento");
    },
  });

  const removeDeptMutation = useMutation({
    mutationFn: (deptId: number) => removeProcessDepartment(process.processId, deptId),
    onSuccess: () => {
      toast.success("Departamento removido!");
      queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao remover departamento");
    },
  });

  const removeDocMutation = useMutation({
    mutationFn: (docId: number) => removeProcessDocument(process.processId, docId),
    onSuccess: () => {
      toast.success("Documento removido!");
      queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
    },
    onError: () => toast.error("Erro ao remover documento."),
  });

  const clearFichaMutation = useMutation({
    mutationFn: () => clearProcessFichaDocumento(process.processId),
    onSuccess: () => {
      toast.success("Ficha do processo removida!");
      queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
    },
    onError: () => toast.error("Erro ao remover ficha do processo."),
  });

  const removeEntradasMutation = useMutation({
    mutationFn: (docId: number) => removeProcessEntradasDocumento(process.processId, docId),
    onSuccess: () => {
      toast.success("Entrada removida!");
      queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
    },
    onError: () => toast.error("Erro ao remover entrada."),
  });

  const removeSaidasMutation = useMutation({
    mutationFn: (docId: number) => removeProcessSaidasDocumento(process.processId, docId),
    onSuccess: () => {
      toast.success("Saída removida!");
      queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
    },
    onError: () => toast.error("Erro ao remover saída."),
  });

  const { data: allUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    enabled: addResponsibleOpen,
  });

  const { data: allDepts } = useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
    enabled: addDeptOpen,
  });

  const { data: qualityObjectives } = useQuery({
    queryKey: ["quality-objectives", yearId],
    queryFn: () => getQualityObjectivesByYear(yearId!),
    enabled: !!yearId && open,
  });

  const { data: riskOpportunities } = useQuery({
    queryKey: ["risk-opportunities", yearId],
    queryFn: () => getRiskOpportunitiesByYear(yearId!),
    enabled: !!yearId && open,
  });

  const { data: interestedParties } = useQuery({
    queryKey: ["interested-parties", yearId],
    queryFn: () => getInterestedPartiesByYear(yearId!),
    enabled: !!yearId && open,
  });

  const availableUsers = allUsers?.filter(
    (u) => !process.responsibles.some((r) => r.id === u.id)
  ) ?? [];

  const availableDepts = allDepts?.filter(
    (d) => !process.departments.some((pd) => pd.id === d.id)
  ) ?? [];

  const relatedQualityObjectives = (qualityObjectives ?? []).filter((qo: QualityObjectiveResponse) =>
    qo.processes.some((p) => p.processYearId === process.processYearId)
  );

  const relatedRisks = (riskOpportunities?.risks ?? []).filter((r: any) =>
    r.processes?.some((p: any) => p.processYearId === process.processYearId)
  );
  const relatedOpportunities = (riskOpportunities?.opportunities ?? []).filter((r: any) =>
    r.processes?.some((p: any) => p.processYearId === process.processYearId)
  );

  const relatedInterestedParties = (interestedParties ?? []).filter((ip: InterestedPartyResponse) =>
    ip.processes?.some((p) => p.processYearId === process.processYearId)
  );

  const handleSave = () => {
    if (!hasChanges) return;
    const changes: Record<string, any> = {};
    if (editName !== process.name) changes.name = editName;
    if (editObjective !== process.objective) changes.objective = editObjective;
    if (Object.keys(changes).length === 0) return;
    updateMutation.mutate(changes);
  };

  async function handleUploadDoc() {
    const input = docFileRef.current;
    if (!input?.files?.length) return;
    const file = input.files[0];
    const userId = user?.id ?? 1;
    setUploadingDoc(true);
    try {
      await uploadProcessDocument(process.processId, file, userId);
      queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
      toast.success("Documento carregado com sucesso.");
    } catch {
      toast.error("Erro ao carregar documento.");
    } finally {
      setUploadingDoc(false);
      if (input) input.value = "";
    }
  }

  async function handleUploadFicha() {
    const input = fichaFileRef.current;
    if (!input?.files?.length) return;
    const file = input.files[0];
    const userId = user?.id ?? 1;
    setUploadingFicha(true);
    try {
      await uploadProcessFichaDocumento(process.processId, file, userId);
      queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
      toast.success("Ficha do Processo carregada com sucesso.");
    } catch {
      toast.error("Erro ao carregar ficha do processo.");
    } finally {
      setUploadingFicha(false);
      if (input) input.value = "";
    }
  }

  async function handleUploadEntradas() {
    const input = entradasFileRef.current;
    if (!input?.files?.length) return;
    const file = input.files[0];
    const userId = user?.id ?? 1;
    setUploadingEntradas(true);
    try {
      await uploadProcessEntradasDocumento(process.processId, file, userId);
      queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
      toast.success("Entrada carregada com sucesso.");
    } catch {
      toast.error("Erro ao carregar entrada.");
    } finally {
      setUploadingEntradas(false);
      if (input) input.value = "";
    }
  }

  async function handleUploadSaidas() {
    const input = saidasFileRef.current;
    if (!input?.files?.length) return;
    const file = input.files[0];
    const userId = user?.id ?? 1;
    setUploadingSaidas(true);
    try {
      await uploadProcessSaidasDocumento(process.processId, file, userId);
      queryClient.invalidateQueries({ queryKey: ["macroprocess-hierarchy"] });
      toast.success("Saída carregada com sucesso.");
    } catch {
      toast.error("Erro ao carregar saída.");
    } finally {
      setUploadingSaidas(false);
      if (input) input.value = "";
    }
  }

  const textareaClass = "flex min-h-[100px] w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none resize-none";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isExternal ? "Detalhes do Processo" : "Editar Processo"}</DialogTitle>
          <DialogDescription>
            {isExternal ? "Visualizar detalhes do processo." : "Altere os dados do processo."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name */}
          <div className="grid gap-1.5">
            <Label htmlFor="process-name">Nome</Label>
            {isExternal ? (
              <p className="text-sm text-foreground py-2 px-1">{process.name}</p>
            ) : (
              <Input id="process-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            )}
          </div>

          {/* Objective */}
          <div className="grid gap-1.5">
            <Label htmlFor="process-objective">Objetivo</Label>
            {isExternal ? (
              <p className="text-sm text-foreground whitespace-pre-wrap py-2 px-1">{process.objective || "—"}</p>
            ) : (
              <textarea
                id="process-objective"
                className={textareaClass}
                value={editObjective}
                onChange={(e) => setEditObjective(e.target.value)}
                placeholder="Descreva o objetivo do processo..."
              />
            )}
          </div>

          {/* Entradas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                <ArrowRight size={14} className="rotate-180 text-emerald-600" />
                Entradas
              </h4>
              {!isExternal && (
                <>
                  <input ref={entradasFileRef} type="file" className="hidden" onChange={handleUploadEntradas} />
                  <button
                    onClick={() => entradasFileRef.current?.click()}
                    disabled={uploadingEntradas || !canEdit}
                    className="flex items-center gap-1 text-sm bg-emerald-50 border border-emerald-200 hover:border-emerald-400 hover:text-emerald-700 text-emerald-600 px-3 py-1.5 rounded-md shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Upload size={14} />
                    {uploadingEntradas ? "..." : "Carregar"}
                  </button>
                </>
              )}
            </div>
            <div className="space-y-2">
              {process.entradasDocumentos.length > 0 ? process.entradasDocumentos.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between text-sm bg-white border border-slate-200 px-3 py-2 rounded shadow-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip size={14} className="shrink-0 text-slate-400" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-slate-400 truncate">{doc.uploadedByFullName && doc.uploadedAt ? `${doc.uploadedByFullName} · ${new Date(doc.uploadedAt).toLocaleDateString("pt-PT")}` : ""}</span>
                      <span className="font-semibold text-slate-800 truncate">{stripUuidSuffix(doc.fileName)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {doc.fileUrl && (
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors p-1 cursor-pointer" title="Descarregar">
                        <Download size={14} />
                      </a>
                    )}
                    {!isExternal && (
                      <button onClick={() => removeEntradasMutation.mutate(doc.id)} disabled={removeEntradasMutation.isPending || !canEdit} className="text-slate-300 hover:text-red-500 transition-colors p-1 disabled:opacity-50 cursor-pointer" title="Remover">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="py-4 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">Sem entradas.</div>
              )}
            </div>
          </div>

          {/* Saídas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                <ArrowRight size={14} className="text-orange-600" />
                Saídas
              </h4>
              {!isExternal && (
                <>
                  <input ref={saidasFileRef} type="file" className="hidden" onChange={handleUploadSaidas} />
                  <button
                    onClick={() => saidasFileRef.current?.click()}
                    disabled={uploadingSaidas || !canEdit}
                    className="flex items-center gap-1 text-sm bg-emerald-50 border border-emerald-200 hover:border-emerald-400 hover:text-emerald-700 text-emerald-600 px-3 py-1.5 rounded-md shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Upload size={14} />
                    {uploadingSaidas ? "..." : "Carregar"}
                  </button>
                </>
              )}
            </div>
            <div className="space-y-2">
              {process.saidasDocumentos.length > 0 ? process.saidasDocumentos.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between text-sm bg-white border border-slate-200 px-3 py-2 rounded shadow-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip size={14} className="shrink-0 text-slate-400" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-slate-400 truncate">{doc.uploadedByFullName && doc.uploadedAt ? `${doc.uploadedByFullName} · ${new Date(doc.uploadedAt).toLocaleDateString("pt-PT")}` : ""}</span>
                      <span className="font-semibold text-slate-800 truncate">{stripUuidSuffix(doc.fileName)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {doc.fileUrl && (
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors p-1 cursor-pointer" title="Descarregar">
                        <Download size={14} />
                      </a>
                    )}
                    {!isExternal && (
                      <button onClick={() => removeSaidasMutation.mutate(doc.id)} disabled={removeSaidasMutation.isPending || !canEdit} className="text-slate-300 hover:text-red-500 transition-colors p-1 disabled:opacity-50 cursor-pointer" title="Remover">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="py-4 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">Sem saídas.</div>
              )}
            </div>
          </div>

          {/* Collapsible sections below */}
          <Section title="Responsáveis" icon={<Users size={14} className="text-slate-500" />} count={process.responsibles.length} defaultOpen>
            <div className="flex items-center justify-end mb-2">
              {!isExternal && (
                <button onClick={() => setAddResponsibleOpen(true)} disabled={!canEdit} className="flex items-center gap-1 text-sm bg-blue-50 border border-blue-200 hover:border-blue-400 hover:text-blue-700 text-blue-600 px-3 py-1.5 rounded-md shadow-sm transition-all disabled:opacity-50 cursor-pointer">
                  <UserPlus size={14} /> Adicionar
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {process.responsibles.length > 0 ? process.responsibles.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm bg-white border border-slate-200 px-3 py-2 rounded shadow-sm">
                  <span className="font-semibold text-slate-800">{r.firstName} {r.lastName}</span>
                  {!isExternal && process.responsibles.length > 1 && (
                    <button onClick={() => removeResponsibleMutation.mutate(r.id)} disabled={!canEdit} className="text-slate-300 hover:text-red-500 transition-colors p-1 disabled:opacity-50 cursor-pointer" title="Remover">
                      <X size={14} />
                    </button>
                  )}
                </div>
              )) : (
                <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400">Nenhum responsável associado.</div>
              )}
            </div>
          </Section>

          <Section title="Departamentos" icon={<Building2 size={14} className="text-slate-500" />} count={process.departments.length} defaultOpen>
            <div className="flex items-center justify-end mb-2">
              {!isExternal && (
                <button onClick={() => setAddDeptOpen(true)} disabled={!canEdit} className="flex items-center gap-1 text-sm bg-blue-50 border border-blue-200 hover:border-blue-400 hover:text-blue-700 text-blue-600 px-3 py-1.5 rounded-md shadow-sm transition-all disabled:opacity-50 cursor-pointer">
                  <Plus size={14} /> Adicionar
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {process.departments.length > 0 ? process.departments.map((d) => (
                <div key={d.id} className="flex items-center justify-between text-sm bg-white border border-slate-200 px-3 py-2 rounded shadow-sm">
                  <span className="font-semibold text-slate-800">{d.name}</span>
                  {!isExternal && (
                    <button onClick={() => removeDeptMutation.mutate(d.id)} disabled={!canEdit} className="text-slate-300 hover:text-red-500 transition-colors p-1 disabled:opacity-50 cursor-pointer" title="Remover">
                      <X size={14} />
                    </button>
                  )}
                </div>
              )) : (
                <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400">Nenhum departamento associado.</div>
              )}
            </div>
          </Section>

          <Section title="Ficha do Processo" icon={<FileText size={14} className="text-violet-600" />} count={process.fichaDocumento ? 1 : 0}>
            <div className="flex items-center justify-end mb-2">
              {!isExternal && (
                <button onClick={() => fichaFileRef.current?.click()} disabled={uploadingFicha || !canEdit} className="flex items-center gap-1 text-sm bg-emerald-50 border border-emerald-200 hover:border-emerald-400 hover:text-emerald-700 text-emerald-600 px-3 py-1.5 rounded-md shadow-sm transition-all disabled:opacity-50 cursor-pointer">
                  <Upload size={14} />
                  {uploadingFicha ? "A carregar..." : process.fichaDocumento ? "Substituir" : "Carregar"}
                </button>
              )}
              <input ref={fichaFileRef} type="file" className="hidden" onChange={handleUploadFicha} />
            </div>
            {process.fichaDocumento ? (
              <div className="flex items-center justify-between text-sm bg-white border border-slate-200 px-3 py-2 rounded shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Paperclip size={14} className="shrink-0 text-slate-400" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-slate-400 truncate">{process.fichaDocumento.uploadedByFullName && process.fichaDocumento.uploadedAt ? `${process.fichaDocumento.uploadedByFullName} · ${new Date(process.fichaDocumento.uploadedAt).toLocaleDateString("pt-PT")}` : ""}</span>
                    <span className="font-semibold text-slate-800 truncate">{stripUuidSuffix(process.fichaDocumento.fileName)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {process.fichaDocumento.fileUrl && (
                    <a href={process.fichaDocumento.fileUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors p-1 cursor-pointer" title="Descarregar">
                      <Download size={14} />
                    </a>
                  )}
                  {!isExternal && (
                    <button onClick={() => clearFichaMutation.mutate()} disabled={clearFichaMutation.isPending || !canEdit} className="text-slate-300 hover:text-red-500 transition-colors p-1 disabled:opacity-50 cursor-pointer" title="Remover">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400">Nenhuma ficha do processo anexada.</div>
            )}
          </Section>

          <Section title="Documentos" icon={<FileText size={14} className="text-slate-500" />} count={process.documents.length}>
            <div className="flex items-center justify-end mb-2">
              {!isExternal && (
                <>
                  <input ref={docFileRef} type="file" className="hidden" onChange={handleUploadDoc} />
                  <button onClick={() => docFileRef.current?.click()} disabled={uploadingDoc || !canEdit} className="flex items-center gap-1 text-sm bg-emerald-50 border border-emerald-200 hover:border-emerald-400 hover:text-emerald-700 text-emerald-600 px-3 py-1.5 rounded-md shadow-sm transition-all disabled:opacity-50 cursor-pointer">
                    <Upload size={14} />
                    {uploadingDoc ? "A carregar..." : "Adicionar Documento"}
                  </button>
                </>
              )}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {process.documents.length > 0 ? process.documents.map((doc: DocumentSummary) => (
                <div key={doc.id} className="flex items-center justify-between text-sm bg-white border border-slate-200 px-3 py-2 rounded shadow-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip size={14} className="shrink-0 text-slate-400" />
                    <span className="font-semibold text-slate-800 truncate">{stripUuidSuffix(doc.fileName)}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {doc.fileUrl && (
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors p-1 cursor-pointer" title="Descarregar">
                        <Download size={14} />
                      </a>
                    )}
                    {!isExternal && (
                      <button onClick={() => removeDocMutation.mutate(doc.id)} disabled={!canEdit} className="text-slate-300 hover:text-red-500 transition-colors p-1 disabled:opacity-50 cursor-pointer" title="Remover">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400">Nenhum documento anexado.</div>
              )}
            </div>
          </Section>

          <Section title="Indicadores" icon={<Target size={14} className="text-slate-500" />} count={process.indicators.length}>
            <div className="flex items-center justify-end mb-2">
              {!isExternal && (
                <button onClick={() => setIndicatorOpen(true)} disabled={!canEdit} className="flex items-center gap-1 text-sm bg-blue-50 border border-blue-200 hover:border-blue-400 hover:text-blue-700 text-blue-600 px-3 py-1.5 rounded-md shadow-sm transition-all disabled:opacity-50 cursor-pointer">
                  <Plus size={14} />
                  Associar Indicador
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {process.indicators.length > 0 ? process.indicators.map((indicator) => (
                <div key={indicator.indicatorId} className="flex items-center justify-between text-sm bg-white border border-slate-200 px-3 py-2 rounded shadow-sm">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">{indicator.name}</span>
                    <span className="text-xs text-slate-400">{indicator.formula}</span>
                  </div>
                  {indicator.goal !== null && indicator.goal !== undefined && (
                    <span className="text-xs text-slate-500">Objetivo: {indicator.goal}</span>
                  )}
                </div>
              )) : (
                <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400">Sem indicadores associados.</div>
              )}
            </div>
          </Section>

          <Section title="Objetivos da Qualidade" icon={<Shield size={14} className="text-green-600" />} count={relatedQualityObjectives.length} defaultOpen={relatedQualityObjectives.length > 0}>
            <div className="flex items-center justify-end mb-2">
              {!isExternal && (
                <button onClick={() => setQualityObjectiveOpen(true)} disabled={!canEdit} className="flex items-center gap-1 text-sm bg-blue-50 border border-blue-200 hover:border-blue-400 hover:text-blue-700 text-blue-600 px-3 py-1.5 rounded-md shadow-sm transition-all disabled:opacity-50 cursor-pointer">
                  <Plus size={14} />
                  Associar
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {relatedQualityObjectives.length > 0 ? relatedQualityObjectives.map((qo: QualityObjectiveResponse) => (
                <div key={qo.id} className="flex items-center justify-between text-sm bg-white border border-slate-200 px-3 py-2 rounded shadow-sm">
                  <span className="font-semibold text-slate-800">{qo.objectiveTitle}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${qo.status === "ACHIEVED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"}`}>
                    {qo.status === "ACHIEVED" ? "Alcançado" : "Em Progresso"}
                  </span>
                </div>
              )) : (
                <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400">Nenhum objetivo da qualidade associado.</div>
              )}
            </div>
          </Section>

          <Section title="Riscos & Oportunidades" icon={<AlertTriangle size={14} className="text-red-600" />} count={relatedRisks.length + relatedOpportunities.length} defaultOpen={relatedRisks.length > 0 || relatedOpportunities.length > 0}>
            <div className="flex items-center justify-end mb-2">
              {!isExternal && (
                <button onClick={() => setRiskOpen(true)} disabled={!canEdit} className="flex items-center gap-1 text-sm bg-blue-50 border border-blue-200 hover:border-blue-400 hover:text-blue-700 text-blue-600 px-3 py-1.5 rounded-md shadow-sm transition-all disabled:opacity-50 cursor-pointer">
                  <Plus size={14} />
                  Associar
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {relatedRisks.length > 0 || relatedOpportunities.length > 0 ? (
                <>
                  {relatedRisks.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between text-sm bg-white border border-slate-200 px-3 py-2 rounded shadow-sm">
                      <span className="font-semibold text-slate-800">{r.code} — {r.description}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-medium">Risco</span>
                    </div>
                  ))}
                  {relatedOpportunities.map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between text-sm bg-white border border-slate-200 px-3 py-2 rounded shadow-sm">
                      <span className="font-semibold text-slate-800">{o.code} — {o.description}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium">Oportunidade</span>
                    </div>
                  ))}
                </>
              ) : (
                <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400">Nenhum risco ou oportunidade associado.</div>
              )}
            </div>
          </Section>

          <Section title="Partes Interessadas" icon={<UsersRound size={14} className="text-purple-600" />} count={relatedInterestedParties.length} defaultOpen={relatedInterestedParties.length > 0}>
            <div className="flex items-center justify-end mb-2">
              {!isExternal && (
                <button onClick={() => setInterestedPartyOpen(true)} disabled={!canEdit} className="flex items-center gap-1 text-sm bg-blue-50 border border-blue-200 hover:border-blue-400 hover:text-blue-700 text-blue-600 px-3 py-1.5 rounded-md shadow-sm transition-all disabled:opacity-50 cursor-pointer">
                  <Plus size={14} />
                  Associar
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {relatedInterestedParties.length > 0 ? relatedInterestedParties.map((ip: InterestedPartyResponse) => (
                <div key={ip.id} className="flex items-center justify-between text-sm bg-white border border-slate-200 px-3 py-2 rounded shadow-sm">
                  <span className="font-semibold text-slate-800">{ip.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-medium">
                    {ip.type === "INTERNAL" ? "Interna" : "Externa"}
                  </span>
                </div>
              )) : (
                <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400">Nenhuma parte interessada associada.</div>
              )}
            </div>
          </Section>
        </div>

        {/* Add Responsible Dialog */}
        <Dialog open={addResponsibleOpen} onOpenChange={setAddResponsibleOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Adicionar Responsável</DialogTitle>
              <DialogDescription>Selecione um utilizador para adicionar como responsável.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 mt-2 max-h-64 overflow-y-auto">
              {availableUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Todos os utilizadores já são responsáveis.</p>
              )}
              {availableUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <p className="font-medium text-sm">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Button size="sm" onClick={() => addResponsibleMutation.mutate(u.id)} disabled={addResponsibleMutation.isPending}>
                    Adicionar
                  </Button>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Department Dialog */}
        <Dialog open={addDeptOpen} onOpenChange={setAddDeptOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Adicionar Departamento</DialogTitle>
              <DialogDescription>Selecione um departamento para associar ao processo.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 mt-2 max-h-64 overflow-y-auto">
              {availableDepts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Sem departamentos disponíveis para associar.</p>
              )}
              {availableDepts.map((dept) => (
                <div key={dept.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <p className="font-medium text-sm">{dept.name}</p>
                    <p className="text-xs text-muted-foreground">{dept.userCount} utilizador{dept.userCount !== 1 ? "es" : ""}</p>
                  </div>
                  <Button size="sm" onClick={() => addDeptMutation.mutate(dept.id)} disabled={addDeptMutation.isPending}>
                    Adicionar
                  </Button>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Associate Indicator Dialog */}
        <AssociateIndicatorDialog
          open={indicatorOpen}
          onOpenChange={setIndicatorOpen}
          processYearId={process.processYearId}
          yearId={yearId}
          alreadyAssociatedIds={process.indicators.map((i) => i.indicatorYearId)}
        />

        {/* Associate Interested Party Dialog */}
        <AssociateInterestedPartyDialog
          open={interestedPartyOpen}
          onOpenChange={setInterestedPartyOpen}
          processYearId={process.processYearId}
          yearId={yearId}
          alreadyAssociatedIds={relatedInterestedParties.map((ip) => ip.interestedPartyYearId)}
        />

        {/* Associate Risk Dialog */}
        <AssociateRiskDialog
          open={riskOpen}
          onOpenChange={setRiskOpen}
          processYearId={process.processYearId}
          yearId={yearId}
          alreadyAssociatedIds={[...relatedRisks, ...relatedOpportunities].map((r: any) => r.riskOpportunityYearId)}
        />

        {/* Associate Quality Objective Dialog */}
        <AssociateQualityObjectiveDialog
          open={qualityObjectiveOpen}
          onOpenChange={setQualityObjectiveOpen}
          processYearId={process.processYearId}
          yearId={yearId}
          alreadyAssociatedIds={relatedQualityObjectives.map((qo: QualityObjectiveResponse) => qo.qualityObjectiveYearId)}
        />

        {/* Footer */}
        {!isExternal ? (
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={updateMutation.isPending || !hasChanges}>
              <Save className="size-4" />
              {updateMutation.isPending ? "A guardar..." : "Guardar"}
            </Button>
          </DialogFooter>
        ) : (
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}