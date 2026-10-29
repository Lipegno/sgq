import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BarChart3 } from "lucide-react";

import { YearSelector } from "@/components/year-selector";
import { useAuth } from "@/context/auth-context";
import { getManagementReviewSummary, getYears } from "@/api/core";
import { IndicatorResultsSection } from "./indicator-results-section";

/**
 * Resultados dos indicadores, processo a processo, numa página própria (com mais espaço do que
 * dentro da Revisão pela Gestão). Ano e processo vêm do URL: /revisao-gestao/indicadores?ano=3&processo=17
 */
export default function ManagementReviewIndicatorsPage() {
  const { isExternal, allowedYearIds } = useAuth();
  const [params, setParams] = useSearchParams();

  const urlYear = Number(params.get("ano")) || null;
  const yearId = urlYear !== null && (!isExternal || (allowedYearIds?.includes(urlYear) ?? false)) ? urlYear : null;
  const processYearId = Number(params.get("processo")) || null;

  const update = (changes: { ano?: number | null; processo?: number | null }) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (value === null || value === undefined) next.delete(key);
          else next.set(key, String(value));
        }
        return next;
      },
      { replace: true },
    );

  const { data: years } = useQuery({ queryKey: ["years"], queryFn: getYears });
  const year = years?.find((y) => y.id === yearId)?.year;

  // só para saber a ordem em que a Revisão mostra os processos (estratégicos, nucleares, suporte)
  const { data: summary } = useQuery({
    queryKey: yearId ? ["management-review", "summary", yearId] : ["management-review", "summary", "disabled"],
    queryFn: () => getManagementReviewSummary(yearId!),
    enabled: yearId !== null,
  });
  const processOrder = useMemo(() => summary?.processes.map((p) => p.processYearId) ?? [], [summary]);

  return (
    <div className="py-8 w-full max-w-7xl mx-auto">
      <Link
        to="/revisao-gestao"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4"
      >
        <ArrowLeft size={14} />
        Revisão pela Gestão
      </Link>

      <div className="flex items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-sm">
            <BarChart3 size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Resultados dos indicadores</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Evolução das medições de cada indicador, por processo, face à meta{year ? ` — ${year}` : ""}
            </p>
          </div>
        </div>

        <YearSelector
          selectedYearId={yearId}
          onYearChange={(id) => update({ ano: id, processo: null })}
        />
      </div>

      {yearId === null ? (
        <p className="text-muted-foreground">Selecione um ano para consultar os resultados.</p>
      ) : (
        <IndicatorResultsSection
          yearId={yearId}
          year={year}
          processOrder={processOrder}
          processYearId={processYearId}
          onProcessChange={(id) => update({ processo: id })}
        />
      )}
    </div>
  );
}
