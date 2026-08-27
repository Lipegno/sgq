import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    FileText,
    Upload,
    ExternalLink,
    CheckCircle2,
    History,
    Clock,
    Plus,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
    approveDocumentVersion,
    deleteDocumentVersion,
    downloadDocumentVersion,
    getMacroProcessDiagram,
    stripUuidSuffix,
    uploadMacroProcessDiagram,
} from "@/api/core";

import { useAuth } from "@/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import type { DocumentVersionResponse, DocumentStatus } from "@/types";

interface Props {
    yearId: number;
    year?: number;
}

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

export function MacroProcessDiagramCard({ yearId, year }: Props) {
    const { user, isExternal } = useAuth();
    const queryClient = useQueryClient();

    const [uploadOpen, setUploadOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    const queryKey = ["macro-process-diagram", yearId];

    const { data, isLoading, isError } = useQuery({
        queryKey,
        queryFn: () => getMacroProcessDiagram(yearId),
    });

    const versions = data?.document?.versions ?? [];

    const sortedVersions = [...versions].sort(
        (a: DocumentVersionResponse, b: DocumentVersionResponse) =>
            b.version - a.version,
    );

    const latestVersion = sortedVersions[0] ?? null;

    const currentApprovedVersion = versions.find(
        (v: DocumentVersionResponse) => v.status === "APPROVED",
    );

    const nextVersion = versions.length
        ? Math.max(
            ...versions.map(
                (v: DocumentVersionResponse) => v.version,
            ),
        ) + 1
        : 1;

    const uploadMutation = useMutation({
        mutationFn: () => {
            if (!uploadFile) {
                throw new Error("Nenhum ficheiro selecionado");
            }

            return uploadMacroProcessDiagram(
                yearId,
                uploadFile,
                nextVersion,
                Number(user?.id ?? 1),
                data?.document?.documentId ?? null,
            );
        },

        onSuccess: () => {
            toast.success("Diagrama carregado com sucesso!");
            queryClient.invalidateQueries({ queryKey });
            setUploadFile(null);
            setUploadOpen(false);
        },

        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message ??
                "Erro ao carregar o diagrama",
            );
        },
    });

    const approveMutation = useMutation({
        mutationFn: approveDocumentVersion,

        onSuccess: () => {
            toast.success("Versão aprovada com sucesso!");
            queryClient.invalidateQueries({ queryKey });
        },

        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message ??
                "Erro ao aprovar a versão",
            );
        },
    });

    const pendingVersions = versions.filter(
        (v: DocumentVersionResponse) => v.status === "UNDER_REVIEW"
    );

    const deleteMutation = useMutation({
        mutationFn: deleteDocumentVersion,

        onSuccess: () => {
            toast.success("Versão eliminada com sucesso!");
            queryClient.invalidateQueries({ queryKey });
        },

        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message ??
                "Erro ao eliminar a versão",
            );
        },
    });

    if (isLoading) {
        return <Skeleton className="h-40 w-full rounded-2xl" />;
    }

    if (isError) {
        return (
            <div className="border border-destructive/30 rounded-2xl p-6">
                <p className="text-sm text-destructive">
                    Erro ao carregar o diagrama de macroprocessos.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                            <FileText size={20} />
                        </div>

                        <div>
                            <h3 className="font-bold text-foreground">
                                Diagrama de Macroprocessos
                            </h3>

                            <p className="text-xs text-muted-foreground mt-0.5">
                                Mapa global dos macroprocessos em vigor no ciclo
                                {year ? ` de ${year}` : ""}.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {versions.length > 0 && (
                            <button
                                onClick={() => setShowHistory((value) => !value)}
                                className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
                                title="Histórico de versões"
                            >
                                <History size={18} />
                            </button>
                        )}

                        {!isExternal && (
                            <button
                                onClick={() => {
                                    setUploadFile(null);
                                    setUploadOpen(true);
                                }}
                                className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg font-bold text-xs hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
                            >
                                <Plus size={16} />
                                {versions.length
                                    ? "Nova Versão"
                                    : "Carregar Diagrama"}
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    {pendingVersions.length > 0 && (
                        <div className="mb-4 p-4 rounded-xl border border-amber-200 bg-amber-50 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Clock size={18} className="text-amber-600 shrink-0" />

                                <div>
                                    <p className="text-sm font-bold text-amber-800">
                                        {pendingVersions.length === 1
                                            ? "Existe 1 versão por aprovar"
                                            : `Existem ${pendingVersions.length} versões por aprovar`}
                                    </p>

                                    <p className="text-xs text-amber-700 mt-0.5">
                                        Consulte {pendingVersions.length === 1 ? "a versão" : "as versões"} pendente
                                        {pendingVersions.length === 1 ? "" : "s"} antes da aprovação.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowHistory(true)}
                                className="px-3 py-2 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors cursor-pointer shrink-0"
                            >
                                Rever e aprovar
                            </button>
                        </div>
                    )}
                    {currentApprovedVersion?.fileName ? (
                        <div className="p-5 bg-muted rounded-xl border border-border flex items-center gap-6 group">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-12 h-12 bg-card rounded-lg flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors border border-border shrink-0">
                                    <FileText size={24} />
                                </div>

                                <div className="min-w-0">
                                    <p className="font-bold text-foreground truncate">
                                        {stripUuidSuffix(
                                            currentApprovedVersion.fileName,
                                        )}
                                    </p>

                                    <p className="text-xs text-muted-foreground mt-1">
                                        Versão {currentApprovedVersion.version} ·{" "}
                                        {currentApprovedVersion.uploadedBy?.firstName}{" "}
                                        {currentApprovedVersion.uploadedBy?.lastName} ·{" "}
                                        {formatDate(currentApprovedVersion.uploadedAt)}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() =>
                                    downloadDocumentVersion(
                                        currentApprovedVersion.versionId,
                                        currentApprovedVersion.fileName,
                                    )
                                }
                                className="flex items-center gap-1.5 px-3 py-2 bg-card text-foreground rounded-lg text-xs font-bold hover:bg-muted border border-border shadow-sm cursor-pointer shrink-0"
                            >
                                <ExternalLink size={14} />
                                Descarregar
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
                            <FileText
                                className="mx-auto text-muted-foreground mb-3"
                                size={30}
                            />

                            <p className="text-sm font-medium text-muted-foreground">
                                {latestVersion
                                    ? "Nenhuma versão aprovada"
                                    : "Nenhum diagrama carregado"}
                            </p>

                            <p className="text-xs text-muted-foreground mt-1">
                                {latestVersion
                                    ? `A versão ${latestVersion.version} encontra-se em revisão.`
                                    : `Ainda não existe um mapa de macroprocessos para ${year ?? "este ano"
                                    }.`}
                            </p>
                        </div>
                    )}

                    {showHistory && sortedVersions.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-border space-y-3">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <History size={14} />
                                Histórico de Versões
                            </h4>

                            {sortedVersions.map(
                                (version: DocumentVersionResponse) => (
                                    <div
                                        key={version.versionId}
                                        className="flex items-center justify-between gap-4 p-4 border border-border rounded-xl"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <FileText
                                                size={18}
                                                className="text-muted-foreground shrink-0"
                                            />

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-sm">
                                                        Versão {version.version}
                                                    </p>

                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusBadge(
                                                            version.status,
                                                        )}`}
                                                    >
                                                        {statusLabel(version.status)}
                                                    </span>
                                                </div>

                                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                    <Clock size={11} />
                                                    {formatDate(version.uploadedAt)} ·{" "}
                                                    {stripUuidSuffix(version.fileName)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() =>
                                                    downloadDocumentVersion(
                                                        version.versionId,
                                                        version.fileName,
                                                    )
                                                }
                                                className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                                                title="Descarregar"
                                            >
                                                <ExternalLink size={15} />
                                            </button>

                                            {version.status === "UNDER_REVIEW" &&
                                                !isExternal && (
                                                    <button
                                                        onClick={() =>
                                                            approveMutation.mutate(
                                                                version.versionId,
                                                            )
                                                        }
                                                        className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 cursor-pointer"
                                                        title="Aprovar"
                                                    >
                                                        <CheckCircle2 size={16} />
                                                    </button>
                                                )}

                                            {version.status !== "APPROVED" &&
                                                !isExternal && (
                                                    <button
                                                        onClick={() =>
                                                            deleteMutation.mutate(
                                                                version.versionId,
                                                            )
                                                        }
                                                        className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive cursor-pointer"
                                                        title="Eliminar versão"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    )}
                </div>
            </div>

            {uploadOpen && !isExternal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-8">
                        <h2 className="text-xl font-bold text-foreground mb-2">
                            {versions.length
                                ? "Nova Versão do Diagrama"
                                : "Carregar Diagrama de Macroprocessos"}
                        </h2>

                        <p className="text-muted-foreground text-sm mb-6">
                            Documento relativo ao ciclo de {year ?? "qualidade"}.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                    Versão
                                </label>

                                <p className="px-4 py-3 bg-muted border border-border rounded-xl text-sm font-medium">
                                    {nextVersion}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                    Documento
                                </label>

                                <input
                                    type="file"
                                    id="macro-process-diagram-upload"
                                    className="hidden"
                                    onChange={(e) =>
                                        setUploadFile(e.target.files?.[0] ?? null)
                                    }
                                />

                                <label
                                    htmlFor="macro-process-diagram-upload"
                                    className="flex items-center justify-between w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm cursor-pointer hover:bg-muted/80"
                                >
                                    <span
                                        className={
                                            uploadFile
                                                ? "text-foreground font-medium truncate"
                                                : "text-muted-foreground"
                                        }
                                    >
                                        {uploadFile
                                            ? uploadFile.name
                                            : "Selecionar ficheiro..."}
                                    </span>

                                    <Upload
                                        size={16}
                                        className="text-muted-foreground shrink-0"
                                    />
                                </label>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => {
                                        setUploadOpen(false);
                                        setUploadFile(null);
                                    }}
                                    className="flex-1 px-4 py-3 bg-card border border-border text-foreground font-bold rounded-xl hover:bg-muted text-sm cursor-pointer"
                                >
                                    Cancelar
                                </button>

                                <button
                                    onClick={() => uploadMutation.mutate()}
                                    disabled={
                                        !uploadFile || uploadMutation.isPending
                                    }
                                    className="flex-1 px-4 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {uploadMutation.isPending
                                        ? "A carregar..."
                                        : versions.length
                                            ? "Criar Versão"
                                            : "Carregar"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}