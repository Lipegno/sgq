import { useState } from "react";
import type { Indicator, IndicatorFrequency } from "@/types";
import { InlineEdit } from "./inline-edit";
import { Calculator, Unlink, User } from "lucide-react";
import { MeasurementList } from "./measurement-list";
import ConfirmDialog from "@/components/confirm-dialog";

export const IndicatorCard: React.FC<{ indicator: Indicator }> = ({ indicator }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col h-full">
      {/* Header / Main Info */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <InlineEdit
                value={indicator.name}
                onSave={v => console.log()} //onUpdate(indicator.id, "name", v)}
                className="flex-1"
              />
            </h3>
          </div>
          <div className="flex">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                indicator.frequency === "MONTHLY"
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : indicator.frequency === "ANNUAL"
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
              }`}
            >
              <InlineEdit
                value={indicator.frequency}
                type="select"
                options={["MONTHLY", "ANNUAL", "SEMESTER", "WEEKLY", "TRIMESTER"]}
                //onSave={v => onUpdate(indicator.id, "frequency", v)}
                className="w-max"
              />
            </span>
            {
              //onRemove && (
              true && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setConfirmOpen(true);
                  }}
                  className="ml-1 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Desassociar do processo"
                >
                  <Unlink size={16} />
                </button>
              )
            }
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {/* Left Column: Metadata */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <User size={14} className="mt-1 text-slate-400" />
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500">Responsável</label>
                <InlineEdit
                  value={indicator.owner!}
                  //onSave={v => onUpdate(indicator.id, "responsible", v)}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Formula */}
          <div className="bg-slate-50 rounded p-3 border border-slate-100">
            <div className="flex items-center gap-2 mb-1 text-slate-500">
              <Calculator size={14} />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Fórmula / Métrica
              </span>
            </div>
            <div className="font-mono text-sm text-slate-700">
              <InlineEdit
                value={indicator.formula}
                type="textarea"
                multiline={true}
                //onSave={v => onUpdate(indicator.id, "formula", v)}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Measurements Section */}
      <div className="bg-slate-50/30 p-4 flex-1">
        <MeasurementList
          measurements={indicator.measurements}
          //onAdd={() => onAddMeasurement(indicator.id)}
          //onUpdate={(mid, field, val) => onUpdateMeasurement(indicator.id, mid, field, val)}
          //onDelete={mid => onDeleteMeasurement(indicator.id, mid)}
        />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Desassociar Indicador"
        description="Tem a certeza que deseja desassociar este indicador do processo?"
        confirmLabel="Desassociar"
        onConfirm={() => {
          //onRemove?.();
        }}
      />
    </div>
  );
};
