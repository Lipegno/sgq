import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  History,
  Home,
  ListChecks,
  Target,
} from "lucide-react";

import { YearSelector } from "@/components/year-selector";
import { Skeleton } from "@/components/ui/skeleton";
import { getHome } from "@/api/core";
import { useAuth } from "@/context/auth-context";
import type { HomeItem, HomeProfile } from "@/types";

const PROFILE_SUBTITLE: Record<HomeProfile, string> = {
  MANAGER: "Visão geral do Sistema de Gestão da Qualidade",
  DEPARTMENT_MANAGER: "O que precisa de atenção na sua área",
  AUDITOR: "Consulta do sistema (só leitura)",
  USER: "O que está atribuído a si",
};

const TONE_CLASSES: Record<HomeItem["tone"], string> = {
  danger: "bg-destructive/10 text-destructive",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  accent: "bg-primary/10 text-primary",
  neutral: "bg-muted text-muted-foreground",
};

function formatDate(date: string | null): string | null {
  if (!date) return null;
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

export default function HomePage() {
  const { user, isExternal, allowedYearIds } = useAuth();
  const externalWithoutYears = isExternal && allowedYearIds !== null && allowedYearIds.length === 0;
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);

  // O conteúdo depende de quem está autenticado: o utilizador entra na chave para que,
  // ao trocar de conta, não se mostre a resposta guardada da sessão anterior.
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["home", user?.id, selectedYearId],
    queryFn: () => getHome(selectedYearId!),
    enabled: selectedYearId !== null,
  });

  const firstName = data?.userName?.split(" ")[0];
  const subtitle = data
    ? data.profile === "DEPARTMENT_MANAGER" && data.departments.length > 0
      ? `${PROFILE_SUBTITLE[data.profile]} · ${data.departments.join(", ")}`
      : PROFILE_SUBTITLE[data.profile]
    : "";

  return (
    <div className="py-8 w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-sm">
            <Home size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {firstName ? `Olá, ${firstName}` : "Início"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
          </div>
        </div>
        <YearSelector selectedYearId={selectedYearId} onYearChange={setSelectedYearId} />
      </div>

      {externalWithoutYears ? (
        <div className="bg-card border border-border rounded-2xl py-20 text-center">
          <Home size={40} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Ainda não tem ciclos atribuídos. Peça ao gestor do sistema acesso a um ano.
          </p>
        </div>
      ) : selectedYearId === null ? (
        <div className="bg-card border border-border rounded-2xl py-20 text-center">
          <Home size={40} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Selecione um ciclo para ver o resumo.</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      ) : isError || !data ? (
        <p className="text-destructive">
          {(error as { response?: { status?: number } } | null)?.response?.status === 403
            ? "Não tem acesso a este ciclo."
            : "Não foi possível carregar a página Início."}
        </p>
      ) : (
        <div className="space-y-6">
          {data.cycle && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Metric icon={<ClipboardCheck size={18} />} label="Processos" value={String(data.cycle.processes)} />
              <Metric
                icon={<CheckCircle2 size={18} />}
                label="Objetivos atingidos"
                value={`${data.cycle.objectivesAchieved} / ${data.cycle.objectives}`}
              />
              <Metric
                icon={<Target size={18} />}
                label="Indicadores com medições"
                value={`${data.cycle.indicatorsWithMeasurements} / ${data.cycle.indicators}`}
              />
              <Metric
                icon={<AlertTriangle size={18} />}
                label="NC abertas"
                value={String(data.cycle.nonConformitiesOpen)}
              />
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {data.attention && (
              <Block
                icon={<AlertTriangle size={16} />}
                title={data.profile === "DEPARTMENT_MANAGER" ? "Pontos de atenção · a sua área" : "Pontos de atenção"}
                items={data.attention}
                empty="Nada a assinalar neste ciclo."
              />
            )}
            {data.profile !== "AUDITOR" || data.myWork.length > 0 ? (
              <Block
                icon={<ListChecks size={16} />}
                title="O meu trabalho"
                items={data.myWork}
                empty="Não tem tarefas pendentes neste ciclo."
              />
            ) : null}
            {data.missingMeasurements && (
              <Block
                icon={<BarChart3 size={16} />}
                title="Medições em falta"
                items={data.missingMeasurements}
                empty="Todas as medições do último período estão registadas."
                footnote={
                  data.profile === "USER"
                    ? "Só aparecem indicadores em que o seu nome consta como responsável."
                    : undefined
                }
              />
            )}
            {data.upcomingAudits && (
              <Block
                icon={<Calendar size={16} />}
                title="Auditorias próximas"
                items={data.upcomingAudits}
                empty="Sem auditorias planeadas nos próximos 60 dias."
              />
            )}
            {data.recentActivity && (
              <Block
                icon={<History size={16} />}
                title="Atividade recente"
                items={data.recentActivity}
                empty="Sem alterações registadas neste ciclo."
              />
            )}
            {data.profile === "AUDITOR" && (
              <div className="rounded-xl border border-border bg-card p-5">
                <BlockTitle icon={<FileText size={16} />} title="Consulta rápida" />
                <div className="divide-y divide-border">
                  <QuickLink to="/politica-sg" label="Política do sistema" />
                  <QuickLink to="/ambito" label="Âmbito do SGQ" />
                  <QuickLink to="/revisao-gestao" label="Revisão pela gestão" />
                </div>
              </div>
            )}
          </div>

          {data.profile === "MANAGER" && (
            <Link
              to="/revisao-gestao"
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              Abrir a Revisão pela Gestão do ciclo
              <ArrowRight size={16} />
            </Link>
          )}

          {data.profile === "USER" && data.myWork.length === 0 && (data.missingMeasurements?.length ?? 0) === 0 && (
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              Sem pendências. Os restantes módulos estão no menu lateral.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="text-primary">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function BlockTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
      <span className="text-muted-foreground">{icon}</span>
      {title}
    </h2>
  );
}

function Block({
  icon,
  title,
  items,
  empty,
  footnote,
}: {
  icon: React.ReactNode;
  title: string;
  items: HomeItem[];
  empty: string;
  footnote?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <BlockTitle icon={icon} title={title} />
      {items.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item, index) => (
            <HomeRow key={`${item.title}-${index}`} item={item} />
          ))}
        </ul>
      )}
      {footnote && <p className="mt-3 text-xs text-muted-foreground">{footnote}</p>}
    </div>
  );
}

function HomeRow({ item }: { item: HomeItem }) {
  const date = formatDate(item.date);
  const content = (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm text-foreground" title={item.title}>{item.title}</p>
        {item.context && (
          <p className="truncate text-xs text-muted-foreground" title={item.context}>{item.context}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {date && <span className="text-xs text-muted-foreground">{date}</span>}
        {item.badge && (
          <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${TONE_CLASSES[item.tone]}`}>
            {item.badge}
          </span>
        )}
      </div>
    </div>
  );
  return (
    <li>
      {item.link ? (
        <Link to={item.link} className="block rounded-md hover:bg-muted/40 -mx-2 px-2 transition-colors">
          {content}
        </Link>
      ) : (
        content
      )}
    </li>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="flex items-center justify-between py-2.5 text-sm text-foreground hover:text-primary">
      {label}
      <ArrowRight size={14} />
    </Link>
  );
}
