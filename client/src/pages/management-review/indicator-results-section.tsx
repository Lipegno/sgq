import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowDownRight, CheckCircle2, ChevronDown, ChevronUp, Clock, Download, Loader2, Minus, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EntityLink } from "@/components/entity-link";
import { getIndicatorsByYear } from "@/api/core";
import type { IndicatorWithProcesses } from "@/types";
import {
  FREQUENCY_LABELS,
  NO_PROCESS,
  STATUS_LABELS,
  formatTarget,
  formatValue,
  getResult,
  groupByProcess,
  measurementNote,
  missingNoteText,
  needsAttention,
  tally,
  tallySummary,
  type IndicatorResult,
  type IndicatorStatus,
} from "@/lib/indicator-results";
import { IndicatorBarChart } from "./indicator-bar-chart";

const GOOD = "text-emerald-700 dark:text-emerald-400";
const WARN = "text-amber-700 dark:text-amber-400";
const BAD = "text-red-700 dark:text-red-400";
const NEUTRAL = "text-muted-foreground";

/** Cada estado leva ícone e texto, nunca só cor. */
const STATUS: Record<IndicatorStatus, { icon: typeof CheckCircle2; className: string }> = {
  met: { icon: CheckCircle2, className: GOOD },
  near: { icon: TrendingUp, className: WARN },
  far: { icon: ArrowDownRight, className: BAD },
  "no-target": { icon: Minus, className: NEUTRAL },
  "no-data": { icon: AlertTriangle, className: WARN },
  "not-due": { icon: Clock, className: NEUTRAL },
};

function StatusText({ status }: { status: IndicatorStatus }) {
  const { icon: Icon, className } = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap ${className}`}>
      <Icon size={12} />
      {STATUS_LABELS[status]}
    </span>
  );
}

function MissingNote({ result, frequency }: { result: IndicatorResult; frequency: string }) {
  return <p className="text-xs text-muted-foreground">{missingNoteText(result, frequency)}</p>;
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
            {FREQUENCY_LABELS[indicator.frequency] ?? indicator.frequency ?? ""}
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
            notes: measurementNote(m.notes),
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

/** Uma linha com o balanço dos indicadores, para a página da revisão (os gráficos estão noutra página). */
export function IndicatorResultsSummary({ yearId, year }: { yearId: number | null; year: number | undefined }) {
  const { data } = useQuery({
    queryKey: ["indicators", yearId],
    queryFn: () => getIndicatorsByYear(yearId!),
    enabled: yearId !== null,
  });
  const totals = useMemo(() => {
    const now = new Date();
    return tally((data ?? []).map((i) => getResult(i, year, now)));
  }, [data, year]);
  if (!data?.length) return null;
  return (
    <p className="text-sm text-muted-foreground">
      Indicadores: <span className="font-semibold text-foreground">{totals.met}</span> com meta atingida,{" "}
      <span className="font-semibold text-foreground">{totals.near}</span> perto e{" "}
      <span className="font-semibold text-foreground">{totals.far}</span> longe da meta;{" "}
      <span className="font-semibold text-foreground">{totals.incomplete}</span> com medições em falta.
    </p>
  );
}

/** `year`: ano civil (decide que medições já são devidas). `processOrder`: ordem dos processos na página. */
export function IndicatorResultsSection({
  yearId,
  year,
  processOrder = [],
  processYearId = null,
  onProcessChange,
}: {
  yearId: number | null;
  year: number | undefined;
  processOrder?: number[];
  /** processo escolhido (filtra a lista); null = todos */
  processYearId?: number | null;
  onProcessChange?: (processYearId: number | null) => void;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["indicators", yearId],
    queryFn: () => getIndicatorsByYear(yearId!),
    enabled: yearId !== null,
  });

  const [onlyAttention, setOnlyAttention] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [expanded, setExpanded] = useState<number[]>(processYearId !== null ? [processYearId] : []);

  // Ao escolher (ou chegar com) um processo, mostra-o já aberto.
  useEffect(() => {
    if (processYearId !== null) setExpanded([processYearId]);
  }, [processYearId]);

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
    .filter((g) => processYearId === null || g.key === processYearId)
    .map((g) => ({
      ...g,
      shown: onlyAttention ? g.indicators.filter((i) => needsAttention(results.get(i)!)) : g.indicators,
    }))
    .filter((g) => g.shown.length > 0);

  // o que está à vista (processo e filtro de atenção) é o que vai para o PowerPoint
  const exportPowerPoint = async () => {
    setExporting(true);
    try {
      const { exportIndicatorsPptx } = await import("@/lib/export-indicators-pptx");
      await exportIndicatorsPptx({
        year,
        filterNote: onlyAttention ? "só os que requerem atenção" : undefined,
        groups: visibleGroups.map((g) => ({
          name: g.name,
          macro: g.macro,
          summary: tallySummary(tally(g.indicators.map((i) => results.get(i)!)), g.indicators.length),
          entries: g.shown.map((indicator) => ({ indicator, result: results.get(indicator)! })),
        })),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar o PowerPoint");
    } finally {
      setExporting(false);
    }
  };

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
        <div className="flex flex-wrap gap-2">
          {onProcessChange && (
            <Select
              value={processYearId === null ? "all" : String(processYearId)}
              onValueChange={(v) => onProcessChange(v === "all" ? null : Number(v))}
            >
              <SelectTrigger className="h-8 w-[230px]">
                <SelectValue placeholder="Todos os processos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os processos</SelectItem>
                {groups
                  .filter((g) => g.key !== NO_PROCESS)
                  .map((g) => (
                    <SelectItem key={g.key} value={String(g.key)}>
                      {g.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
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
          <Button variant="outline" size="sm" onClick={exportPowerPoint} disabled={exporting || visibleGroups.length === 0}>
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {exporting ? "A gerar…" : "Exportar PowerPoint"}
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
              <div className="grid gap-3 pb-4 md:grid-cols-2 xl:grid-cols-3">
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
