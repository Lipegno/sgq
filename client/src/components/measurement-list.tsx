import React, { useState } from "react";
import { Plus, TrendingUp, Trash2 } from "lucide-react";
import type { Measurement } from "@/types";
import { InlineEdit } from "./inline-edit";
import ConfirmDialog from "@/components/confirm-dialog";

interface MeasurementListProps {
  measurements: Measurement[];
  onAdd?: () => void;
  onUpdate?: (id: string, field: keyof Measurement, value: string) => void;
  onDelete?: (id: string) => void;
}

export const MeasurementList: React.FC<MeasurementListProps> = ({
  measurements,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
          <TrendingUp size={12} /> Medições
        </h4>
        <button
          onClick={onAdd}
          className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
        >
          <Plus size={12} /> Registar Medição
        </button>
      </div>

      <div className="space-y-3">
        {measurements.length === 0 ? (
          <div className="text-xs text-slate-400 italic py-4 text-center bg-slate-50/50 rounded border border-dashed border-slate-200">
            Ainda sem registos de medições.
          </div>
        ) : null}

        {measurements.map(m => (
          <div
            key={m.id}
            className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-8">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Data
                  </label>
                  <div className="font-mono text-sm text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block min-w-[100px]">
                    <InlineEdit
                      value={m.measurementDate}
                      type="date"
                      //onSave={v => onUpdate(m.id, "date", v)}
                    />
                  </div>
                </div>

                {/* Value */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Valor
                  </label>
                  <div className="font-bold text-sm text-slate-900 bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block min-w-[80px]">
                    <InlineEdit
                      value={m.value.toString()}
                      //onSave={v => onUpdate(m.id, "value", v)}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={() => setConfirmDeleteId(m.id)}
                className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100"
                title="Eliminar Medição"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Notes - Full Width Vertical Stack */}
            <div className="w-full border-t border-slate-100 pt-2 mt-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Notas
              </label>
              <div className="text-sm text-slate-600 w-full min-h-[24px]">
                <InlineEdit
                  value={m.notes}
                  type="textarea"
                  placeholder="Add details about this measurement..."
                  multiline={true}
                  //onSave={v => onUpdate(m.id, "notes", v)}
                  className="w-full block"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
        title="Eliminar Medição"
        description="Tem a certeza que deseja eliminar esta medição?"
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (confirmDeleteId !== null) onDelete?.(confirmDeleteId);
        }}
      />
    </div>
  );
};
