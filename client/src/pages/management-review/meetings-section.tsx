import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Pencil, Plus, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createManagementReviewMeeting,
  deleteManagementReviewMeeting,
  downloadDocumentVersion,
  getManagementReviewMeetings,
  removeManagementReviewMeetingDocument,
  updateManagementReviewMeeting,
  uploadManagementReviewMeetingDocument,
} from "@/api/core";
import type { ManagementReviewMeetingResponse } from "@/types";

const MIN_MEETINGS_PER_YEAR = 2;

const fieldClass =
  "flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none min-h-[64px] resize-none";

const TEXT_FIELDS = [
  { key: "participants", label: "Participantes" },
  { key: "notes", label: "Resumo da reunião" },
  { key: "decisions", label: "Decisões" },
  { key: "improvementOutputs", label: "Oportunidades de melhoria" },
  { key: "changeNeeds", label: "Necessidade de alterações ao sistema" },
  { key: "resourceNeeds", label: "Necessidades de recursos" },
] as const;

type TextKey = (typeof TEXT_FIELDS)[number]["key"];
type FormState = { meetingDate: string } & Record<TextKey, string>;

const emptyForm = (): FormState => ({
  meetingDate: "",
  participants: "",
  notes: "",
  decisions: "",
  improvementOutputs: "",
  changeNeeds: "",
  resourceNeeds: "",
});

const toForm = (m: ManagementReviewMeetingResponse): FormState => ({
  meetingDate: m.meetingDate ?? "",
  participants: m.participants ?? "",
  notes: m.notes ?? "",
  decisions: m.decisions ?? "",
  improvementOutputs: m.improvementOutputs ?? "",
  changeNeeds: m.changeNeeds ?? "",
  resourceNeeds: m.resourceNeeds ?? "",
});

const toRequest = (yearId: number, f: FormState) => ({
  yearId,
  meetingDate: f.meetingDate || null,
  participants: f.participants.trim() || null,
  notes: f.notes.trim() || null,
  decisions: f.decisions.trim() || null,
  improvementOutputs: f.improvementOutputs.trim() || null,
  changeNeeds: f.changeNeeds.trim() || null,
  resourceNeeds: f.resourceNeeds.trim() || null,
});

const formatDate = (iso: string | null) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString("pt-PT") : "Sem data";

export function MeetingsSection({
  yearId,
  userId,
  readOnly,
}: {
  yearId: number;
  userId: number;
  readOnly: boolean;
}) {
  const queryClient = useQueryClient();
  const queryKey = ["management-review", "meetings", yearId];
  const { data: meetings = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => getManagementReviewMeetings(yearId),
  });

  const [editing, setEditing] = useState<ManagementReviewMeetingResponse | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [toDelete, setToDelete] = useState<ManagementReviewMeetingResponse | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ["logs"] });
  };
  const onError = (err: any) => toast.error(err?.response?.data?.message ?? "Ocorreu um erro.");

  const save = useMutation({
    mutationFn: () =>
      editing === "new"
        ? createManagementReviewMeeting(toRequest(yearId, form))
        : updateManagementReviewMeeting((editing as ManagementReviewMeetingResponse).id, toRequest(yearId, form)),
    onSuccess: () => {
      toast.success("Reunião guardada.");
      setEditing(null);
      refresh();
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteManagementReviewMeeting(id),
    onSuccess: () => {
      toast.success("Reunião removida.");
      setToDelete(null);
      refresh();
    },
    onError,
  });

  const upload = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => uploadManagementReviewMeetingDocument(id, file, userId),
    onSuccess: () => {
      toast.success("Documento carregado.");
      refresh();
    },
    onError,
  });

  const removeDoc = useMutation({
    mutationFn: ({ id, documentId }: { id: number; documentId: number }) =>
      removeManagementReviewMeetingDocument(id, documentId),
    onSuccess: refresh,
    onError,
  });

  const openEditor = (target: ManagementReviewMeetingResponse | "new") => {
    setForm(target === "new" ? emptyForm() : toForm(target));
    setEditing(target);
  };

  const missing = Math.max(0, MIN_MEETINGS_PER_YEAR - meetings.length);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
            missing === 0
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
              : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
          }`}
        >
          {meetings.length} de {MIN_MEETINGS_PER_YEAR} reuniões mínimas
          {missing > 0 ? ` — faltam ${missing}` : ""}
        </span>
        {!readOnly && (
          <Button onClick={() => openEditor("new")}>
            <Plus className="size-4" />
            Nova reunião
          </Button>
        )}
      </div>

      {isLoading ? null : meetings.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Ainda não há reuniões registadas neste ano.</p>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-foreground">Reunião de {formatDate(meeting.meetingDate)}</h3>
                {!readOnly && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" title="Editar" onClick={() => openEditor(meeting)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" title="Remover" onClick={() => setToDelete(meeting)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {TEXT_FIELDS.map(({ key, label }) => (
                  <div key={key}>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
                    <p className={`whitespace-pre-wrap ${meeting[key] ? "text-foreground" : "text-muted-foreground italic"}`}>
                      {meeting[key] || "—"}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ata e anexos</p>
                  {!readOnly && (
                    <label className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 cursor-pointer uppercase tracking-wider">
                      <Upload className="size-3.5" />
                      Anexar
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (file) upload.mutate({ id: meeting.id, file });
                        }}
                      />
                    </label>
                  )}
                </div>
                {meeting.documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Sem documentos.</p>
                ) : (
                  meeting.documents.map((doc) => {
                    const version = doc.versions[doc.versions.length - 1];
                    return (
                      <div key={doc.documentId} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate">{version?.fileName ?? `Documento ${doc.documentId}`}</span>
                        <div className="flex gap-1 shrink-0">
                          {version && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Descarregar"
                              onClick={() => downloadDocumentVersion(version.versionId, version.fileName)}
                            >
                              <Download className="size-4" />
                            </Button>
                          )}
                          {!readOnly && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Remover"
                              onClick={() => {
                                if (window.confirm("Remover este documento?")) {
                                  removeDoc.mutate({ id: meeting.id, documentId: doc.documentId });
                                }
                              }}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Nova reunião" : "Editar reunião"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5 max-w-[12rem]">
              <Label htmlFor="mr-date" className="text-xs">Data</Label>
              <Input
                id="mr-date"
                type="date"
                value={form.meetingDate}
                onChange={(e) => setForm({ ...form, meetingDate: e.target.value })}
              />
            </div>
            {TEXT_FIELDS.map(({ key, label }) => (
              <div key={key} className="grid gap-1.5">
                <Label htmlFor={`mr-${key}`} className="text-xs">{label}</Label>
                <textarea
                  id={`mr-${key}`}
                  className={fieldClass}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "A guardar..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover reunião?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            A reunião de {formatDate(toDelete?.meetingDate ?? null)} e os seus anexos serão removidos. A remoção fica registada no histórico.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => toDelete && remove.mutate(toDelete.id)} disabled={remove.isPending}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
