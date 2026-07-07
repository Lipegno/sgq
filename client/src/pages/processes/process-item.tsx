import { FolderGit2, Users } from "lucide-react";
import { useState } from "react";
import { ProcessDropdown } from "./process-dropdown";
import { ProcessDetailDialog } from "./process-detail-dialog";
import type { ProcessHierarchyItem } from "@/types";

interface ProcessItemProps {
  process: ProcessHierarchyItem;
  macroProcessId: number;
  isExternal?: boolean;
  yearId: number | null;
}

export const ProcessItem: React.FC<ProcessItemProps> = ({ process, macroProcessId, isExternal = false, yearId }) => {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <>
      <div
        className="border border-slate-200 rounded-md mb-4 shadow-sm overflow-hidden cursor-pointer hover:border-slate-300 transition-colors"
        onClick={() => setDetailOpen(true)}
      >
        <div className="flex items-center gap-3 px-4 py-3 select-none">
          <FolderGit2 size={16} className="text-slate-400 shrink-0" />

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{process.name}</h3>
          </div>

          <div className="text-sm text-slate-500 mr-4 flex items-center gap-2 shrink-0">
            <Users size={14} />
            {process.responsibles.length > 0
              ? process.responsibles.map((r) => `${r.firstName} ${r.lastName}`).join(", ")
              : "—"}
          </div>

          <div className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium shrink-0">
            {process.indicators.length}
            {process.indicators.length === 1 ? " Indicador" : " Indicadores"}
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <ProcessDropdown processId={process.processId} processYearId={process.processYearId} macroProcessId={macroProcessId} yearId={yearId!} processName={process.name} associatedYearIds={new Set(process.years.filter((y) => y.selected).map((y) => y.id))} />
          </div>
        </div>
      </div>

      <ProcessDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        process={process}
        macroProcessId={macroProcessId}
        yearId={yearId}
        isExternal={isExternal}
      />
    </>
  );
};
