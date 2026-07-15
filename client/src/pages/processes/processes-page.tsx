import { useState, useMemo, useEffect } from "react";
import { ChevronDown, GitBranch, History, Filter } from "lucide-react";
import { getMacroProcessHierarchy, getDepartments, getYears } from "@/api/core";
import { useQuery } from "@tanstack/react-query";
import { ProcessItem } from "./process-item";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateMacroProcessDialog } from "./create-macro-process-dialog";
import { MacroProcessDropdown } from "./macro-process-dropdown";
import { CreateIndependentProcessDialog } from "./create-independent-process-dialog";
import { YearSelector } from "@/components/year-selector";
import { LogDialog } from "@/components/log-dialog";
import type { EntityType, DepartmentResponse, YearResponse } from "@/types";
import { useAuth } from "@/context/auth-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProcessesPage() {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [yearId, setYearId] = useState<number | null>(null);
  const [pageLogOpen, setPageLogOpen] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const { isExternal } = useAuth();

  const selectedYearId = yearId;

  const { data: years } = useQuery({
    queryKey: ["years"],
    queryFn: getYears,
  });

  useEffect(() => {
    if (selectedYearId !== null) return;
    if (!years || years.length === 0) return;
    const currentYearVal = new Date().getFullYear();
    const match = years.find((y: YearResponse) => y.year === currentYearVal) ?? years[0];
    setYearId(match.id);
  }, [selectedYearId, years]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["macroprocess-hierarchy", selectedYearId],
    queryFn: () => getMacroProcessHierarchy(selectedYearId!),
    enabled: !!selectedYearId,
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
  });

  const filteredData = useMemo(() => {
    if (!data || departmentFilter === "all") return data;
    const deptId = Number(departmentFilter);

    const filterProcesses = (processes: any[]) =>
      processes.filter((p) => p.departments?.some((d: DepartmentResponse) => d.id === deptId));

    return {
      macroProcesses: data.macroProcesses.map((macro) => ({
        ...macro,
        processes: filterProcesses(macro.processes),
      })).filter((macro) => macro.processes.length > 0),
      standaloneProcesses: filterProcesses(data.standaloneProcesses),
    };
  }, [data, departmentFilter]);

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="flex h-full flex-col gap-4 max-w-5xl mx-auto w-full mb-40 mt-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 shadow-sm">
            <GitBranch size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Macro Processos</h1>
            <p className="text-muted-foreground text-sm mt-1">Gestão da estrutura de processos da organização.</p>
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
          <YearSelector selectedYearId={yearId} onYearChange={setYearId} />
          {!isExternal && <CreateMacroProcessDialog yearId={selectedYearId} />}
        </div>
      </div>

      {selectedYearId === null && (
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Selecione um ano para visualizar os processos.</p>
        </div>
      )}

      {selectedYearId !== null && departments && departments.length > 0 && (
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-muted-foreground" />
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[220px] rounded-lg shadow-sm font-bold">
              <SelectValue placeholder="Filtrar por departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os departamentos</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={String(dept.id)}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading && (
        <div className="space-y-8">
          <Skeleton className="h-10 w-1/4 rounded-xl bg-black/10 dark:bg-white/10" />
          <Skeleton className="h-12 w-full rounded-xl bg-black/10 dark:bg-white/10" />
          <Skeleton className="h-12 w-full rounded-xl bg-black/10 dark:bg-white/10" />
        </div>
      )}

      {isError && (
        <p className="text-destructive">Erro ao carregar os processos.</p>
      )}

      {!isLoading && filteredData?.standaloneProcesses && filteredData.standaloneProcesses.length > 0 && (
        <div>
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => toggleSection("general")}
              className="flex items-center gap-2 group"
            >
              <div
                className={`text-slate-400 transition-transform duration-200 ${
                  collapsedSections["general"] ? "-rotate-90" : ""
                }`}
              >
                <ChevronDown size={20} />
              </div>
              <h2 className="text-xl font-bold tracking-wide whitespace-nowrap opacity-70">
                Sem Macro Processo
              </h2>
            </button>
            <div className="h-px bg-slate-200 w-full mt-1"></div>
            {!isExternal && <CreateIndependentProcessDialog yearId={selectedYearId} />}
          </div>
          <div
            className={`overflow-hidden transition-all duration-200 ease-in-out ${
              collapsedSections["general"] ? "max-h-0 opacity-0" : "max-h-[1000px] opacity-100"
            }`}
          >
            <div className="space-y-4 py-2">
              {filteredData.standaloneProcesses.map((process) => (
                <ProcessItem process={process} key={process.processYearId} macroProcessId={0} isExternal={isExternal} yearId={selectedYearId} />
              ))}
            </div>
          </div>
        </div>
      )}

      {!isLoading && filteredData?.macroProcesses.map((macro) => (
        <div key={macro.macroProcessYearId}>
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => toggleSection(macro.name)}
              className="flex items-center gap-2 group"
            >
              <div
                className={`text-slate-400 transition-transform duration-200 ${
                  collapsedSections[macro.name] ? "-rotate-90" : ""
                }`}
              >
                <ChevronDown size={20} />
              </div>
              <h2 className="text-xl font-bold tracking-wide whitespace-nowrap">{macro.name}</h2>
            </button>
            <div className="h-px bg-slate-200 w-full mt-1"></div>
            <MacroProcessDropdown macroProcessId={macro.macroProcessId} macroProcessYearId={macro.macroProcessYearId} yearId={selectedYearId} />
          </div>
          {macro.processes.length > 0 && (
            <div
              className={`overflow-hidden transition-all duration-200 ease-in-out ${
                collapsedSections[macro.name] ? "max-h-0 opacity-0" : "max-h-[1000px] opacity-100"
              }`}
            >
              <div className="space-y-4 py-2">
                {macro.processes.map((process) => (
                  <ProcessItem process={process} key={process.processYearId} macroProcessId={macro.macroProcessYearId} isExternal={isExternal} yearId={selectedYearId} />
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {!isLoading && selectedYearId !== null && !filteredData?.macroProcesses?.length && !(filteredData?.standaloneProcesses?.length) && (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <GitBranch className="text-slate-400" size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Nenhum processo encontrado</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2">
            Nenhum processo registado para este ano.
          </p>
        </div>
      )}

      <LogDialog
        open={pageLogOpen}
        onOpenChange={setPageLogOpen}
        entityTypes={["MACRO_PROCESS", "PROCESS"] as EntityType[]}
        yearId={selectedYearId ?? undefined}
        title="Histórico — Macro Processos"
      />
    </div>
  );
}