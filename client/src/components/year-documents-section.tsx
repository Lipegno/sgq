import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DocumentVersionResponse } from "@/types";
import {
  deleteDocumentVersion,
  downloadDocumentVersion,
  stripUuidSuffix,
} from "@/api/core";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import {
  FileText,
  Download,
  Upload,
  Trash2,
} from "lucide-react";


function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

interface YearDocumentsSectionProps {
  documents: { documentId: number; versions: DocumentVersionResponse[] }[];
  queryKey: string[];
  uploadFn: (file: File, version: number, uploadedById: number, existingDocumentId?: number | null) => Promise<unknown>;
  versioned?: boolean;
}

export function YearDocumentsSection({ documents, queryKey, uploadFn, versioned = true }: YearDocumentsSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadVersion, setUploadVersion] = useState(1);
  const [existingDocId, setExistingDocId] = useState<number | null>(null);

  const allVersions = documents.flatMap((d) =>
    d.versions.map((v) => ({ ...v, documentId: d.documentId })),
  );

  const approvedVersions = allVersions.filter((v) => v.status === "APPROVED");
  const latestApproved = approvedVersions.length > 0
    ? approvedVersions.sort((a, b) => b.version - a.version)[0]
    : null;

  const nextVersion = allVersions.length > 0
    ? Math.max(...allVersions.map((v) => v.version)) + 1
    : 1;

  const handleUploadMutation = () => {
    if (!uploadFile) throw new Error("Nenhum ficheiro selecionado");
    if (!versioned) {
      return uploadFn(uploadFile, 1, Number(user?.id ?? 1), null);
    }
    return uploadFn(uploadFile, uploadVersion, Number(user?.id ?? 1), existingDocId);
  };

  const uploadMutation = useMutation({
    mutationFn: handleUploadMutation,
    onSuccess: () => {
      toast.success("Documento carregado com sucesso!");
      queryClient.invalidateQueries({ queryKey });
      setUploadOpen(false);
      setUploadFile(null);
      setUploadVersion(1);
      setExistingDocId(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao carregar o documento");
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

  const handleUploadNew = () => {
    setExistingDocId(null);
    setUploadVersion(nextVersion);
    setUploadFile(null);
    setUploadOpen(true);
  };

  const handleUploadNewVersion = (docId: number) => {
    const doc = documents.find((d) => d.documentId === docId);
    const maxV = doc ? Math.max(...doc.versions.map((v) => v.version)) + 1 : 1;
    setExistingDocId(docId);
    setUploadVersion(maxV);
    setUploadFile(null);
    setUploadOpen(true);
  };

  const uploadDialogTitle = versioned ? "Nova Versão do Documento" : "Carregar Documento";
  const uploadDialogDesc = versioned ? "Carregue uma nova versão do documento." : "Carregue um novo documento de evidência.";

  if (!versioned) {
    return (
      <NonVersionedDocumentList
        documents={documents}
        queryKey={queryKey}
        uploadMutation={uploadMutation}
        uploadOpen={uploadOpen}
        setUploadOpen={setUploadOpen}
        uploadFile={uploadFile}
        setUploadFile={setUploadFile}
        uploadDialogTitle={uploadDialogTitle}
        uploadDialogDesc={uploadDialogDesc}
        onUploadNew={handleUploadNew}
        deleteVersionMutation={deleteVersionMutation}
      />
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <FileText className="size-12 mb-3 opacity-40" />
        <p className="text-sm">Nenhum documento para este ano.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {documents.map((doc) => (
        <div key={doc.documentId} className="space-y-2">
          {[...doc.versions]
            .sort((a, b) => b.version - a.version)
            .map((v) => (
                <div key={v.versionId} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-sm">{stripUuidSuffix(v.fileName)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {v.uploadedBy?.firstName} {v.uploadedBy?.lastName} · {formatDate(v.uploadedAt)}
                    </span>
                    {v.downloadUrl && (
                      <Button variant="ghost" size="icon-sm" onClick={() => downloadDocumentVersion(v.versionId, v.fileName)} title="Descarregar">
                        <Download className="size-4" />
                      </Button>
                    )}
                    {v.status !== "APPROVED" && (
                      <Button variant="ghost" size="icon-sm" onClick={() => deleteVersionMutation.mutate(v.versionId)} disabled={deleteVersionMutation.isPending} title="Eliminar versão">
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
        </div>
      ))}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{uploadDialogTitle}</DialogTitle>
            <DialogDescription>{uploadDialogDesc}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="version">Versão</Label>
              <Input id="version" type="number" min={1} step={1} value={uploadVersion} onChange={(e) => setUploadVersion(Number(e.target.value))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="file">Ficheiro</Label>
              <Input id="file" type="file" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={() => uploadMutation.mutate()} disabled={!uploadFile || uploadMutation.isPending}>
              <Upload className="size-4" />
              {uploadMutation.isPending ? "A carregar..." : "Carregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---- Non-versioned (simple) document list ---- */

interface NonVersionedDocumentListProps {
  documents: { documentId: number; versions: DocumentVersionResponse[] }[];
  queryKey: string[];
  uploadMutation: any;
  uploadOpen: boolean;
  setUploadOpen: (open: boolean) => void;
  uploadFile: File | null;
  setUploadFile: (file: File | null) => void;
  uploadDialogTitle: string;
  uploadDialogDesc: string;
  onUploadNew: () => void;
  deleteVersionMutation: any;
}

function NonVersionedDocumentList({
  documents,
  queryKey,
  uploadMutation,
  uploadOpen,
  setUploadOpen,
  uploadFile,
  setUploadFile,
  uploadDialogTitle,
  uploadDialogDesc,
  onUploadNew,
  deleteVersionMutation,
}: NonVersionedDocumentListProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">Documentos</h3>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <FileText className="size-12 mb-3 opacity-40" />
          <p className="text-sm">Nenhum documento para este ano.</p>
          <p className="text-xs mt-1">Carregue um documento para começar.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const v = doc.versions[0];
            if (!v) return null;
            return (
              <div key={doc.documentId} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <FileText className="size-5 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{stripUuidSuffix(v.fileName)}</span>
                    <span className="text-xs text-muted-foreground">
                      {v.uploadedBy?.firstName} {v.uploadedBy?.lastName} · {formatDate(v.uploadedAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {v.downloadUrl && (
                    <Button variant="ghost" size="icon-sm" onClick={() => downloadDocumentVersion(v.versionId, v.fileName)} title="Descarregar">
                      <Download className="size-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon-sm" onClick={() => deleteVersionMutation.mutate(v.versionId)} disabled={deleteVersionMutation.isPending} title="Eliminar documento">
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{uploadDialogTitle}</DialogTitle>
            <DialogDescription>{uploadDialogDesc}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file">Ficheiro</Label>
              <Input id="file" type="file" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={() => uploadMutation.mutate()} disabled={!uploadFile || uploadMutation.isPending}>
              <Upload className="size-4" />
              {uploadMutation.isPending ? "A carregar..." : "Carregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}