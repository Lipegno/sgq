import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getManagementReviewSummary } from "@/api/core";
import { buildAttentionItems } from "./management-review-attention";
import { EntityLink } from "@/components/entity-link";

const MONTHS_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function formatFullDatePt(date: Date): string {
  return `${date.getDate()} de ${MONTHS_PT[date.getMonth()]} de ${date.getFullYear()}`;
}

function formatMonthYearPt(date: Date): string {
  const month = MONTHS_PT[date.getMonth()];
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} de ${date.getFullYear()}`;
}

/* -------------------------------------------------------------------------- */
/*  Blocos de layout partilhados                                              */
/*                                                                            */
/*  Sumário para consulta no ecrã (sem exportação para PDF): capa, resumo     */
/*  executivo e pontos de atenção. O detalhe completo continua na aplicação.  */
/* -------------------------------------------------------------------------- */

function Section({ children }: { children: React.ReactNode }) {
  return <div className="w-full max-w-4xl mx-auto mt-10 first:mt-0">{children}</div>;
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
        Universidade da Madeira · Sistema de Gestão da Qualidade
      </span>
      <div className="h-[3px] w-16 bg-[#156082] mt-1 mb-3" />
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

type TileStatus = "good" | "medium" | "bad" | "neutral";

/** Bom quando atinge o total, mau quando é zero (havendo algo para medir), médio no resto. */
function ratioStatus(done: number, total: number): TileStatus {
  if (total <= 0) return "neutral";
  if (done >= total) return "good";
  if (done <= 0) return "bad";
  return "medium";
}

const TILE_STYLES: Record<TileStatus, string> = {
  good: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/10",
  medium: "border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/10",
  bad: "border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/10",
  neutral: "border-border bg-card",
};

const TILE_VALUE_STYLES: Record<TileStatus, string> = {
  good: "text-emerald-700 dark:text-emerald-400",
  medium: "text-amber-700 dark:text-amber-400",
  bad: "text-red-700 dark:text-red-400",
  neutral: "text-foreground",
};

function Tile({
  label,
  value,
  detail,
  status = "neutral",
}: {
  label: string;
  value: string | number;
  detail?: string;
  status?: TileStatus;
}) {
  return (
    <div className={`rounded-xl border p-4 ${TILE_STYLES[status]}`}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${TILE_VALUE_STYLES[status]}`}>{value}</p>
      {detail && <p className="text-xs text-muted-foreground mt-1">{detail}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function ManagementReviewPresentation({
  yearId,
  year,
  onClose,
}: {
  yearId: number;
  year: number;
  onClose: () => void;
}) {
  const { data: summary } = useQuery({
    queryKey: ["management-review", "summary", yearId],
    queryFn: () => getManagementReviewSummary(yearId),
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const attentionItems = buildAttentionItems(summary);
  const now = new Date();
  const generatedAt = formatFullDatePt(now);
  const monthYear = formatMonthYearPt(now);

  return (
    <div className="fixed inset-0 z-[100] bg-muted overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-background border-b border-border px-6 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Resumo — Revisão pela Gestão {year}</p>
          <p className="text-xs text-muted-foreground">
            Números e pontos de atenção do ciclo. O detalhe completo está no resto da página.
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          <X className="size-4" /> Fechar
        </Button>
      </div>

      <div className="py-8 px-4">
        {/* Capa — banner com o modelo oficial da UMa */}
        <div className="relative w-full max-w-4xl mx-auto aspect-[16/6] overflow-hidden rounded-2xl shadow-sm">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/branding/uma-cover.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 flex flex-col justify-end p-[4%]">
            <h1
              className="font-bold text-black leading-tight"
              style={{ fontSize: "clamp(18px, 3vw, 40px)" }}
            >
              Revisão pela Gestão de Topo
            </h1>
            <p
              className="font-bold text-white mt-2"
              style={{ fontSize: "clamp(10px, 1.2vw, 16px)" }}
            >
              Análise Crítica ao Sistema Integrado de Gestão da Universidade da Madeira — Ciclo {year}
            </p>
            <p
              className="mt-3 font-medium text-black/80"
              style={{ fontSize: "clamp(8px, 0.8vw, 12px)" }}
            >
              SISTEMA DE GESTÃO DA QUALIDADE <span style={{ color: "#00B0F0" }}>|</span> {monthYear}
            </p>
          </div>
        </div>

        <Section>
          <SectionHeading title="Resumo Executivo" subtitle={`Ciclo ${year} · Gerado em ${generatedAt}`} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Tile
              label="Processos com responsável"
              value={`${summary?.overview.processesWithResponsible ?? 0}/${summary?.overview.processes ?? 0}`}
              status={ratioStatus(summary?.overview.processesWithResponsible ?? 0, summary?.overview.processes ?? 0)}
            />
            <Tile
              label="Indicadores com medição"
              value={`${summary?.overview.indicatorsWithMeasurements ?? 0}/${summary?.overview.indicators ?? 0}`}
              status={ratioStatus(summary?.overview.indicatorsWithMeasurements ?? 0, summary?.overview.indicators ?? 0)}
            />
            <Tile
              label="Objetivos atingidos"
              value={`${summary?.overview.objectivesAchieved ?? 0}/${summary?.overview.objectives ?? 0}`}
              status={ratioStatus(summary?.overview.objectivesAchieved ?? 0, summary?.overview.objectives ?? 0)}
            />
            <Tile
              label="Não conformidades resolvidas"
              value={`${summary?.overview.nonConformitiesResolved ?? 0}/${summary?.overview.nonConformities ?? 0}`}
              status={ratioStatus(summary?.overview.nonConformitiesResolved ?? 0, summary?.overview.nonConformities ?? 0)}
            />
            <Tile
              label="Auditorias concluídas"
              value={`${summary?.audits.finished ?? 0}/${summary?.audits.total ?? 0}`}
              status={ratioStatus(summary?.audits.finished ?? 0, summary?.audits.total ?? 0)}
            />
            <Tile
              label="Satisfação dos estudantes"
              value={summary?.customerSatisfaction.hasYear ? "Com relatório" : "Sem relatório"}
              detail={`${summary?.customerSatisfaction.documents ?? 0} documento(s)`}
              status={summary?.customerSatisfaction.hasYear ? "good" : "bad"}
            />
            <Tile
              label="Fornecedores avaliados"
              value={`${summary?.suppliers.suppliersEvaluated ?? 0}/${summary?.suppliers.suppliers ?? 0}`}
              status={ratioStatus(summary?.suppliers.suppliersEvaluated ?? 0, summary?.suppliers.suppliers ?? 0)}
            />
            <Tile
              label="Alterações concluídas"
              value={`${summary?.changes.finished ?? 0}/${summary?.changes.total ?? 0}`}
              status={ratioStatus(summary?.changes.finished ?? 0, summary?.changes.total ?? 0)}
            />
          </div>
        </Section>

        <Section>
          <SectionHeading title="Pontos de Atenção" subtitle="Itens que precisam de decisão ou acompanhamento da gestão" />
          {attentionItems.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Sem pontos de atenção identificados neste ciclo.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {attentionItems.map((item) => (
                <div key={item.id} className="text-sm border-b border-border pb-1.5">
                  <span className="font-semibold text-foreground">{item.type}: </span>
                  <EntityLink entity={item.entity} id={item.entityId} yearId={yearId} onNavigate={onClose}>
                    {item.title}
                  </EntityLink>
                  <span className="text-muted-foreground"> — {item.description}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <p className="w-full max-w-4xl mx-auto text-xs text-muted-foreground italic mt-10 mb-10">
          Este sumário mostra os números principais e os pontos de atenção do ciclo. O detalhe completo
          (processos, objetivos, não conformidades, plano de ações, auditorias, fornecedores, reuniões e
          estado documental) está no resto da página Revisão pela Gestão.
        </p>
      </div>
    </div>
  );
}
