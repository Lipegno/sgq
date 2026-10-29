import { useEffect, useRef, useState } from "react";

import {
  formatTarget,
  formatValue,
  longDate,
  progressStatus,
  shortDate,
  type IndicatorTarget,
} from "@/lib/indicator-results";

interface Point {
  measurementDate: string;
  value: number;
  notes?: string | null;
}

const HEIGHT = 128;
const PAD = { top: 18, right: 6, bottom: 20, left: 6 };

/** Cor de cada barra pelo seu estado face à meta (classes completas para o Tailwind as encontrar). */
const BAR_CLASS = {
  met: { on: "fill-emerald-500", off: "fill-emerald-500/55" },
  near: { on: "fill-amber-500", off: "fill-amber-500/55" },
  far: { on: "fill-red-500", off: "fill-red-500/55" },
  none: { on: "fill-primary", off: "fill-primary/55" },
} as const;

const LEGEND = [
  { key: "met", label: "Atingida", swatch: "bg-emerald-500" },
  { key: "near", label: "Perto da meta", swatch: "bg-amber-500" },
  { key: "far", label: "Longe da meta", swatch: "bg-red-500" },
] as const;

/** Largura real do contentor, para o texto do gráfico ter sempre o mesmo tamanho. */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth || 320);
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width) || 320));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * Medições de um indicador em barras (uma por medição, por ordem de data), coloridas pelo
 * progresso face à meta, que aparece como linha tracejada. Passar o rato por uma barra
 * mostra a data, o valor e as notas.
 */
export function IndicatorBarChart({
  points,
  valueType,
  target,
}: {
  points: Point[];
  valueType: string | undefined;
  target: IndicatorTarget | null;
}) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState<number | null>(null);

  const values = points.map((p) => Number(p.value));
  const lo = Math.min(0, ...values, ...(target ? [target.value] : []));
  const hi = Math.max(0, ...values, ...(target ? [target.value] : []));
  const span = hi - lo || 1;
  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const y = (v: number) => PAD.top + ((hi - v) / span) * innerH;
  const zero = y(0);

  const slot = innerW / points.length;
  const barW = Math.min(34, slot * 0.62);
  const labelAll = points.length <= 6;
  const activePoint = hover !== null ? points[hover] : null;

  return (
    <div ref={ref}>
      <svg
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role="img"
        aria-label={`Medições: ${points.map((p) => `${shortDate(p.measurementDate)} ${formatValue(Number(p.value), valueType)}`).join(", ")}${target ? `; meta ${formatTarget(target, valueType)}` : ""}`}
        onMouseLeave={() => setHover(null)}
      >
        <line x1={PAD.left} x2={width - PAD.right} y1={zero} y2={zero} className="stroke-border" strokeWidth={1} />

        {points.map((p, i) => {
          const v = Number(p.value);
          const cx = PAD.left + slot * i + slot / 2;
          const top = Math.min(y(v), zero);
          const h = Math.max(Math.abs(y(v) - zero), 1.5);
          const tone = target ? progressStatus(v, target) : "none";
          const isHover = i === hover;
          return (
            <g key={`${p.measurementDate}-${i}`} onMouseEnter={() => setHover(i)}>
              <title>{`${longDate(p.measurementDate)}: ${formatValue(v, valueType)}`}</title>
              <rect
                x={cx - barW / 2}
                y={top}
                width={barW}
                height={h}
                rx={3}
                className={hover === null || isHover ? BAR_CLASS[tone].on : BAR_CLASS[tone].off}
              />
              {(labelAll || i === points.length - 1) && (
                <text
                  x={cx}
                  y={v >= 0 ? top - 4 : top + h + 11}
                  textAnchor="middle"
                  className="fill-foreground"
                  fontSize={10}
                  fontWeight={600}
                  // o contorno com a cor do cartão afasta o valor da linha da meta
                  style={{ stroke: "var(--card)", strokeWidth: 3, paintOrder: "stroke" }}
                >
                  {formatValue(v, valueType)}
                </text>
              )}
              <text x={cx} y={HEIGHT - 6} textAnchor="middle" className="fill-muted-foreground" fontSize={9}>
                {shortDate(p.measurementDate)}
              </text>
              <rect x={cx - slot / 2} y={PAD.top} width={slot} height={innerH + PAD.bottom} fill="transparent" />
            </g>
          );
        })}

        {target && (
          <line
            x1={PAD.left}
            x2={width - PAD.right}
            y1={y(target.value)}
            y2={y(target.value)}
            className="stroke-foreground/70"
            strokeWidth={1.25}
            strokeDasharray="4 3"
            pointerEvents="none"
          />
        )}
      </svg>

      <p className="text-xs text-muted-foreground min-h-4 truncate">
        {activePoint ? (
          <>
            <span className="font-medium text-foreground">{longDate(activePoint.measurementDate)}</span>
            {`: ${formatValue(Number(activePoint.value), valueType)}`}
            {activePoint.notes ? ` — ${activePoint.notes}` : ""}
          </>
        ) : (
          "Passa o rato numa barra para ver o detalhe."
        )}
      </p>

      {target && (
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <svg width="16" height="6" aria-hidden="true">
              <line x1="0" x2="16" y1="3" y2="3" className="stroke-foreground/70" strokeWidth="1.25" strokeDasharray="4 3" />
            </svg>
            Meta
          </span>
          {LEGEND.map((l) => (
            <span key={l.key} className="inline-flex items-center gap-1">
              <span className={`inline-block size-2 rounded-sm ${l.swatch}`} />
              {l.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
