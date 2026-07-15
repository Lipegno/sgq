import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getYears,
  getSwotAnalysis,
  updateSwotAnalysis,
  getSwotYearDetail,
  createSwotItem,
  updateSwotItem,
  deleteSwotItem,
  updateSwotItemYears,
  uploadSwotDocument,
  deleteSwotDocument,
  downloadDocumentVersion,
} from "@/api/core";
import type { SwotItemType, SwotItemResponse, SwotYearDetail } from "@/types";
import { YearSelector } from "@/components/year-selector";
import YearAssociationDialog from "@/components/year-association-dialog";
import ConfirmDialog from "@/components/confirm-dialog";
import { LogDialog } from "@/components/log-dialog";
import type { EntityType } from "@/types";
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
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import {
  Target,
  TrendingUp,
  AlertCircle,
  Plus as PlusIcon,
  ShieldAlert,
  X,
  Trash2,
  FileText,
  Upload,
  Download,
  Save,
  Calendar,
  Activity,
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

const QUADRANT_CONFIG: {
  type: SwotItemType;
  label: string;
  category: string;
  color: string;
  icon: typeof Target;
}[] = [
  {
    type: "STRENGTH",
    label: "Forças",
    category: "Interno",
    color: "emerald",
    icon: TrendingUp,
  },
  {
    type: "WEAKNESS",
    label: "Fraquezas",
    category: "Interno",
    color: "rose",
    icon: AlertCircle,
  },
  {
    type: "OPPORTUNITY",
    label: "Oportunidades",
    category: "Externo",
    color: "blue",
    icon: PlusIcon,
  },
  {
    type: "THREAT",
    label: "Ameaças",
    category: "Externo",
    color: "amber",
    icon: ShieldAlert,
  },
];

const colorMap: Record<
  string,
  { border: string; text: string; bg: string; bgLight: string; dot: string }
> = {
  emerald: {
    border: "border-emerald-200",
    text: "text-emerald-600",
    bg: "bg-emerald-100",
    bgLight: "bg-emerald-50",
    dot: "bg-emerald-400",
  },
  rose: {
    border: "border-rose-200",
    text: "text-rose-600",
    bg: "bg-rose-100",
    bgLight: "bg-rose-50",
    dot: "bg-rose-400",
  },
  blue: {
    border: "border-blue-200",
    text: "text-blue-600",
    bg: "bg-blue-100",
    bgLight: "bg-blue-50",
    dot: "bg-blue-400",
  },
  amber: {
    border: "border-amber-200",
    text: "text-amber-600",
    bg: "bg-amber-100",
    bgLight: "bg-amber-50",
    dot: "bg-amber-400",
  },
};

function getItems(yearDetail: SwotYearDetail | undefined, type: SwotItemType): SwotItemResponse[] {
  if (!yearDetail) return [];
  switch (type) {
    case "STRENGTH":
      return yearDetail.strengths;
    case "WEAKNESS":
      return yearDetail.weaknesses;
    case "OPPORTUNITY":
      return yearDetail.opportunities;
    case "THREAT":
      return yearDetail.threats;
  }
}

export default function SwotAnalysisPage() {
  const { user, isExternal } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"matrix" | "documents">("matrix");
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [expandedQuadrant, setExpandedQuadrant] = useState<SwotItemType | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addText, setAddText] = useState("");
  const [addType, setAddType] = useState<SwotItemType>("STRENGTH");
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editingDescription, setEditingDescription] = useState(false);
  const [yearAssociateItemId, setYearAssociateItemId] = useState<number | null>(null);
  const [swotAssociatedYearIds, setSwotAssociatedYearIds] = useState<Set<number>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<{
    type: "document" | "item";
    id: number;
  } | null>(null);
  const [pageLogOpen, setPageLogOpen] = useState(false);

  const { data: swotAnalysis } = useQuery({
    queryKey: ["swot-analysis"],
    queryFn: getSwotAnalysis,
  });

  const { data: allYears } = useQuery({ queryKey: ["years"], queryFn: getYears });
  const effectiveYearId = selectedYearId;

  useEffect(() => {
    if (selectedYearId !== null) return;
    if (!allYears || allYears.length === 0) return;
    const currentYearVal = new Date().getFullYear();
    const match = allYears.find(y => y.year === currentYearVal) ?? allYears[0];
    setSelectedYearId(match.id);
  }, [selectedYearId, allYears]);

  const { data: yearDetail } = useQuery({
    queryKey: ["swot-year-detail", effectiveYearId],
    queryFn: () => getSwotYearDetail(effectiveYearId!),
    enabled: !!effectiveYearId,
  });

  const updateDescriptionMutation = useMutation({
    mutationFn: (description: string) => updateSwotAnalysis(description),
    onSuccess: () => {
      toast.success("Descrição atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["swot-analysis"] });
      setEditingDescription(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao atualizar descrição");
    },
  });

  const createItemMutation = useMutation({
    mutationFn: (data: { text: string; type: SwotItemType; yearIds: number[] }) =>
      createSwotItem(data),
    onSuccess: () => {
      toast.success("Fator adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["swot-year-detail", effectiveYearId] });
      setAddDialogOpen(false);
      setAddText("");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao adicionar fator");
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, text }: { itemId: number; text: string }) =>
      updateSwotItem(itemId, text),
    onSuccess: () => {
      toast.success("Fator atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["swot-year-detail", effectiveYearId] });
      setEditItemId(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao atualizar fator");
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: deleteSwotItem,
    onSuccess: () => {
      toast.success("Fator eliminado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["swot-year-detail", effectiveYearId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao eliminar fator");
    },
  });

  const uploadDocMutation = useMutation({
    mutationFn: (file: File) => uploadSwotDocument(file, user!.id),
    onSuccess: () => {
      toast.success("Documento carregado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["swot-analysis"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao carregar documento");
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: deleteSwotDocument,
    onSuccess: () => {
      toast.success("Documento eliminado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["swot-analysis"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao eliminar documento");
    },
  });

  const associateYearsMutation = useMutation({
    mutationFn: ({
      itemId,
      associateYearIds,
      disassociateYearIds,
    }: {
      itemId: number;
      associateYearIds: number[];
      disassociateYearIds: number[];
    }) => updateSwotItemYears(itemId, associateYearIds, disassociateYearIds),
    onSuccess: (_data, variables) => {
      toast.success("Anos associados com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["swot-year-detail", effectiveYearId] });
      setSwotAssociatedYearIds(prev => {
        const next = new Set(prev);
        variables.associateYearIds.forEach(yid => next.add(yid));
        variables.disassociateYearIds.forEach(yid => next.delete(yid));
        return next;
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao associar anos");
    },
  });

  const handleStartEdit = (item: SwotItemResponse) => {
    setEditItemId(item.id);
    setEditText(item.text);
  };

  const handleSaveEdit = () => {
    if (!editItemId || !editText.trim()) return;
    updateItemMutation.mutate({ itemId: editItemId, text: editText.trim() });
  };

  const handleAddItem = () => {
    if (!addText.trim() || !effectiveYearId) return;
    createItemMutation.mutate({
      text: addText.trim(),
      type: addType,
      yearIds: [effectiveYearId],
    });
  };

  const handleOpenAdd = (type: SwotItemType) => {
    setAddType(type);
    setAddText("");
    setAddDialogOpen(true);
  };

  const handleDownload = (versionId: number, fileName: string) => {
    downloadDocumentVersion(versionId, fileName);
  };

  const documents = swotAnalysis?.documents ?? [];

  const strengths = getItems(yearDetail, "STRENGTH");
  const weaknesses = getItems(yearDetail, "WEAKNESS");
  const opportunities = getItems(yearDetail, "OPPORTUNITY");
  const threats = getItems(yearDetail, "THREAT");

  return (
    <div className="py-8 w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 shadow-sm">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Análise SWOT</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Planeamento estratégico para análise do ambiente interno e externo.
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
          <YearSelector selectedYearId={effectiveYearId} onYearChange={setSelectedYearId} />
          <div className="flex bg-muted p-0.5 rounded-lg border border-border gap-0.5">
            <button
              onClick={() => setActiveTab("matrix")}
              className={`px-4 h-8 rounded-md text-sm font-bold transition-all ${activeTab === "matrix" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Matriz
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`px-4 h-8 rounded-md text-sm font-bold transition-all ${activeTab === "documents" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Documentos
            </button>
          </div>
        </div>
      </div>

      {activeTab === "matrix" && (
        <div className="space-y-8">
          {/* Matrix Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {QUADRANT_CONFIG.map(config => {
              const items = getItems(yearDetail, config.type);
              const colors = colorMap[config.color];
              const Icon = config.icon;
              return (
                <div
                  key={config.type}
                  onClick={() => setExpandedQuadrant(config.type)}
                  className={`group flex flex-col h-full rounded-2xl border-2 border-dashed ${colors.border} p-6 bg-card/50 cursor-pointer hover:bg-card hover:border-solid transition-all relative overflow-hidden`}
                >
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm bg-card ${colors.text}`}
                      >
                        <Icon size={20} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-0.5">
                          {config.category}
                        </p>
                        <h3 className="font-bold text-foreground uppercase tracking-wider leading-none">
                          {config.label}
                        </h3>
                      </div>
                    </div>
                    {!isExternal && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleOpenAdd(config.type);
                        }}
                        className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-all shadow-sm"
                      >
                        <PlusIcon size={18} />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-center items-center py-4 relative z-10">
                    <div className="text-4xl font-black text-foreground mb-2">{items.length}</div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Fatores Identificados
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between relative z-10">
                    <div className="flex -space-x-2 overflow-hidden">
                      {items.slice(0, 3).map((item, i) => (
                        <div
                          key={item.id}
                          className="w-6 h-6 rounded-full border-2 border-card flex items-center justify-center text-[8px] font-bold text-white shadow-sm"
                          style={{
                            backgroundColor: i === 0 ? "#10b981" : i === 1 ? "#ef4444" : "#3b82f6",
                            zIndex: 10 - i,
                          }}
                        >
                          {item.text.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {items.length > 3 && (
                        <div className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground shadow-sm">
                          +{items.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase group-hover:text-foreground transition-colors">
                      Ver Detalhes
                    </div>
                  </div>

                  <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                    <Icon size={120} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Description */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Descrição
              </h3>
              {!editingDescription && !isExternal && (
                <button
                  onClick={() => {
                    setEditDescription(swotAnalysis?.description ?? "");
                    setEditingDescription(true);
                  }}
                  className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  Editar
                </button>
              )}
            </div>
            {editingDescription ? (
              <div className="space-y-3">
                <textarea
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  rows={3}
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  placeholder="Descreva o contexto da análise SWOT..."
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateDescriptionMutation.mutate(editDescription)}
                    disabled={updateDescriptionMutation.isPending}
                  >
                    <Save size={14} className="mr-1" />
                    Guardar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingDescription(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {swotAnalysis?.description || "Sem descrição definida."}
              </p>
            )}
          </div>

          {/* Summary Bar */}
          <div className="bg-card rounded-2xl border border-border p-6 flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">
                  Análise Interna
                </span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-sm font-bold text-foreground">
                      {strengths.length} Forças
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="text-sm font-bold text-foreground">
                      {weaknesses.length} Fraquezas
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">
                  Análise Externa
                </span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-sm font-bold">{opportunities.length} Oportunidades</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-sm font-bold">{threats.length} Ameaças</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total de Fatores</p>
                <p className="text-sm font-bold text-foreground">
                  {strengths.length + weaknesses.length + opportunities.length + threats.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "documents" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Documentos da Análise SWOT
            </h3>
            {!isExternal && (
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all text-sm shadow-lg shadow-primary/20">
                <Upload size={16} />
                Carregar Documento
                <input
                  type="file"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) uploadDocMutation.mutate(file);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>

          {documents.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-sm">
              <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-bold text-muted-foreground">Nenhum documento</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Carregue documentos relacionados com a análise SWOT.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map(doc => {
                const latest = doc.versions?.[doc.versions.length - 1];
                return (
                  <div
                    key={doc.documentId}
                    className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {latest?.fileName
                            ? latest.fileName.replace(/_[0-9a-f-]{36}\./, ".")
                            : "Documento"}
                        </p>
                        {latest && (
                          <p className="text-xs text-muted-foreground">
                            {latest.uploadedBy
                              ? `${latest.uploadedBy.firstName} ${latest.uploadedBy.lastName} · `
                              : ""}
                            {new Date(latest.uploadedAt).toLocaleDateString("pt-PT")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {latest && (
                        <button
                          onClick={() => handleDownload(latest.versionId, latest.fileName)}
                          className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="Descarregar"
                        >
                          <Download size={18} />
                        </button>
                      )}
                      {!isExternal && (
                        <button
                          onClick={() => setConfirmDelete({ type: "document", id: doc.documentId })}
                          className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Expanded Quadrant Modal */}
      {expandedQuadrant && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-background rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-card shrink-0">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                    colorMap[
                      QUADRANT_CONFIG.find(c => c.type === expandedQuadrant)?.color ?? "emerald"
                    ].bg
                  } ${
                    colorMap[
                      QUADRANT_CONFIG.find(c => c.type === expandedQuadrant)?.color ?? "emerald"
                    ].text
                  }`}
                >
                  {(() => {
                    const Icon =
                      QUADRANT_CONFIG.find(c => c.type === expandedQuadrant)?.icon ?? Target;
                    return <Icon size={24} />;
                  })()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {QUADRANT_CONFIG.find(c => c.type === expandedQuadrant)?.label}
                  </h2>
                  <p className="text-sm text-muted-foreground font-medium">
                    Reveja e gerencie todos os fatores identificados neste grupo.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!isExternal && (
                  <Button size="sm" onClick={() => handleOpenAdd(expandedQuadrant)}>
                    <PlusIcon size={18} />
                    Adicionar Fator
                  </Button>
                )}
                <button
                  onClick={() => setExpandedQuadrant(null)}
                  className="p-2.5 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors bg-background cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-muted/30">
              <div className="flex flex-col gap-4 max-w-3xl mx-auto">
                {getItems(yearDetail, expandedQuadrant).map(item => (
                  <div
                    key={item.id}
                    className="group bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
                  >
                    {editItemId === item.id ? (
                      <div className="space-y-3">
                        <textarea
                          className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                          rows={2}
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveEdit}>
                            Guardar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditItemId(null)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : !isExternal ? (
                      <div className="flex items-start justify-between">
                        <p className="text-sm text-foreground leading-relaxed flex-1">
                          {item.text}
                        </p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0 ml-3">
                              <MoreVertical size={16} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="z-[150]">
                            <DropdownMenuItem
                              onClick={() => {
                                setYearAssociateItemId(item.id);
                                setSwotAssociatedYearIds(new Set(item.years.map(y => y.yearId)));
                              }}
                            >
                              <Calendar size={14} />
                              Gerir Anos
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStartEdit(item)}>
                              <TrendingUp size={14} className="rotate-45" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setConfirmDelete({ type: "item", id: item.id })}
                            >
                              <Trash2 size={14} />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ) : (
                      <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
                    )}
                  </div>
                ))}
                {getItems(yearDetail, expandedQuadrant).length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <PlusIcon size={48} className="mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-bold text-muted-foreground tracking-tight">
                      Nenhum fator identificado
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Comece por adicionar um novo fator a este grupo.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-8 py-4 border-t border-border bg-card flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Total: {getItems(yearDetail, expandedQuadrant).length} Fatores
              </span>
              <Button variant="outline" size="sm" onClick={() => setExpandedQuadrant(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Dialog */}
      {addDialogOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg p-8">
            <h2 className="text-xl font-bold text-foreground mb-2">
              Adicionar {QUADRANT_CONFIG.find(c => c.type === addType)?.label}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Identifique um novo fator para a análise estratégica.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Texto do Fator
                </label>
                <textarea
                  placeholder="Descreva o fator identificado..."
                  className="w-full h-24 px-4 py-3 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  value={addText}
                  onChange={e => setAddText(e.target.value)}
                />
              </div>
              <div className="pt-4 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setAddDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 shadow-lg shadow-primary/20"
                  onClick={handleAddItem}
                  disabled={!addText.trim()}
                >
                  Adicionar Fator
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Year Association Dialog */}
      <YearAssociationDialog
        open={yearAssociateItemId !== null}
        onOpenChange={open => {
          if (!open) setYearAssociateItemId(null);
        }}
        title="Gerir Anos"
        description="Selecione os anos em que este fator deve estar presente."
        allYears={allYears ?? []}
        associatedYearIds={swotAssociatedYearIds}
        currentYearId={effectiveYearId}
        overlayClassName="z-[130] backdrop-blur-sm"
        contentClassName="z-[131]"
        onAssociate={yearId => {
          if (yearAssociateItemId !== null) {
            associateYearsMutation.mutate({
              itemId: yearAssociateItemId,
              associateYearIds: [yearId],
              disassociateYearIds: [],
            });
          }
        }}
        onDisassociate={yearId => {
          if (yearAssociateItemId !== null) {
            associateYearsMutation.mutate({
              itemId: yearAssociateItemId,
              associateYearIds: [],
              disassociateYearIds: [yearId],
            });
          }
        }}
        isPending={associateYearsMutation.isPending}
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={open => {
          if (!open) setConfirmDelete(null);
        }}
        title={confirmDelete?.type === "item" ? "Eliminar Fator" : "Eliminar Documento"}
        description={
          confirmDelete?.type === "item"
            ? "Esta ação é irreversível e eliminará o fator de todos os anos associados. Se pretende apenas desassociar de um ano específico, utilize a opção de gestão de anos. Tem a certeza que deseja eliminar este fator SWOT?"
            : "Tem a certeza que deseja eliminar este documento?"
        }
        confirmLabel="Eliminar"
        overlayClassName="z-[140]"
        contentClassName="z-[150]"
        onConfirm={() => {
          if (confirmDelete?.type === "item") {
            deleteItemMutation.mutate(confirmDelete.id);
          } else if (confirmDelete?.type === "document") {
            deleteDocMutation.mutate(confirmDelete.id);
          }
        }}
      />

      <LogDialog
        open={pageLogOpen}
        onOpenChange={setPageLogOpen}
        entityTypes={["SWOT_ANALYSIS", "SWOT_ITEM"] as EntityType[]}
        yearId={effectiveYearId ?? undefined}
        title="Histórico — Análise SWOT"
      />
    </div>
  );
}
