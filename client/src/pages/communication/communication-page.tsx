import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  Plus,
  Search,
  Users,
  Globe,
  Calendar,
  User,
  MapPin,
  Activity,
  Send,
  Target,
  Box,
  Trash2,
  CalendarDays,
  Save,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import {
  getYears,
  getCommunicationByYear,
  updateCommunication,
  addCommunicationItem,
  updateCommunicationItem,
  deleteCommunicationItem,
  associateCommunicationItemYear,
  disassociateCommunicationItemYear,
} from "@/api/core";
import ConfirmDialog from "@/components/confirm-dialog";
import YearAssociationDialog from "@/components/year-association-dialog";
import { YearSelector } from "@/components/year-selector";
import { LogDialog } from "@/components/log-dialog";
import type { EntityType } from "@/types";
import type {
  CommunicationItemResponse,
  CommunicationType,
  CreateCommunicationItemRequest,
} from "@/types";

type TabFilter = "ALL" | CommunicationType;

const TABS: { key: TabFilter; label: string; icon: typeof Users }[] = [
  { key: "ALL", label: "Todas", icon: Send },
  { key: "INTERNAL", label: "Interna", icon: Users },
  { key: "EXTERNAL", label: "Externa", icon: Globe },
];

function tabColor(tab: TabFilter) {
  switch (tab) {
    case "INTERNAL":
      return "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400";
    case "EXTERNAL":
      return "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400";
    default:
      return "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400";
  }
}

export default function CommunicationPage() {
  const queryClient = useQueryClient();
  const { isExternal } = useAuth();

  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabFilter>("ALL");

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const viewOnly = isExternal && editItemId !== null;
  const [itemForm, setItemForm] = useState<CreateCommunicationItemRequest>({
    what: "",
    who: "",
    toWho: "",
    when: "",
    where: "",
    how: "",
    type: "INTERNAL",
  });

  const [editingField, setEditingField] = useState<"objective" | "scope" | "plan" | null>(null);
  const [editValue, setEditValue] = useState("");

  const [confirmDeleteItemId, setConfirmDeleteItemId] = useState<number | null>(null);
  const [yearDialogItemId, setYearDialogItemId] = useState<number | null>(null);
  const [pageLogOpen, setPageLogOpen] = useState(false);
  const [itemLogOpen, setItemLogOpen] = useState(false);
  const [itemLogEntityId, setItemLogEntityId] = useState<number | null>(null);

  const { data: years } = useQuery({ queryKey: ["years"], queryFn: getYears });
  const effectiveYearId = selectedYearId;

  useEffect(() => {
    if (!effectiveYearId && years && years.length > 0) {
      const currentYear = new Date().getFullYear();
      const match = years.find(y => y.year === currentYear) ?? years[0];
      setSelectedYearId(match.id);
    }
  }, [years, effectiveYearId]);

  const { data: comm, isLoading } = useQuery({
    queryKey: ["communication", effectiveYearId],
    queryFn: () => getCommunicationByYear(effectiveYearId!),
    enabled: effectiveYearId !== null,
  });

  const allItems = useMemo(() => {
    if (!comm) return [];
    return [...comm.internalItems, ...comm.externalItems];
  }, [comm]);

  const yearDialogItem = useMemo(() => {
    if (yearDialogItemId === null || !comm) return null;
    return allItems.find(item => item.id === yearDialogItemId) ?? null;
  }, [yearDialogItemId, allItems, comm]);

  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesTab = activeTab === "ALL" || item.type === activeTab;
      if (!searchQuery.trim()) return matchesTab;
      const q = searchQuery.toLowerCase();
      return (
        matchesTab &&
        (item.what.toLowerCase().includes(q) ||
          item.who.toLowerCase().includes(q) ||
          item.toWho.toLowerCase().includes(q))
      );
    });
  }, [allItems, activeTab, searchQuery]);

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["communication"] });
  }

  const updateCommMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateCommunication>[0]) => updateCommunication(data),
    onSuccess: () => {
      invalidateAll();
      setEditingField(null);
      toast.success("Comunicação atualizada.");
    },
    onError: () => toast.error("Erro ao atualizar comunicação."),
  });

  const addItemMutation = useMutation({
    mutationFn: (data: CreateCommunicationItemRequest) => addCommunicationItem(data),
    onSuccess: () => {
      invalidateAll();
      toast.success("Item adicionado.");
      closeItemModal();
    },
    onError: () => toast.error("Erro ao adicionar item."),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: number;
      data: Parameters<typeof updateCommunicationItem>[1];
    }) => updateCommunicationItem(itemId, data),
    onSuccess: () => {
      invalidateAll();
      toast.success("Item atualizado.");
      closeItemModal();
    },
    onError: () => toast.error("Erro ao atualizar item."),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: number) => deleteCommunicationItem(itemId),
    onSuccess: () => {
      invalidateAll();
      toast.success("Item eliminado.");
    },
    onError: () => toast.error("Erro ao eliminar item."),
  });

  const associateYearMutation = useMutation({
    mutationFn: ({ itemId, yearId }: { itemId: number; yearId: number }) =>
      associateCommunicationItemYear(itemId, yearId),
    onSuccess: () => {
      invalidateAll();
    },
    onError: () => toast.error("Erro ao associar ano."),
  });

  const disassociateYearMutation = useMutation({
    mutationFn: ({ itemId, yearId }: { itemId: number; yearId: number }) =>
      disassociateCommunicationItemYear(itemId, yearId),
    onSuccess: () => {
      invalidateAll();
    },
    onError: () => toast.error("Erro ao desassociar ano."),
  });

  function openItemModal(item?: CommunicationItemResponse) {
    if (item) {
      setEditItemId(item.id);
      setItemForm({
        what: item.what,
        who: item.who,
        toWho: item.toWho,
        when: item.when,
        where: item.where,
        how: item.how,
        type: item.type,
      });
    } else {
      setEditItemId(null);
      setItemForm({
        what: "",
        who: "",
        toWho: "",
        when: "",
        where: "",
        how: "",
        type: activeTab === "ALL" ? "INTERNAL" : activeTab,
      });
    }
    setItemModalOpen(true);
  }

  function closeItemModal() {
    setItemModalOpen(false);
    setEditItemId(null);
  }

  function handleSaveItem() {
    if (!itemForm.what.trim()) return;
    if (editItemId) {
      updateItemMutation.mutate({
        itemId: editItemId,
        data: {
          what: itemForm.what.trim(),
          who: itemForm.who.trim(),
          toWho: itemForm.toWho.trim(),
          when: itemForm.when.trim(),
          where: itemForm.where.trim(),
          how: itemForm.how.trim(),
          type: itemForm.type,
        },
      });
    } else {
      addItemMutation.mutate({
        ...itemForm,
        what: itemForm.what.trim(),
        yearIds: effectiveYearId ? [effectiveYearId] : [],
      });
    }
  }

  function handleAssociateYear(yearId: number) {
    if (yearDialogItemId !== null) {
      associateYearMutation.mutate({ itemId: yearDialogItemId, yearId });
    }
  }

  function handleDisassociateYear(yearId: number) {
    if (yearDialogItemId !== null) {
      disassociateYearMutation.mutate({ itemId: yearDialogItemId, yearId });
    }
  }

  return (
    <div className="py-8 w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-sm">
            <MessageSquare size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Comunicação</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Planeamento das comunicações internas e externas.
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
        </div>
      </div>
      {!effectiveYearId ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <MessageSquare className="mb-4 text-muted-foreground/40" size={48} />
          <p className="text-lg font-medium">Selecione um ano para visualizar as comunicações</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-80 w-full rounded-3xl" />
        </div>
      ) : comm ? (
        <>
          {/* Three cards: Objective, Scope, Plan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {(["objective", "scope", "plan"] as const).map(field => {
              const config = {
                objective: {
                  icon: Target,
                  label: "Objetivo",
                  color: "bg-primary/10 text-primary",
                  placeholder: "Definir o objetivo da comunicação...",
                },
                scope: {
                  icon: Box,
                  label: "Âmbito",
                  color: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
                  placeholder: "Definir o âmbito e limites...",
                },
                plan: {
                  icon: Calendar,
                  label: "Plano",
                  color:
                    "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
                  placeholder: "Estratégia e abordagem de monitorização...",
                },
              }[field];
              const Icon = config.icon;
              const isEditing = editingField === field;
              const currentValue = comm[field] ?? "";
              return (
                <div
                  key={field}
                  className="bg-card p-5 rounded-2xl border border-border shadow-sm hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon size={16} />
                      </div>
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {config.label}
                      </h3>
                    </div>
                    {!isEditing && !isExternal && (
                      <button
                        onClick={() => {
                          setEditValue(currentValue);
                          setEditingField(field);
                        }}
                        className="text-xs font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                      >
                        Editar
                      </button>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        placeholder={config.placeholder}
                        className="w-full h-28 text-sm text-foreground leading-relaxed resize-none bg-muted border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            updateCommMutation.mutate({ [field]: editValue.trim() || null })
                          }
                          disabled={updateCommMutation.isPending}
                        >
                          <Save size={14} className="mr-1" />
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingField(null)}
                          disabled={updateCommMutation.isPending}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {currentValue || `Sem ${config.label.toLowerCase()} definido.`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Communication Matrix */}
          <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-1 p-1 bg-muted rounded-xl w-fit">
                  {TABS.map(tab => {
                    const TabIcon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                          isActive
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <TabIcon size={15} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Pesquisar..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-56 text-foreground"
                    />
                  </div>
                  {!isExternal && (
                    <Button size="sm" onClick={() => openItemModal()}>
                      <Plus size={16} />
                      Adicionar
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      O quê
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Quem comunica
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      A quem
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Quando
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Onde
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Como
                    </th>
                    <th className="w-24 px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredItems.map(item => (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors group cursor-pointer"
                      onClick={() => openItemModal(item)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg ${tabColor(item.type)}`}>
                            <Send size={13} />
                          </div>
                          <span className="text-sm font-bold text-foreground">{item.what}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User size={13} className="text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium text-muted-foreground">
                            {item.who}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users size={13} className="text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium text-muted-foreground">
                            {item.toWho}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={13} className="text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium text-muted-foreground">
                            {item.when}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin size={13} className="text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium text-muted-foreground">
                            {item.where}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Activity size={13} className="text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium text-muted-foreground">
                            {item.how}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setItemLogEntityId(item.id);
                              setItemLogOpen(true);
                            }}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Histórico"
                          >
                            <History size={14} />
                          </button>
                          {!isExternal && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setYearDialogItemId(item.id);
                              }}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                              title="Gerir anos"
                            >
                              <CalendarDays size={14} />
                            </button>
                          )}
                          {!isExternal && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setConfirmDeleteItemId(item.id);
                              }}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <MessageSquare
                          size={28}
                          className="text-muted-foreground/30 mx-auto mb-2"
                        />
                        <p className="text-sm text-muted-foreground font-medium">
                          {searchQuery
                            ? "Nenhum item encontrado."
                            : "Nenhum item de comunicação registado."}
                        </p>
                        {!searchQuery && !isExternal && (
                          <button
                            onClick={() => openItemModal()}
                            className="mt-2 text-xs text-primary hover:text-primary/80 font-bold cursor-pointer"
                          >
                            Adicionar primeiro item
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
      {/* Item Modal */}
      <Dialog
        open={itemModalOpen}
        onOpenChange={o => {
          if (!o) closeItemModal();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${tabColor(
                  itemForm.type === "INTERNAL" ? "INTERNAL" : "EXTERNAL"
                )}`}
              >
                <Send size={18} />
              </div>
              <div>
                <DialogTitle>
                  {isExternal && editItemId ? "Detalhes do Item" : editItemId ? "Editar" : "Novo"}{" "}
                  Item
                </DialogTitle>
                <DialogDescription>
                  {itemForm.type === "INTERNAL" ? "Comunicação Interna" : "Comunicação Externa"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Tipo
              </label>
              {viewOnly ? (
                <p className="text-sm text-foreground py-2 px-1">
                  {itemForm.type === "INTERNAL" ? "Interna" : "Externa"}
                </p>
              ) : (
                <div className="flex gap-2">
                  {(["INTERNAL", "EXTERNAL"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setItemForm(prev => ({ ...prev, type: t }))}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                        itemForm.type === t
                          ? t === "INTERNAL"
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                            : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {t === "INTERNAL" ? <Users size={14} /> : <Globe size={14} />}
                      {t === "INTERNAL" ? "Interna" : "Externa"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                O quê *
              </label>
              {viewOnly ? (
                <p className="text-sm text-foreground py-2 px-1">{itemForm.what || "-"}</p>
              ) : (
                <input
                  type="text"
                  value={itemForm.what}
                  onChange={e => setItemForm(prev => ({ ...prev, what: e.target.value }))}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ex: Atualização da Política da Qualidade"
                />
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Quem comunica
              </label>
              {viewOnly ? (
                <p className="text-sm text-foreground py-2 px-1">{itemForm.who || "-"}</p>
              ) : (
                <input
                  type="text"
                  value={itemForm.who}
                  onChange={e => setItemForm(prev => ({ ...prev, who: e.target.value }))}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ex: Gestor da Qualidade"
                />
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                A quem
              </label>
              {viewOnly ? (
                <p className="text-sm text-foreground py-2 px-1">{itemForm.toWho || "-"}</p>
              ) : (
                <input
                  type="text"
                  value={itemForm.toWho}
                  onChange={e => setItemForm(prev => ({ ...prev, toWho: e.target.value }))}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ex: Todos os colaboradores"
                />
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Quando
              </label>
              {viewOnly ? (
                <p className="text-sm text-foreground py-2 px-1">{itemForm.when || "-"}</p>
              ) : (
                <input
                  type="text"
                  value={itemForm.when}
                  onChange={e => setItemForm(prev => ({ ...prev, when: e.target.value }))}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ex: Trimestralmente"
                />
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Onde
              </label>
              {viewOnly ? (
                <p className="text-sm text-foreground py-2 px-1">{itemForm.where || "-"}</p>
              ) : (
                <input
                  type="text"
                  value={itemForm.where}
                  onChange={e => setItemForm(prev => ({ ...prev, where: e.target.value }))}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ex: Plataforma interna"
                />
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Como
              </label>
              {viewOnly ? (
                <p className="text-sm text-foreground py-2 px-1">{itemForm.how || "-"}</p>
              ) : (
                <input
                  type="text"
                  value={itemForm.how}
                  onChange={e => setItemForm(prev => ({ ...prev, how: e.target.value }))}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ex: E-mail automático + Reunião de equipa"
                />
              )}
            </div>
          </div>
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
                  onClick={handleSaveItem}
                  disabled={
                    !itemForm.what.trim() ||
                    addItemMutation.isPending ||
                    updateItemMutation.isPending
                  }
                >
                  {editItemId ? "Guardar" : "Adicionar"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Year Association Dialog */}
      <YearAssociationDialog
        open={yearDialogItemId !== null}
        onOpenChange={o => {
          if (!o) setYearDialogItemId(null);
        }}
        title="Gerir Anos do Item"
        description={
          yearDialogItem
            ? `Gerir anos para: ${yearDialogItem.what}`
            : "Associe ou desassocie anos a este item de comunicação."
        }
        allYears={years ?? []}
        associatedYearIds={new Set(yearDialogItem?.years.map(y => y.id) ?? [])}
        currentYearId={effectiveYearId}
        onAssociate={handleAssociateYear}
        onDisassociate={handleDisassociateYear}
        isPending={associateYearMutation.isPending || disassociateYearMutation.isPending}
        minYears={1}
      />
      {/* Confirm Delete Item */}
      <ConfirmDialog
        open={confirmDeleteItemId !== null}
        onOpenChange={() => setConfirmDeleteItemId(null)}
        title="Eliminar Item"
        description="Tem a certeza que deseja eliminar este item de comunicação?"
        onConfirm={() => {
          if (confirmDeleteItemId !== null) {
            deleteItemMutation.mutate(confirmDeleteItemId);
            setConfirmDeleteItemId(null);
          }
        }}
        isPending={deleteItemMutation.isPending}
      />
      <LogDialog
        open={pageLogOpen}
        onOpenChange={setPageLogOpen}
        entityTypes={["COMMUNICATION", "COMMUNICATION_ITEM"] as EntityType[]}
        yearId={effectiveYearId ?? undefined}
        title="Histórico — Comunicação"
      />
      <LogDialog
        open={itemLogOpen}
        onOpenChange={setItemLogOpen}
        baseEntityId={itemLogEntityId ?? undefined}
        entityTypes={["COMMUNICATION_ITEM"] as EntityType[]}
        yearId={effectiveYearId ?? undefined}
        title="Histórico do Item"
      />
    </div>
  );
}
