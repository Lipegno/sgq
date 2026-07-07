import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Plus, Trash2, FileText, Download, Upload, Pencil, History, Truck, X, Star } from "lucide-react";
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, createSupplierReview, updateSupplierReview, deleteSupplierReview, uploadSupplierReviewDocument, deleteSupplierReviewDocument, downloadDocumentVersion, stripUuidSuffix } from "@/api/core";
import { LogDialog } from "@/components/log-dialog";
import type { SupplierResponse, SupplierReviewResponse } from "@/types";

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["suppliers"] });
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}
        />
      ))}
    </div>
  );
}

function SupplierReviewCard({
  review,
  supplierId,
  onEdit,
  onDelete,
  onUpload,
  onDeleteDoc,
  isExternal,
}: {
  review: SupplierReviewResponse;
  supplierId: number;
  onEdit: (data: { rating?: number | null; text?: string | null; reviewDate?: string | null }) => void;
  onDelete: (reviewId: number) => void;
  onUpload: (file: File) => void;
  onDeleteDoc: (documentId: number) => void;
  isExternal: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editRating, setEditRating] = useState(review.rating);
  const [editText, setEditText] = useState(review.text ?? "");
  const [editDate, setEditDate] = useState(review.reviewDate);

  const handleSave = () => {
    onEdit({ rating: editRating, text: editText, reviewDate: editDate });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="border border-primary/30 rounded-xl p-4 bg-primary/5 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Classificação</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setEditRating(star)} className="cursor-pointer">
                  <Star size={20} className={star <= editRating ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="review-date" className="text-xs">Data</Label>
            <Input id="review-date" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="review-text" className="text-xs">Descrição</Label>
          <textarea id="review-text" className="flex min-h-[60px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none resize-none" value={editText} onChange={(e) => setEditText(e.target.value)} placeholder="Descreva a avaliação..." />
        </div>
        <div className="flex items-center gap-2 justify-end">
          <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer px-2 py-1">Cancelar</button>
          <button onClick={handleSave} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-bold hover:bg-primary/90 transition-all cursor-pointer">Guardar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl p-4 bg-card shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <StarRating rating={review.rating} size={18} />
          <span className="text-xs text-muted-foreground">
            {new Date(review.reviewDate).toLocaleDateString("pt-PT")}
          </span>
        </div>
        {!isExternal && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setEditing(true)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer" title="Editar">
              <Pencil size={14} />
            </button>
            <button onClick={() => onDelete(review.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all cursor-pointer" title="Eliminar">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {review.text && (
        <p className="text-sm text-foreground mt-3 whitespace-pre-wrap">{review.text}</p>
      )}

      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Documentos</span>
          {!isExternal && (
            <label className="text-xs font-bold text-primary hover:text-primary/80 cursor-pointer">
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
          )}
        </div>
        <div className="space-y-1.5">
          {review.documents.length > 0 ? review.documents.map((doc) => {
            const latest = doc.versions?.[doc.versions.length - 1];
            return (
              <div key={doc.documentId} className="flex items-center justify-between p-2 bg-muted rounded-lg border border-border group/doc">
                <div className="flex items-center gap-2 overflow-hidden min-w-0">
                  <FileText size={14} className="text-primary shrink-0" />
                  <span className="text-xs font-medium text-foreground truncate">
                    {latest ? stripUuidSuffix(latest.fileName) : "Documento"}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {latest && (
                    <button onClick={() => downloadDocumentVersion(latest.versionId, latest.fileName)} className="text-muted-foreground hover:text-primary p-1 transition-all cursor-pointer" title="Descarregar">
                      <Download size={14} />
                    </button>
                  )}
                  {!isExternal && (
                    <button onClick={() => onDeleteDoc(doc.documentId)} className="text-muted-foreground hover:text-destructive p-1 transition-all cursor-pointer" title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          }) : (
            <p className="text-xs text-muted-foreground text-center py-2 border border-dashed border-border rounded-lg">
              Nenhum documento
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SuppliersPage() {
  const { isExternal } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierResponse | null>(null);
  const [search, setSearch] = useState("");
  const [logOpen, setLogOpen] = useState(false);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addReviewOpen, setAddReviewOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: "supplier" | "review"; id: number } | null>(null);

  const [addName, setAddName] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addContact, setAddContact] = useState("");

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editContact, setEditContact] = useState("");

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewDate, setReviewDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
  });

  useEffect(() => {
    if (selectedSupplier && suppliers) {
      const updated = suppliers.find((s) => s.id === selectedSupplier.id);
      if (updated) setSelectedSupplier(updated);
    }
  }, [suppliers]);

  const filtered = (suppliers ?? []).filter((s) =>
    search.trim() ? s.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  const createMutation = useMutation({
    mutationFn: () => createSupplier({ name: addName, description: addDescription || null, contactInfo: addContact || null }),
    onSuccess: (data) => {
      invalidateAll(queryClient);
      toast.success("Fornecedor criado com sucesso!");
      setAddDialogOpen(false);
      setAddName("");
      setAddDescription("");
      setAddContact("");
      setSelectedSupplier(data);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Erro ao criar fornecedor"),
  });

  const updateMutation = useMutation({
    mutationFn: () => updateSupplier(selectedSupplier!.id, { name: editName, description: editDescription || null, contactInfo: editContact || null }),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Fornecedor atualizado!");
      setEditDialogOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Erro ao atualizar fornecedor"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSupplier(confirmDelete!.id),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Fornecedor eliminado.");
      setSelectedSupplier(null);
      setConfirmDelete(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Erro ao eliminar fornecedor"),
  });

  const createReviewMutation = useMutation({
    mutationFn: () => createSupplierReview(selectedSupplier!.id, { rating: reviewRating, text: reviewText || null, reviewDate }),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Avaliação registada!");
      setAddReviewOpen(false);
      setReviewRating(5);
      setReviewText("");
      setReviewDate(new Date().toISOString().split("T")[0]);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Erro ao registar avaliação"),
  });

  const updateReviewMutation = useMutation({
    mutationFn: ({ reviewId, data }: { reviewId: number; data: { rating?: number | null; text?: string | null; reviewDate?: string | null } }) =>
      updateSupplierReview(selectedSupplier!.id, reviewId, data),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Avaliação atualizada!");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Erro ao atualizar avaliação"),
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: number) => deleteSupplierReview(selectedSupplier!.id, reviewId),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Avaliação eliminada.");
      setConfirmDelete(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Erro ao eliminar avaliação"),
  });

  const uploadDocMutation = useMutation({
    mutationFn: ({ reviewId, file }: { reviewId: number; file: File }) =>
      uploadSupplierReviewDocument(selectedSupplier!.id, reviewId, file, Number(user?.id ?? 1)),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Documento carregado!");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Erro ao carregar documento"),
  });

  const deleteDocMutation = useMutation({
    mutationFn: ({ reviewId, documentId }: { reviewId: number; documentId: number }) =>
      deleteSupplierReviewDocument(selectedSupplier!.id, reviewId, documentId),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Documento eliminado.");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Erro ao eliminar documento"),
  });

  const openEdit = () => {
    if (!selectedSupplier) return;
    setEditName(selectedSupplier.name);
    setEditDescription(selectedSupplier.description ?? "");
    setEditContact(selectedSupplier.contactInfo ?? "");
    setEditDialogOpen(true);
  };

  const { user } = useAuth();

  return (
    <div className="py-8 w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-sm">
            <Truck size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fornecedores Externos</h1>
            <p className="text-muted-foreground text-sm mt-1">Avaliação e monitorização de fornecedores externos.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setLogOpen(true)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer" title="Histórico de alterações">
            <History size={20} />
          </button>
          {!isExternal && (
            <Button onClick={() => { setAddName(""); setAddDescription(""); setAddContact(""); setAddDialogOpen(true); }}>
              <Plus className="size-4" />
              Novo Fornecedor
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel — Supplier List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col max-h-[800px]">
            <div className="p-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <Search size={16} className="text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Pesquisar fornecedores..."
                  className="bg-transparent border-none focus:ring-0 text-sm w-full text-foreground outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-y-auto divide-y divide-border">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground text-sm">A carregar...</div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  {search ? "Nenhum fornecedor encontrado." : "Nenhum fornecedor registado."}
                </div>
              ) : (
                filtered.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSupplier(s)}
                    className={`w-full text-left p-4 hover:bg-muted/50 transition-all cursor-pointer group ${
                      selectedSupplier?.id === s.id ? "bg-primary/5 border-l-4 border-l-primary pl-[13px]" : ""
                    }`}
                  >
                    <div className="font-medium text-sm text-foreground">{s.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{s.reviews.length} avaliaç{s.reviews.length === 1 ? "ão" : "ões"}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Panel — Supplier Detail */}
        <div className="lg:col-span-2">
          {selectedSupplier ? (
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              {/* Supplier Header */}
              <div className="p-6 border-b border-border bg-muted/20">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedSupplier.name}</h2>
                    {selectedSupplier.description && (
                      <p className="text-sm text-muted-foreground mt-1">{selectedSupplier.description}</p>
                    )}
                    {selectedSupplier.contactInfo && (
                      <p className="text-xs text-muted-foreground mt-1">{selectedSupplier.contactInfo}</p>
                    )}
                  </div>
                  {!isExternal && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={openEdit} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer" title="Editar">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => setConfirmDelete({ type: "supplier", id: selectedSupplier.id })} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all cursor-pointer" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Reviews Section */}
              <div className="p-6 max-h-[700px] overflow-y-auto space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    Avaliações ({selectedSupplier.reviews.length})
                  </h3>
                  {!isExternal && (
                    <button onClick={() => { setReviewRating(5); setReviewText(""); setReviewDate(new Date().toISOString().split("T")[0]); setAddReviewOpen(true); }} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-bold hover:bg-primary/90 transition-all cursor-pointer">
                      <Plus size={14} />
                      Nova Avaliação
                    </button>
                  )}
                </div>

                {selectedSupplier.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {selectedSupplier.reviews.map((r) => (
                      <SupplierReviewCard
                        key={r.id}
                        review={r}
                        supplierId={selectedSupplier.id}
                        onEdit={(data) => updateReviewMutation.mutate({ reviewId: r.id, data })}
                        onDelete={(reviewId) => setConfirmDelete({ type: "review", id: reviewId })}
                        onUpload={(file) => uploadDocMutation.mutate({ reviewId: r.id, file })}
                        onDeleteDoc={(documentId) => deleteDocMutation.mutate({ reviewId: r.id, documentId })}
                        isExternal={isExternal}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 bg-muted/30 border-2 border-dashed border-border rounded-2xl text-center">
                    <Star size={32} className="mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhuma avaliação registada para este fornecedor.</p>
                    {!isExternal && (
                      <button onClick={() => { setReviewRating(5); setReviewText(""); setReviewDate(new Date().toISOString().split("T")[0]); setAddReviewOpen(true); }} className="mt-4 text-sm text-primary hover:text-primary/80 font-bold cursor-pointer">
                        + Registar Primeira Avaliação
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-card border-2 border-dashed border-border rounded-2xl h-full flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <Truck size={36} className="text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Gestão de Fornecedores</h2>
              <p className="text-muted-foreground text-sm mt-2 max-w-md">
                Selecione um fornecedor para ver os detalhes ou registe um novo fornecedor externo.
              </p>
              {!isExternal && (
                <Button className="mt-6" onClick={() => { setAddName(""); setAddDescription(""); setAddContact(""); setAddDialogOpen(true); }}>
                  <Plus size={18} />
                  Novo Fornecedor
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Supplier Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Fornecedor</DialogTitle>
            <DialogDescription>Registe um novo fornecedor externo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="add-name">Nome *</Label>
              <Input id="add-name" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Nome do fornecedor" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="add-description">Descrição</Label>
              <textarea id="add-description" className="flex min-h-[80px] w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none resize-none" value={addDescription} onChange={(e) => setAddDescription(e.target.value)} placeholder="Descrição do fornecedor..." />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="add-contact">Contacto</Label>
              <Input id="add-contact" value={addContact} onChange={(e) => setAddContact(e.target.value)} placeholder="Email, telefone, etc." />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={() => createMutation.mutate()} disabled={!addName.trim() || createMutation.isPending}>
              {createMutation.isPending ? "A criar..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Fornecedor</DialogTitle>
            <DialogDescription>Altere os dados do fornecedor.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-name">Nome *</Label>
              <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-description">Descrição</Label>
              <textarea id="edit-description" className="flex min-h-[80px] w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none resize-none" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-contact">Contacto</Label>
              <Input id="edit-contact" value={editContact} onChange={(e) => setEditContact(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={() => updateMutation.mutate()} disabled={!editName.trim() || updateMutation.isPending}>
              {updateMutation.isPending ? "A guardar..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Review Dialog */}
      <Dialog open={addReviewOpen} onOpenChange={setAddReviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Avaliação</DialogTitle>
            <DialogDescription>Registe uma avaliação para {selectedSupplier?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Classificação</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setReviewRating(star)} className="cursor-pointer">
                    <Star size={24} className={star <= reviewRating ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="review-date">Data</Label>
              <Input id="review-date" type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="review-text">Descrição</Label>
              <textarea id="review-text" className="flex min-h-[80px] w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none resize-none" value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Descreva a avaliação..." />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={() => createReviewMutation.mutate()} disabled={createReviewMutation.isPending}>
              {createReviewMutation.isPending ? "A registar..." : "Registar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDelete !== null} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminação</DialogTitle>
            <DialogDescription>
              {confirmDelete?.type === "supplier"
                ? "Tem a certeza que deseja eliminar este fornecedor? Esta ação é irreversível."
                : "Tem a certeza que deseja eliminar esta avaliação? Esta ação é irreversível."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmDelete?.type === "supplier") deleteMutation.mutate();
                else if (confirmDelete?.type === "review") deleteReviewMutation.mutate(confirmDelete.id);
              }}
              disabled={deleteMutation.isPending || deleteReviewMutation.isPending}
            >
              {(deleteMutation.isPending || deleteReviewMutation.isPending) ? "A eliminar..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Dialog */}
      <LogDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        entityType="SUPPLIER"
        baseEntityId={selectedSupplier?.id}
        title="Histórico — Fornecedores"
      />
    </div>
  );
}
