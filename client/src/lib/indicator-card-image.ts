import {
  FREQUENCY_LABELS,
  STATUS_LABELS,
  formatTarget,
  formatValue,
  missingNoteText,
  shortDate,
  progressStatus,
  type IndicatorResult,
  type IndicatorStatus,
} from "@/lib/indicator-results";
import type { IndicatorWithProcesses } from "@/types";

/**
 * Desenha o cartão de um indicador (nome, último valor, meta, estado e barras das medições)
 * num canvas, para entrar como imagem no PowerPoint. Espelha o cartão do ecrã, mas com cores
 * e tamanhos fixos (o ecrã usa classes do Tailwind e variáveis de tema que um canvas não vê).
 */

export const CARD_WIDTH = 560;
export const CARD_HEIGHT = 217;
const SCALE = 3;

const FONT = '"Aptos", "Helvetica Neue", Arial, system-ui, sans-serif';
const PAD = 14;
const RIGHT_BLOCK = 132;

const INK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const PRIMARY = "#00a0dd";

const BAR = { met: "#10b981", near: "#f59e0b", far: "#ef4444", none: PRIMARY } as const;

const STATUS_STYLE: Record<IndicatorStatus, { symbol: string; color: string }> = {
  met: { symbol: "✓", color: "#047857" },
  near: { symbol: "↗", color: "#b45309" },
  far: { symbol: "↘", color: "#b91c1c" },
  "no-target": { symbol: "–", color: MUTED },
  "no-data": { symbol: "!", color: "#b45309" },
  "not-due": { symbol: "·", color: MUTED },
};
const WARN = "#b45309";

function font(ctx: CanvasRenderingContext2D, size: number, weight: 400 | 600 | 700 = 400) {
  ctx.font = `${weight} ${size}px ${FONT}`;
}

/** Parte o texto em linhas que cabem em `maxWidth`; a última leva reticências se não couber tudo. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (let i = 0; i < words.length; i++) {
    const attempt = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(attempt).width <= maxWidth || !line) {
      line = attempt;
      continue;
    }
    if (lines.length === maxLines - 1) {
      // última linha permitida: junta o resto e corta com reticências
      let rest = [line, ...words.slice(i)].join(" ");
      while (rest.length > 1 && ctx.measureText(`${rest}…`).width > maxWidth) rest = rest.slice(0, -1);
      return [...lines, `${rest}…`];
    }
    lines.push(line);
    line = words[i];
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawChart(
  ctx: CanvasRenderingContext2D,
  indicator: IndicatorWithProcesses,
  result: IndicatorResult,
  box: { x: number; y: number; w: number; h: number },
) {
  const { measurements, target } = result;
  const padTop = 16;
  const padBottom = 18;
  const values = measurements.map((m) => Number(m.value));
  const lo = Math.min(0, ...values, ...(target ? [target.value] : []));
  const hi = Math.max(0, ...values, ...(target ? [target.value] : []));
  const span = hi - lo || 1;
  const innerH = box.h - padTop - padBottom;
  const y = (v: number) => box.y + padTop + ((hi - v) / span) * innerH;
  const zero = y(0);
  const slot = box.w / measurements.length;
  const barW = Math.min(34, slot * 0.62);
  const labelAll = measurements.length <= 6;

  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(box.x, zero);
  ctx.lineTo(box.x + box.w, zero);
  ctx.stroke();

  measurements.forEach((m, i) => {
    const v = Number(m.value);
    const cx = box.x + slot * i + slot / 2;
    const top = Math.min(y(v), zero);
    const h = Math.max(Math.abs(y(v) - zero), 1.5);
    const tone = target ? progressStatus(v, target) : "none";
    ctx.fillStyle = BAR[tone];
    roundRect(ctx, cx - barW / 2, top, barW, h, Math.min(3, h / 2));
    ctx.fill();

    if (labelAll || i === measurements.length - 1) {
      font(ctx, 11, 700);
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      // valores negativos: o número fica acima do eixo, para não bater na data por baixo da barra
      const ty = v >= 0 ? top - 4 : zero - 4;
      const label = formatValue(v, indicator.valueType);
      // o contorno branco afasta o valor da linha da meta
      ctx.lineJoin = "round";
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = "#ffffff";
      ctx.strokeText(label, cx, ty);
      ctx.fillStyle = INK;
      ctx.fillText(label, cx, ty);
    }
    font(ctx, 10);
    ctx.fillStyle = MUTED;
    ctx.textAlign = "center";
    ctx.fillText(shortDate(m.measurementDate), cx, box.y + box.h - 4);
  });

  if (target) {
    ctx.strokeStyle = "rgba(15, 23, 42, 0.7)";
    ctx.lineWidth = 1.25;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(box.x, y(target.value));
    ctx.lineTo(box.x + box.w, y(target.value));
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

/** PNG (3x) do cartão do indicador. */
export async function renderIndicatorCard(indicator: IndicatorWithProcesses, result: IndicatorResult): Promise<Uint8Array> {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH * SCALE;
  canvas.height = CARD_HEIGHT * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("O navegador não permite desenhar os gráficos.");
  ctx.scale(SCALE, SCALE);

  const { status, target, measurements, missing, last } = result;

  // fundo e contorno
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 0.5, 0.5, CARD_WIDTH - 1, CARD_HEIGHT - 1, 12);
  ctx.fill();
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.stroke();

  // nome (até 2 linhas) e frequência
  const textWidth = CARD_WIDTH - PAD * 2 - RIGHT_BLOCK - 12;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  font(ctx, 14, 700);
  ctx.fillStyle = INK;
  const nameLines = wrap(ctx, indicator.name, textWidth, 2);
  nameLines.forEach((line, i) => ctx.fillText(line, PAD, PAD + 13 + i * 18));

  const metaY = PAD + 13 + nameLines.length * 18 + 4;
  font(ctx, 11);
  ctx.fillStyle = MUTED;
  const frequency = FREQUENCY_LABELS[indicator.frequency] ?? indicator.frequency ?? "";
  ctx.fillText(frequency, PAD, metaY);
  if (missing > 0 && measurements.length > 0) {
    const x = PAD + ctx.measureText(frequency).width + 10;
    font(ctx, 11, 600);
    ctx.fillStyle = WARN;
    ctx.fillText(`! ${missing === 1 ? "falta 1 medição" : `faltam ${missing} medições`}`, x, metaY);
  }

  // bloco da direita: último valor, meta, estado
  const right = CARD_WIDTH - PAD;
  ctx.textAlign = "right";
  let ry = PAD + 22;
  if (last) {
    font(ctx, 26, 700);
    ctx.fillStyle = INK;
    ctx.fillText(formatValue(Number(last.value), indicator.valueType), right, ry);
    ry += 18;
    if (target) {
      font(ctx, 11);
      ctx.fillStyle = MUTED;
      ctx.fillText(`meta ${formatTarget(target, indicator.valueType)}`, right, ry);
      ry += 16;
    } else {
      ry += 2;
    }
  }
  const style = STATUS_STYLE[status];
  font(ctx, 11, 700);
  ctx.fillStyle = style.color;
  ctx.fillText(`${style.symbol} ${STATUS_LABELS[status]}`, right, ry);

  // gráfico, ou a razão de não haver
  const chartTop = 84;
  const box = { x: PAD, y: chartTop, w: CARD_WIDTH - PAD * 2, h: CARD_HEIGHT - chartTop - 8 };
  if (measurements.length > 0) {
    drawChart(ctx, indicator, result, box);
  } else {
    ctx.textAlign = "left";
    font(ctx, 12);
    ctx.fillStyle = MUTED;
    wrap(ctx, missingNoteText(result, indicator.frequency), box.w, 3).forEach((line, i) =>
      ctx.fillText(line, PAD, chartTop + 18 + i * 17),
    );
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Não foi possível gerar a imagem de um gráfico.");
  return new Uint8Array(await blob.arrayBuffer());
}
