import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { YearSelector } from "@/components/year-selector";
import { YearDocumentsSection } from "@/components/year-documents-section";
import { Skeleton } from "@/components/ui/skeleton";
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
  History,
  Save,
  Pencil,
  Plus,
  Upload,
} from "lucide-react";
import { LogDialog } from "@/components/log-dialog";
import { useAuth } from "@/context/auth-context";
import type { DocumentWithVersionsResponse, EntityType } from "@/types";

interface YearDetail {
  yearId: number;
  year: number;
  documents: DocumentWithVersionsResponse[];
}

interface SingletonWithYearsData {
  id: number;
  description: string | null;
  years: YearDetail[];
}

interface SingletonWithYearsPageProps {
  title: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  emptyDescriptionText: string;
  queryKey: string[];
  fetchFn: () => Promise<SingletonWithYearsData>;
  updateFn: (data: { description: string }) => Promise<SingletonWithYearsData>;
  uploadFn: (yearId: number, file: File, version: number, uploadedById: number, existingDocumentId?: number | null) => Promise<unknown>;
  yearDetailQueryKey: (yearId: number) => string[];
  yearDetailFetchFn: (yearId: number) => Promise<YearDetail>;
  versioned?: boolean;
  entityType?: EntityType;
  icon?: React.ReactNode;
}

export function SingletonWithYearsPage({
  title,
  descriptionLabel,
  descriptionPlaceholder,
  emptyDescriptionText,
  queryKey,
  fetchFn,
  updateFn,
  uploadFn,
  yearDetailQueryKey,
  yearDetailFetchFn,
  versioned = true,
  entityType,
  icon,
}: SingletonWithYearsPageProps) {
  const { user, isExternal, allowedYearIds } = useAuth();
  const queryClient = useQueryClient();
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [logOpen, setLogOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: fetchFn,
  });

  const { data: yearDetail } = useQuery({
    queryKey: selectedYearId ? yearDetailQueryKey(selectedYearId) : ["disabled"],
    queryFn: () => yearDetailFetchFn(selectedYearId!),
    enabled: selectedYearId !== null,
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
      if (!uploadFile || !selectedYearId) throw new Error("Nenhum ficheiro selecionado");
      const allDocs = yearDetail?.documents ?? [];
      const allVersions = allDocs.flatMap(d => d.versions);
      const nextV = allVersions.length > 0 ? Math.max(...allVersions.map(v => v.version)) + 1 : 1;
      return uploadFn(selectedYearId, uploadFile, nextV, Number(user?.id ?? 1), null);
    },
    onSuccess: () => {
      toast.success("Documento carregado com sucesso!");
      queryClient.invalidateQueries({ queryKey: selectedYearId ? yearDetailQueryKey(selectedYearId) : ["disabled"] });
      setUploadOpen(false);
      setUploadFile(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao carregar o documento");
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

  const handleYearChange = (yearId: number) => {
    setSelectedYearId(yearId);
  };

  useEffect(() => {
    if (!isExternal) return;
    if (selectedYearId !== null) return;
    if (!data?.years || data.years.length === 0) return;
    if (!allowedYearIds || allowedYearIds.length === 0) return;
    const currentYearVal = new Date().getFullYear();
    const allowed = data.years.filter(y => allowedYearIds.includes(y.yearId));
    const match = allowed.find(y => y.year === currentYearVal) ?? allowed[0];
    if (match) {
      setSelectedYearId(match.yearId);
    }
  }, [isExternal, selectedYearId, data?.years, allowedYearIds]);

  const documents = yearDetail?.documents ?? [];

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
          <YearSelector selectedYearId={selectedYearId} onYearChange={handleYearChange} />
          {selectedYearId !== null && !isExternal && (
            <Button onClick={() => { setUploadFile(null); setUploadOpen(true); }}>
              <Plus className="size-4" />
              Carregar Documento
            </Button>
          )}
        </div>
      </div>

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
                  {data?.description || emptyDescriptionText}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Document Evidence Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <FileText size={14} />
              Evidência Documental
            </h3>
          </div>
          {selectedYearId === null ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <FileText className="mx-auto text-muted-foreground mb-3" size={32} />
              <p className="text-sm">Selecione um ano para ver os documentos.</p>
            </div>
          ) : (
            <YearDocumentsSection
              documents={documents}
              queryKey={yearDetailQueryKey(selectedYearId)}
              uploadFn={(file, version, uploadedById, existingDocumentId) =>
                uploadFn(selectedYearId, file, version, uploadedById, existingDocumentId)
              }
              versioned={versioned}
            />
          )}
        </div>
      </div>

      {entityType && (
        <LogDialog
          open={logOpen}
          onOpenChange={setLogOpen}
          entityType={entityType}
          yearId={selectedYearId ?? undefined}
          title={`Histórico — ${descriptionLabel}`}
        />
      )}

      {uploadOpen && !isExternal && (
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Carregar Documento</DialogTitle>
            <DialogDescription>Carregue um novo documento de evidência.</DialogDescription>
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
    )}
    </div>
  );
}