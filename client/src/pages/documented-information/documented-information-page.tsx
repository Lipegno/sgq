import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, FileText, FolderOpen, History, Link2, Save } from "lucide-react";
import { getDocumentedInformation, updateDocumentedInformation } from "@/api/core";
import { useAuth } from "@/context/auth-context";
import { LogDialog } from "@/components/log-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const QUERY_KEY = ["documented-information"];

function isWebUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function DocumentedInformationPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canEdit = user?.roles?.includes("ROLE_SUPERADMIN") ?? false;

  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [logOpen, setLogOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getDocumentedInformation,
  });

  const updateMutation = useMutation({
    mutationFn: updateDocumentedInformation,
    onSuccess: () => {
      toast.success("Atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setIsEditing(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao atualizar");
    },
  });

  const urlError = isEditing && url.trim() !== "" && !isWebUrl(url)
    ? "Indique o endereço completo, começando por https://"
    : null;

  const handleEdit = () => {
    setDescription(data?.description ?? "");
    setUrl(data?.url ?? "");
    setIsEditing(true);
  };

  const handleSave = () => {
    if (urlError) return;
    updateMutation.mutate({ description, url: url.trim() });
  };

  if (isLoading) {
    return (
      <div className="py-8 w-full max-w-5xl mx-auto flex flex-col gap-4">
        <Skeleton className="h-10 w-1/3 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
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
            <FolderOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Informação Documentada</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Ligação para a biblioteca de informação documentada do SGQ.
            </p>
          </div>
        </div>
        <button
          onClick={() => setLogOpen(true)}
          className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
          title="Histórico de alterações"
        >
          <History size={20} />
        </button>
      </div>

      <div className="space-y-8">
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-muted-foreground" />
              <h3 className="font-bold text-foreground">Enquadramento</h3>
            </div>
            {canEdit && !isEditing && (
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
                  onClick={() => setIsEditing(false)}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending || !!urlError}
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
                className="w-full h-40 p-4 bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all leading-relaxed"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva como está organizada a informação documentada..."
              />
            ) : (
              <p className="text-foreground leading-relaxed text-lg whitespace-pre-wrap">
                {data?.description || "Ainda não foi definido nenhum enquadramento."}
              </p>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Link2 size={14} />
            Biblioteca no SharePoint
          </h3>
          {isEditing ? (
            <div>
              <input
                type="url"
                className="w-full p-3 bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
              {urlError ? (
                <p className="text-destructive text-xs mt-2">{urlError}</p>
              ) : (
                <p className="text-muted-foreground text-xs mt-2">
                  Use uma ligação permanente da pasta (Partilhar › Copiar ligação). Deixe vazio para remover.
                </p>
              )}
            </div>
          ) : data?.url ? (
            <div className="p-6 bg-muted rounded-xl border border-border flex items-center gap-6">
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-foreground">Informação documentada do SGQ</p>
                <p className="text-xs text-muted-foreground mt-1 break-all" title={data.url}>
                  {data.url}
                </p>
              </div>
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 transition-all shadow-sm"
              >
                <ExternalLink size={16} />
                Abrir no SharePoint
              </a>
            </div>
          ) : (
            <p className="text-muted-foreground italic">
              {canEdit
                ? 'Ainda não foi definida a ligação. Clique em "Editar" para a adicionar.'
                : "Ainda não foi definida a ligação."}
            </p>
          )}
        </div>
      </div>

      <LogDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        entityType="DOCUMENTED_INFORMATION"
        title="Histórico — Informação Documentada"
      />
    </div>
  );
}
