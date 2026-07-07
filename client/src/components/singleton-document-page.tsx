import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SingletonDocumentResponse, DocumentVersionResponse, DocumentStatus, EntityType } from "@/types";
import { useAuth } from "@/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  approveDocumentVersion,
  deleteDocumentVersion,
  downloadDocumentVersion,
  stripUuidSuffix,
} from "@/api/core";
import { LogDialog } from "@/components/log-dialog";
import {
  FileText,
  History,
  CheckCircle2,
  Clock,
  Upload,
  Save,
  Plus,
  ExternalLink,
  Trash2,
} from "lucide-react";

function statusBadge(status: DocumentStatus) {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "UNDER_REVIEW":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "OBSOLETE":
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function statusLabel(status: DocumentStatus) {
  switch (status) {
    case "APPROVED":
      return "Aprovado";
    case "UNDER_REVIEW":
      return "Em Revisão";
    case "OBSOLETE":
      return "Obsoleto";
  }
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface SingletonDocumentPageProps {
  title: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  emptyDescriptionText: string;
  documentCardTitle: string;
  queryKey: string[];
  fetchFn: () => Promise<SingletonDocumentResponse>;
  updateFn: (data: { description: string }) => Promise<SingletonDocumentResponse>;
  uploadFn: (
    file: File,
    version: number,
    uploadedById: number,
    existingDocumentId?: number | null
  ) => Promise<SingletonDocumentResponse>;
  entityType?: EntityType;
  icon?: React.ReactNode;
}

export function SingletonDocumentPage({
  title,
  descriptionLabel,
  descriptionPlaceholder,
  emptyDescriptionText,
  queryKey,
  fetchFn,
  updateFn,
  uploadFn,
  entityType,
  icon,
}: SingletonDocumentPageProps) {
  const { user, isExternal } = useAuth();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [logOpen, setLogOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: fetchFn,
  });

  const updateMutation = useMutation({
    mutationFn: updateFn,
    onSuccess: () => {
      toast.success("Atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey });
      setIsEditing(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao atualizar");
    },
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!uploadFile) throw new Error("Nenhum ficheiro selecionado");
      const nextVersion = data?.document?.versions?.length
        ? Math.max(...data.document.versions.map((v: DocumentVersionResponse) => v.version)) + 1
        : 1;
      const existingDocId = data?.document?.documentId ?? null;
      return uploadFn(uploadFile, nextVersion, Number(user?.id ?? 1), existingDocId);
    },
    onSuccess: () => {
      toast.success("Documento carregado com sucesso!");
      queryClient.invalidateQueries({ queryKey });
      setIsVersionDialogOpen(false);
      setUploadFile(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao carregar o documento");
    },
  });

  const approveMutation = useMutation({
    mutationFn: approveDocumentVersion,
    onSuccess: () => {
      toast.success("Versão aprovada com sucesso!");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao aprovar a versão");
    },
  });

  const deleteVersionMutation = useMutation({
    mutationFn: deleteDocumentVersion,
    onSuccess: () => {
      toast.success("Versão eliminada com sucesso!");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao eliminar a versão");
    },
  });

  const handleEdit = () => {
    if (!data) return;
    setEditDescription(data.description ?? "");
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate({ description: editDescription });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditDescription("");
  };

  const handleOpenUpload = () => {
    setUploadFile(null);
    setIsVersionDialogOpen(true);
  };

  const handleUploadSubmit = () => {
    if (!uploadFile) return;
    uploadMutation.mutate();
  };

  const handleDownload = (versionId: number, fileName: string) => {
    downloadDocumentVersion(versionId, fileName);
  };

  const versions = data?.document?.versions ?? [];
  const currentApprovedVersion = versions.find(
    (v: DocumentVersionResponse) => v.status === "APPROVED"
  );
  const sortedVersions = [...versions].sort(
    (a: DocumentVersionResponse, b: DocumentVersionResponse) => b.version - a.version
  );
  const latestVersion = versions.length
    ? versions.reduce((a: DocumentVersionResponse, b: DocumentVersionResponse) =>
        a.version > b.version ? a : b
      )
    : null;

  if (isLoading) {
    return (
      <div className="py-8 w-full max-w-5xl mx-auto flex flex-col gap-4">
        <Skeleton className="h-10 w-1/3 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-60 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-8 w-full max-w-5xl mx-auto">
        <p className="text-destructive">Erro ao carregar os dados.</p>
      </div>
    );
  }

  return (
    <div className="py-8 w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-sm">
            {icon ?? <FileText size={24} />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-muted-foreground text-sm mt-1">{descriptionLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {entityType && (
            <button
              onClick={() => setLogOpen(true)}
              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
              title="Histórico de alterações"
            >
              <History size={20} />
            </button>
          )}
          {!isExternal && (
            <button
            onClick={handleOpenUpload}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
          >
            <Plus size={18} />
            Nova Versão
          </button>
          )}
        </div>
      </div>

      {/* Content View */}
      <div className="space-y-8">
        {/* Description Card */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-muted-foreground" />
              <h3 className="font-bold text-foreground">{descriptionLabel}</h3>
            </div>
            {!isEditing && !isExternal && (
              <button
                onClick={handleEdit}
                className="text-xs font-bold text-primary hover:text-primary/80 uppercase tracking-wider cursor-pointer"
              >
                Editar
              </button>
            )}
            {isEditing && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancelEdit}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1 rounded-md text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save size={14} />
                  Guardar
                </button>
              </div>
            )}
          </div>
          <div className="p-8">
            {isEditing ? (
              <textarea
                className="w-full h-64 p-4 bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all leading-relaxed"
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                placeholder={descriptionPlaceholder}
              />
            ) : (
              <div className="prose prose-slate max-w-none">
                <p className="text-foreground leading-relaxed text-lg whitespace-pre-wrap">
                  {data?.description ?? emptyDescriptionText}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Documento Atual */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileText size={14} />
            Documento Atual
          </h3>
          {currentApprovedVersion?.fileName ? (
            <div className="p-6 bg-muted rounded-xl border border-border flex items-center gap-8 group shadow-sm">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 bg-card rounded-lg flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors shadow-sm border border-border shrink-0">
                  <FileText size={24} />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-foreground truncate">
                    {stripUuidSuffix(currentApprovedVersion.fileName)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Versão {currentApprovedVersion.version} — Aprovado por{" "}
                    {currentApprovedVersion.uploadedBy?.firstName}{" "}
                    {currentApprovedVersion.uploadedBy?.lastName} em{" "}
                    {formatDate(currentApprovedVersion.uploadedAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleDownload(currentApprovedVersion.versionId, currentApprovedVersion.fileName)
                }
                className="flex items-center gap-1.5 px-3 py-1.5 bg-card text-foreground rounded-lg text-xs font-bold hover:bg-muted transition-all border border-border shadow-sm cursor-pointer shrink-0"
              >
                <ExternalLink size={14} />
                Descarregar
              </button>
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
              <FileText className="mx-auto text-muted-foreground mb-3" size={32} />
              <p className="text-sm text-muted-foreground font-medium">
                {latestVersion ? "Nenhuma versão aprovada" : "Nenhum documento carregado"}
              </p>
              <p className="text-xs text-muted-foreground mt-1 mb-6">
                {latestVersion
                  ? `A versão ${latestVersion.version} está em revisão — vá ao histórico de versões para a aprovar.`
                  : "Carregue um documento para criar a primeira versão."}
              </p>
              {!isExternal && (
                <button
                  onClick={handleOpenUpload}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 cursor-pointer"
                >
                  <Upload size={18} />
                  {latestVersion ? "Carregar Nova Versão" : "Carregar Documento"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Version History */}
        {sortedVersions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <History size={14} />
              Histórico de Versões
            </h3>
            {sortedVersions.map((v: DocumentVersionResponse) => (
              <div
                key={v.versionId}
                className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        v.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-bold text-foreground text-lg">Versão {v.version}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusBadge(v.status)}`}
                        >
                          {statusLabel(v.status)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatDate(v.uploadedAt)} por {v.uploadedBy?.firstName}{" "}
                          {v.uploadedBy?.lastName}
                        </div>
                      </div>
                      {v.fileName && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Ficheiro: {stripUuidSuffix(v.fileName)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {v.fileName && (
                      <button
                        onClick={() => handleDownload(v.versionId, v.fileName)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-card text-foreground rounded-lg text-xs font-bold hover:bg-muted transition-colors border border-border shadow-sm cursor-pointer"
                      >
                        <ExternalLink size={14} />
                        {stripUuidSuffix(v.fileName)}
                      </button>
                    )}
                    {v.status === "UNDER_REVIEW" && !isExternal && (
                      <button
                        onClick={() => approveMutation.mutate(v.versionId)}
                        disabled={approveMutation.isPending}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} />
                        Aprovar
                      </button>
                    )}
                    {v.status !== "APPROVED" && !isExternal && (
                      <button
                        onClick={() => deleteVersionMutation.mutate(v.versionId)}
                        disabled={deleteVersionMutation.isPending}
                        className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                        title="Eliminar versão"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Version Dialog */}
      {isVersionDialogOpen && !isExternal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-8">
            <h2 className="text-xl font-bold text-foreground mb-2">Nova Versão do Documento</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Isto irá criar uma nova versão do documento para aprovação formal.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Versão
                </label>
                <p className="px-4 py-3 bg-muted border border-border rounded-xl text-sm text-foreground font-medium">
                  {versions.length
                    ? Math.max(...versions.map((v: DocumentVersionResponse) => v.version)) + 1
                    : 1}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Anexar Documento
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="document-file-upload"
                    className="hidden"
                    onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                  />
                  <label
                    htmlFor="document-file-upload"
                    className="flex items-center justify-between w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm cursor-pointer hover:bg-muted/80 transition-all"
                  >
                    <span
                      className={
                        uploadFile ? "text-foreground font-medium" : "text-muted-foreground"
                      }
                    >
                      {uploadFile ? uploadFile.name : "Selecionar ficheiro PDF ou Word..."}
                    </span>
                    <Upload size={16} className="text-muted-foreground" />
                  </label>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => {
                    setIsVersionDialogOpen(false);
                    setUploadFile(null);
                  }}
                  className="flex-1 px-4 py-3 bg-card border border-border text-foreground font-bold rounded-xl hover:bg-muted transition-all text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUploadSubmit}
                  disabled={!uploadFile || uploadMutation.isPending}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 cursor-pointer"
                >
                  {uploadMutation.isPending ? "A carregar..." : "Criar Versão"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    {entityType && (
        <LogDialog
          open={logOpen}
          onOpenChange={setLogOpen}
          entityType={entityType}
          title={`Histórico — ${descriptionLabel}`}
        />
      )}
    </div>
  );
}
