import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowDownRight, CheckCircle2, ChevronDown, ChevronUp, Clock, Minus, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityLink } from "@/components/entity-link";
import { getIndicatorsByYear } from "@/api/core";
import type { IndicatorWithProcesses } from "@/types";
import { formatTarget, formatValue, getResult, needsAttention, type IndicatorResult, type IndicatorStatus } from "@/lib/indicator-results";
import { IndicatorBarChart } from "./indicator-bar-chart";

const FREQUENCY_LABELS: Record<string, string> = {
  ANNUAL: "Anual",
  SEMESTER: "Semestral",
  TRIMESTER: "Trimestral",
  MONTHLY: "Mensal",
  WEEKLY: "Semanal",
};

const GOOD = "text-emerald-700 dark:text-emerald-400";
const WARN = "text-amber-700 dark:text-amber-400";
const BAD = "text-red-700 dark:text-red-400";
const NEUTRAL = "text-muted-foreground";

/** Cada estado leva ícone e texto, nunca só cor. */
const STATUS: Record<IndicatorStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  met: { label: "Meta atingida", icon: CheckCircle2, className: GOOD },
  near: { label: "Perto da meta", icon: TrendingUp, className: WARN },
  far: { label: "Longe da meta", icon: ArrowDownRight, className: BAD },
  "no-target": { label: "Sem meta numérica", icon: Minus, className: NEUTRAL },
  "no-data": { label: "Sem medições", icon: AlertTriangle, className: WARN },
  "not-due": { label: "Ainda sem dados", icon: Clock, className: NEUTRAL },
};

const NO_PROCESS = -1;

interface ProcessGroup {
  key: number;
  name: string;
  macro: string | null;
  indicators: IndicatorWithProcesses[];
}

function groupByProcess(indicators: IndicatorWithProcesses[], processOrder: number[]): ProcessGroup[] {
  const rank = (key: number) => {
    const i = processOrder.indexOf(key);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  const groups = new Map<number, ProcessGroup>();
  for (const indicator of indicators) {
    const processes = indicator.processes?.length
      ? indicator.processes.map((p) => ({ key: p.processYearId, name: p.processName, macro: p.macroProcessName }))
      : [{ key: NO_PROCESS, name: "Sem processo associado", macro: null }];
    for (const p of processes) {
      const group = groups.get(p.key) ?? { key: p.key, name: p.name, macro: p.macro, indicators: [] };
      group.indicators.push(indicator);
      groups.set(p.key, group);
    }
  }
  return [...groups.values()]
    .sort((a, b) => (a.key === NO_PROCESS ? 1 : b.key === NO_PROCESS ? -1 : rank(a.key) - rank(b.key) || (a.macro ?? "").localeCompare(b.macro ?? "") || a.name.localeCompare(b.name)))
    .map((g) => ({ ...g, indicators: [...g.indicators].sort((a, b) => a.name.localeCompare(b.name)) }));
}

interface Tally {
  met: number;
  near: number;
  far: number;
  noTarget: number;
  /** com medições já devidas por registar (não inclui os anuais ainda não devidos) */
  incomplete: number;
  notDue: number;
}

function tally(results: IndicatorResult[]): Tally {
  const t: Tally = { met: 0, near: 0, far: 0, noTarget: 0, incomplete: 0, notDue: 0 };
  for (const r of results) {
    if (r.status === "met") t.met += 1;
    else if (r.status === "near") t.near += 1;
    else if (r.status === "far") t.far += 1;
    else if (r.status === "no-target") t.noTarget += 1;
    else if (r.status === "not-due") t.notDue += 1;
    if (r.missing > 0) t.incomplete += 1;
  }
  return t;
}

function StatusText({ status }: { status: IndicatorStatus }) {
  const { label, icon: Icon, className } = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap ${className}`}>
      <Icon size={12} />
      {label}
    </span>
  );
}

function MissingNote({ result, frequency }: { result: IndicatorResult; frequency: string }) {
  const text =
    result.status === "not-due"
      ? frequency === "ANNUAL"
        ? "Indicador anual: é normal ainda não ter medições."
        : "Ainda não é devida nenhuma medição neste ano."
      : `Já ${result.expected === 1 ? "devia haver 1 medição" : `deviam existir ${result.expected} medições`}.`;
  return <p className="text-xs text-muted-foreground">{text}</p>;
}

function IndicatorCard({ indicator, yearId, result }: { indicator: IndicatorWithProcesses; yearId: number; result: IndicatorResult }) {
  const { status, target, measurements, missing, last } = result;

  return (
    <div className="rounded-xl border border-border p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2" title={indicator.name}>
            <EntityLink entity="indicator" id={indicator.indicatorYearId} yearId={yearId}>
              {indicator.name}
            </EntityLink>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {FREQUENCY_LABELS[indicator.frequency] ?? indicator.frequency}
            {missing > 0 && measurements.length > 0 && (
              <span className={`inline-flex items-center gap-1 ml-2 font-medium ${WARN}`}>
                <AlertTriangle size={11} />
                {missing === 1 ? "falta 1 medição" : `faltam ${missing} medições`}
              </span>
            )}
          </p>
        </div>
        <div className="text-right shrink-0 space-y-1">
          {last && <p className="text-xl font-semibold leading-none text-foreground">{formatValue(Number(last.value), indicator.valueType)}</p>}
          {last && target && <p className="text-xs text-muted-foreground">meta {formatTarget(target, indicator.valueType)}</p>}
          <StatusText status={status} />
        </div>
      </div>

      {measurements.length > 0 ? (
        <IndicatorBarChart
          points={measurements.map((m) => ({
            measurementDate: m.measurementDate,
            value: Number(m.value),
            notes: m.notes?.startsWith("Importado da Matriz") ? null : m.notes,
          }))}
          valueType={indicator.valueType}
          target={target}
        />
      ) : (
        <MissingNote result={result} frequency={indicator.frequency} />
      )}
    </div>
  );
}

function tallySummary(t: Tally, count: number): string {
  const parts = [`${count} indicador(es)`];
  if (t.met) parts.push(`${t.met} com meta atingida`);
  if (t.near) parts.push(`${t.near} perto da meta`);
  if (t.far) parts.push(`${t.far} longe da meta`);
  if (t.incomplete) parts.push(`${t.incomplete} com medições em falta`);
  return parts.join(" · ");
}

/** `year`: ano civil (decide que medições já são devidas). `processOrder`: ordem dos processos na página. */
export function IndicatorResultsSection({
  yearId,
  year,
  processOrder = [],
}: {
  yearId: number | null;
  year: number | undefined;
  processOrder?: number[];
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["indicators", yearId],
    queryFn: () => getIndicatorsByYear(yearId!),
    enabled: yearId !== null,
  });

  const [onlyAttention, setOnlyAttention] = useState(false);
  const [expanded, setExpanded] = useState<number[]>([]);

  const results = useMemo(() => {
    const now = new Date();
    return new Map((data ?? []).map((i) => [i, getResult(i, year, now)] as const));
  }, [data, year]);
  const groups = useMemo(() => groupByProcess(data ?? [], processOrder), [data, processOrder]);
  const totals = useMemo(() => tally([...results.values()]), [results]);

  if (yearId === null || isLoading) {
    return <Skeleton className="h-40 w-full rounded-2xl" />;
  }
  if (isError) {
    return <p className="text-destructive">Erro ao carregar os indicadores.</p>;
  }
  if (!data?.length) {
    return <p className="text-sm text-muted-foreground">Não há indicadores neste ano.</p>;
  }

  const toggle = (key: number) =>
    setExpanded((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));
  const visibleGroups = groups
    .map((g) => ({
      ...g,
      shown: onlyAttention ? g.indicators.filter((i) => needsAttention(results.get(i)!)) : g.indicators,
    }))
    .filter((g) => g.shown.length > 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{data.length}</span> indicadores:{" "}
          <span className="font-semibold text-foreground">{totals.met}</span> com meta atingida,{" "}
          <span className="font-semibold text-foreground">{totals.near}</span> perto da meta e{" "}
          <span className="font-semibold text-foreground">{totals.far}</span> longe da meta;{" "}
          {totals.noTarget} sem meta numérica e{" "}
          <span className="font-semibold text-foreground">{totals.incomplete}</span> com medições em falta
          {totals.notDue > 0 && ` (mais ${totals.notDue} ainda sem dados, normal nos anuais)`}. A avaliação usa a última medição.
        </p>
        <p className="w-full text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <svg width="16" height="6" aria-hidden="true">
              <line x1="0" x2="16" y1="3" y2="3" className="stroke-foreground/70" strokeWidth="1.25" strokeDasharray="4 3" />
            </svg>
            meta
          </span>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block size-2 rounded-sm bg-emerald-500" />atingida</span>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block size-2 rounded-sm bg-amber-500" />perto (a menos de 25%)</span>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block size-2 rounded-sm bg-red-500" />longe da meta</span>
        </p>
        <div className="flex gap-2">
          <Button variant={onlyAttention ? "default" : "outline"} size="sm" onClick={() => setOnlyAttention((v) => !v)}>
            {onlyAttention ? "A mostrar só os que requerem atenção" : "Só os que requerem atenção"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(expanded.length === visibleGroups.length ? [] : visibleGroups.map((g) => g.key))}
          >
            {expanded.length === visibleGroups.length ? "Recolher tudo" : "Expandir tudo"}
          </Button>
        </div>
      </div>

      {visibleGroups.map((group) => {
        const open = expanded.includes(group.key);
        const t = tally(group.indicators.map((i) => results.get(i)!));
        return (
          <div key={group.key} className="border-t border-border first:border-t-0">
            <button
              type="button"
              onClick={() => toggle(group.key)}
              aria-expanded={open}
              className="w-full flex items-center justify-between gap-4 py-4 text-left hover:bg-muted/40 transition-colors rounded-lg"
            >
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{group.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {group.macro ? `${group.macro} · ` : ""}
                  {tallySummary(t, group.indicators.length)}
                </p>
              </div>
              {open ? <ChevronUp size={18} className="shrink-0" /> : <ChevronDown size={18} className="shrink-0" />}
            </button>
            {open && (
              <div className="grid gap-3 pb-4 md:grid-cols-2">
                {group.shown.map((indicator) => (
                  <IndicatorCard
                    key={indicator.indicatorYearId ?? indicator.id}
                    indicator={indicator}
                    yearId={yearId}
                    result={results.get(indicator)!}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
