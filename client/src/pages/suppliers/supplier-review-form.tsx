import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SupplierReviewResponse, UpdateSupplierReviewRequest } from "@/types";

export const SCORE_LABELS: Record<number, string> = {
  1: "Insatisfatório",
  2: "Condicionado",
  3: "Satisfatório",
  4: "Excelente",
};

export const CRITERIA = [
  { key: "conformityScore", label: "Conformidade dos bens ou serviços prestados" },
  { key: "deadlineScore", label: "Cumprimento dos prazos" },
  { key: "qualityScore", label: "Qualidade dos bens e serviços prestados" },
  { key: "documentationScore", label: "Conformidade documental" },
] as const;

type CriterionKey = (typeof CRITERIA)[number]["key"];

export interface ReviewFormState {
  year: string;
  semester: string;
  reviewDate: string;
  criteriaSentDate: string;
  conformityScore: string;
  deadlineScore: string;
  qualityScore: string;
  documentationScore: string;
  classification: string;
  measures: string;
  justification: string;
  text: string;
}

export function emptyReviewForm(): ReviewFormState {
  const now = new Date();
  return {
    year: String(now.getFullYear()),
    semester: now.getMonth() < 6 ? "1" : "2",
    reviewDate: "",
    criteriaSentDate: "",
    conformityScore: "",
    deadlineScore: "",
    qualityScore: "",
    documentationScore: "",
    classification: "",
    measures: "",
    justification: "",
    text: "",
  };
}

export function reviewToForm(review: SupplierReviewResponse): ReviewFormState {
  const str = (value: number | string | null) => (value === null || value === undefined ? "" : String(value));
  return {
    year: str(review.year),
    semester: str(review.semester),
    reviewDate: str(review.reviewDate),
    criteriaSentDate: str(review.criteriaSentDate),
    conformityScore: str(review.conformityScore),
    deadlineScore: str(review.deadlineScore),
    qualityScore: str(review.qualityScore),
    documentationScore: str(review.documentationScore),
    classification: str(review.classification),
    measures: str(review.measures),
    justification: str(review.justification),
    text: str(review.text),
  };
}

const toNumber = (value: string) => (value === "" ? null : Number(value));
const toText = (value: string) => (value.trim() === "" ? null : value.trim());

export function formToRequest(form: ReviewFormState): UpdateSupplierReviewRequest {
  return {
    year: toNumber(form.year),
    semester: toNumber(form.semester),
    reviewDate: toText(form.reviewDate),
    criteriaSentDate: toText(form.criteriaSentDate),
    conformityScore: toNumber(form.conformityScore),
    deadlineScore: toNumber(form.deadlineScore),
    qualityScore: toNumber(form.qualityScore),
    documentationScore: toNumber(form.documentationScore),
    classification: toText(form.classification),
    measures: toText(form.measures),
    justification: toText(form.justification),
    text: toText(form.text),
  };
}

export function totalOf(form: ReviewFormState): number | null {
  const scores = CRITERIA.map((c) => toNumber(form[c.key])).filter((n): n is number => n !== null);
  return scores.length === 0 ? null : scores.reduce((a, b) => a + b, 0);
}

const fieldClass =
  "flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none";

export function SupplierReviewForm({
  value,
  onChange,
  idPrefix,
}: {
  value: ReviewFormState;
  onChange: (next: ReviewFormState) => void;
  idPrefix: string;
}) {
  const set = (patch: Partial<ReviewFormState>) => onChange({ ...value, ...patch });
  const total = totalOf(value);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`${idPrefix}-year`} className="text-xs">Ano</Label>
          <Input id={`${idPrefix}-year`} type="number" value={value.year} onChange={(e) => set({ year: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${idPrefix}-semester`} className="text-xs">Semestre</Label>
          <select id={`${idPrefix}-semester`} className={`${fieldClass} h-9`} value={value.semester} onChange={(e) => set({ semester: e.target.value })}>
            <option value="">—</option>
            <option value="1">1.º semestre</option>
            <option value="2">2.º semestre</option>
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${idPrefix}-sent`} className="text-xs">Envio dos critérios</Label>
          <Input id={`${idPrefix}-sent`} type="date" value={value.criteriaSentDate} onChange={(e) => set({ criteriaSentDate: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${idPrefix}-date`} className="text-xs">Data da avaliação</Label>
          <Input id={`${idPrefix}-date`} type="date" value={value.reviewDate} onChange={(e) => set({ reviewDate: e.target.value })} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Desempenho geral (de 1 a 4)</span>
          <span className="text-xs text-muted-foreground">
            Pontuação total: <strong className="text-foreground">{total ?? "—"}</strong>
          </span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-3">
          {CRITERIA.map((criterion) => (
            <div key={criterion.key} className="grid gap-1.5">
              <Label htmlFor={`${idPrefix}-${criterion.key}`} className="text-xs">{criterion.label}</Label>
              <select
                id={`${idPrefix}-${criterion.key}`}
                className={`${fieldClass} h-9`}
                value={value[criterion.key as CriterionKey]}
                onChange={(e) => set({ [criterion.key]: e.target.value } as Partial<ReviewFormState>)}
              >
                <option value="">—</option>
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>{n} — {SCORE_LABELS[n]}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={`${idPrefix}-classification`} className="text-xs">Classificação do fornecedor</Label>
        <Input
          id={`${idPrefix}-classification`}
          list={`${idPrefix}-classifications`}
          value={value.classification}
          onChange={(e) => set({ classification: e.target.value })}
          placeholder="Escolha uma sugestão ou escreva"
        />
        <datalist id={`${idPrefix}-classifications`}>
          {["Excelente", "Satisfatório", "Condicionado", "Insatisfatório", "Não classificado"].map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={`${idPrefix}-measures`} className="text-xs">Medidas decorrentes da avaliação</Label>
        <textarea id={`${idPrefix}-measures`} className={`${fieldClass} min-h-[60px] resize-none`} value={value.measures} onChange={(e) => set({ measures: e.target.value })} />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={`${idPrefix}-justification`} className="text-xs">Fundamentação de manutenção de fornecedor não classificado</Label>
        <textarea id={`${idPrefix}-justification`} className={`${fieldClass} min-h-[60px] resize-none`} value={value.justification} onChange={(e) => set({ justification: e.target.value })} />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={`${idPrefix}-text`} className="text-xs">Observações</Label>
        <textarea id={`${idPrefix}-text`} className={`${fieldClass} min-h-[60px] resize-none`} value={value.text} onChange={(e) => set({ text: e.target.value })} />
      </div>
    </div>
  );
}
