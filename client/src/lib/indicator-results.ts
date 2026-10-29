import type { IndicatorWithProcesses } from "@/types";

/**
 * Leitura dos resultados de um indicador: meta (numérica ou escrita nas notas),
 * última medição e se a meta foi atingida. Só lê dados que já existem.
 */

export type TargetOperator = ">=" | "<=" | ">" | "<" | "=";

export interface IndicatorTarget {
  value: number;
  operator: TargetOperator;
  /** de onde veio: campo «meta» do indicador ou texto «Meta (folha)» das notas */
  source: "goal" | "notes";
}

/**
 * met: meta atingida · near: a menos de 25% da meta · far: longe da meta ·
 * no-target: há dados mas a meta não é numérica · no-data: faltam medições que já eram devidas ·
 * not-due: ainda sem medições, mas ainda não eram devidas (típico dos indicadores anuais).
 */
export type IndicatorStatus = "met" | "near" | "far" | "no-target" | "no-data" | "not-due";

/** Fração da meta a partir da qual um indicador conta como «perto da meta». */
const NEAR = 0.75;

export const OPERATOR_SYMBOL: Record<TargetOperator, string> = {
  ">=": "≥",
  "<=": "≤",
  ">": ">",
  "<": "<",
  "=": "=",
};

const OPERATORS: [RegExp, TargetOperator][] = [
  [/^(≥|>=|maior ou igual a)/i, ">="],
  [/^(≤|<=|menor ou igual a)/i, "<="],
  [/^>/, ">"],
  [/^</, "<"],
  [/^=/, "="],
];

function metaText(notes: string | null | undefined): string | null {
  const match = notes?.match(/Meta \(folha\):\s*([^\n]*)/i);
  return match ? match[1].trim() : null;
}

/** «≥ 90%», «<= 24 horas», «10% vs 2025», «≤ a 15 dias úteis» → meta; qualquer outra coisa → null. */
function parseMetaText(text: string, valueType: string | undefined): Omit<IndicatorTarget, "source"> | null {
  let rest = text.replace(/^\+\s*/, "").trim();
  let operator: TargetOperator | null = null;
  for (const [pattern, op] of OPERATORS) {
    const m = rest.match(pattern);
    if (m) {
      operator = op;
      rest = rest.slice(m[0].length).replace(/^\s*a\s+/i, "").trim();
      break;
    }
  }
  const number = rest.match(/^(\d+(?:[.,]\d+)?)(?![\dº])\s*(%)?/);
  if (!number) return null;
  let value = parseFloat(number[1].replace(",", "."));
  if (number[2] === "%" || (valueType === "PERCENTAGE" && value > 1.5)) value /= 100;
  // sem símbolo, um prazo/tempo quer-se no máximo; o resto, no mínimo
  return { value, operator: operator ?? (valueType === "TIME" ? "<=" : ">=") };
}

export function getTarget(indicator: Pick<IndicatorWithProcesses, "goal" | "notes" | "valueType">): IndicatorTarget | null {
  const text = metaText(indicator.notes);
  const fromText = text ? parseMetaText(text, indicator.valueType) : null;
  if (indicator.goal != null) {
    // a meta numérica manda; o sentido (≥/≤) só pode vir do texto, se existir
    return { value: Number(indicator.goal), operator: fromText?.operator ?? (indicator.valueType === "TIME" ? "<=" : ">="), source: "goal" };
  }
  return fromText ? { ...fromText, source: "notes" } : null;
}

export function meetsTarget(value: number, target: IndicatorTarget): boolean {
  switch (target.operator) {
    case ">=": return value >= target.value;
    case "<=": return value <= target.value;
    case ">": return value > target.value;
    case "<": return value < target.value;
    case "=": return value === target.value;
  }
}

export function sortedMeasurements(indicator: Pick<IndicatorWithProcesses, "measurements">) {
  return [...(indicator.measurements ?? [])].sort((a, b) => a.measurementDate.localeCompare(b.measurementDate));
}

/** Perto ou longe de uma meta ainda não atingida. */
export function progressStatus(value: number, target: IndicatorTarget): "met" | "near" | "far" {
  if (meetsTarget(value, target)) return "met";
  if (target.value <= 0) return "far";
  if (target.operator === "<=" || target.operator === "<") {
    return value <= target.value * (2 - NEAR) ? "near" : "far";
  }
  return value / target.value >= NEAR ? "near" : "far";
}

/**
 * Quantas medições já deviam existir nesta data, pela frequência do indicador.
 * Só contam períodos completos: um indicador anual só deve ter medição quando o ano acaba,
 * por isso é normal não as ter ainda.
 */
export function expectedMeasurements(frequency: string | undefined, year: number | undefined, now: Date = new Date()): number {
  if (year === undefined || now.getFullYear() < year) return 0;
  const completedMonths = now.getFullYear() > year ? 12 : now.getMonth();
  switch (frequency) {
    case "MONTHLY": return completedMonths;
    case "TRIMESTER": return Math.floor(completedMonths / 3);
    case "SEMESTER": return Math.floor(completedMonths / 6);
    case "ANNUAL": return completedMonths >= 12 ? 1 : 0;
    default: return 0;
  }
}

export interface IndicatorResult {
  status: IndicatorStatus;
  target: IndicatorTarget | null;
  measurements: ReturnType<typeof sortedMeasurements>;
  last: ReturnType<typeof sortedMeasurements>[number] | undefined;
  expected: number;
  /** medições devidas e ainda não registadas */
  missing: number;
}

export function getResult(indicator: IndicatorWithProcesses, year: number | undefined, now: Date = new Date()): IndicatorResult {
  const measurements = sortedMeasurements(indicator);
  const last = measurements[measurements.length - 1];
  const target = getTarget(indicator);
  const expected = expectedMeasurements(indicator.frequency, year, now);
  const missing = Math.max(0, expected - measurements.length);
  let status: IndicatorStatus;
  if (!last) status = expected > 0 ? "no-data" : "not-due";
  else if (!target) status = "no-target";
  else status = progressStatus(Number(last.value), target);
  return { status, target, measurements, last, expected, missing };
}

/** Requer atenção da gestão: longe/perto da meta ou com medições em falta (já devidas). */
export function needsAttention(result: IndicatorResult): boolean {
  return result.status === "far" || result.status === "near" || result.status === "no-data" || result.missing > 0;
}

const number = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 1 });
const euro = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });

export function formatValue(value: number, valueType: string | undefined): string {
  switch (valueType) {
    case "PERCENTAGE": return `${percent.format(value * 100)}%`;
    case "CURRENCY": return euro.format(value);
    case "RATIO": return `${number.format(value)}:1`;
    default: return number.format(value);
  }
}

export function formatTarget(target: IndicatorTarget, valueType: string | undefined): string {
  return `${OPERATOR_SYMBOL[target.operator]} ${formatValue(target.value, valueType)}`;
}

const monthShort = new Intl.DateTimeFormat("pt-PT", { month: "short" });

export function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${monthShort.format(new Date(y, m - 1, d)).replace(".", "")}`;
}

export function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short", year: "numeric" }).format(new Date(y, m - 1, d));
}
