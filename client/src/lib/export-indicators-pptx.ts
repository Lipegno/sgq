import JSZip from "jszip";

import type { IndicatorWithProcesses } from "@/types";
import { STATUS_LABELS, formatValue, type IndicatorResult } from "@/lib/indicator-results";
import { CARD_HEIGHT, CARD_WIDTH, renderIndicatorCard } from "@/lib/indicator-card-image";

/**
 * Exporta os gráficos dos indicadores para PowerPoint, no modelo da UMa
 * (public/templates/modelo-uma.pptx: capa, layout de conteúdo e slide final).
 * Um slide por processo e por página: cada processo começa num slide novo, com 4 indicadores
 * por slide (2x2), e continua noutro slide se tiver mais.
 */

const TEMPLATE_URL = `${import.meta.env.BASE_URL}templates/modelo-uma.pptx`;
const SERVICE = "REITORIA UNIVERSIDADE DA MADEIRA";
const PER_SLIDE = 4;

// medidas em EMU (o slide tem 12192000 x 6858000)
const MARGIN_X = 457200;
const CARD_W = 5450000;
const CARD_H = Math.round((CARD_W * CARD_HEIGHT) / CARD_WIDTH);
const GAP_X = 380000;
const GAP_Y = 140000;
const GRID_TOP = 1650000;

const NS =
  'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

export interface ExportEntry {
  indicator: IndicatorWithProcesses;
  result: IndicatorResult;
}

export interface ExportGroup {
  name: string;
  macro: string | null;
  /** linha por baixo do título (balanço do processo) */
  summary: string;
  entries: ExportEntry[];
}

const escapeXml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const upper = (text: string) => text.toLocaleUpperCase("pt-PT");

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function pictureXml(id: number, rId: string, index: number, entry: ExportEntry): string {
  const { indicator, result } = entry;
  const last = result.last ? `, último valor ${formatValue(Number(result.last.value), indicator.valueType)}` : "";
  const description = `${indicator.name}: ${STATUS_LABELS[result.status]}${last}`;
  const x = MARGIN_X + (index % 2) * (CARD_W + GAP_X);
  const y = GRID_TOP + Math.floor(index / 2) * (CARD_H + GAP_Y);
  return `<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="Indicador ${index + 1}" descr="${escapeXml(description)}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${CARD_W}" cy="${CARD_H}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
}

function slideXml(title: string, summary: string, pictures: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld ${NS}><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>`
    + `<p:sp><p:nvSpPr><p:cNvPr id="2" name="Title 1"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="${MARGIN_X}" y="420000"/><a:ext cx="9500000" cy="800000"/></a:xfrm></p:spPr><p:txBody><a:bodyPr><a:normAutofit/></a:bodyPr><a:lstStyle/><a:p><a:r><a:rPr lang="pt-PT" sz="2600" b="1" dirty="0"><a:latin typeface="+mn-lt"/></a:rPr><a:t>${escapeXml(title)}</a:t></a:r></a:p></p:txBody></p:sp>`
    + `<p:sp><p:nvSpPr><p:cNvPr id="3" name="Resumo"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${MARGIN_X}" y="1230000"/><a:ext cx="11277600" cy="330000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr wrap="square" rtlCol="0"><a:noAutofit/></a:bodyPr><a:lstStyle/><a:p><a:r><a:rPr lang="pt-PT" sz="1200" dirty="0"><a:solidFill><a:srgbClr val="64748B"/></a:solidFill><a:latin typeface="+mn-lt"/></a:rPr><a:t>${escapeXml(summary)}</a:t></a:r></a:p></p:txBody></p:sp>`
    + pictures
    + `<p:sp><p:nvSpPr><p:cNvPr id="4" name="Text Placeholder 3"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" sz="quarter" idx="14"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="pt-PT" dirty="0"/><a:t>${SERVICE}</a:t></a:r></a:p></p:txBody></p:sp>`
    + `<p:sp><p:nvSpPr><p:cNvPr id="5" name="Slide Number Placeholder 4"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldNum" sz="quarter" idx="12"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:fld id="{CE8465BE-1386-EA44-8495-9571C150BFED}" type="slidenum"><a:rPr lang="pt-PT"/><a:t>‹#›</a:t></a:fld><a:endParaRPr lang="pt-PT"/></a:p></p:txBody></p:sp>`
    + `</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
}

function slideRels(imageNames: string[]): string {
  const images = imageNames
    .map((name, i) => `<Relationship Id="rId${i + 2}" Type="${REL}/image" Target="../media/${name}"/>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/slideLayout" Target="../slideLayouts/slideLayout2.xml"/>${images}</Relationships>`;
}

async function readText(zip: JSZip, path: string): Promise<string> {
  const file = zip.file(path);
  if (!file) throw new Error(`O modelo da UMa está incompleto (falta ${path}).`);
  return file.async("string");
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const slug = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export interface ExportOptions {
  year: number | undefined;
  groups: ExportGroup[];
  /** acrescentado à linha de balanço, p. ex. «só os que requerem atenção» */
  filterNote?: string;
  /** só para os testes */
  now?: Date;
  /** devolve o ficheiro em vez de o descarregar (para os testes) */
  returnBlob?: boolean;
}

export async function exportIndicatorsPptx({ year, groups, filterNote, now = new Date(), returnBlob = false }: ExportOptions): Promise<Blob | void> {
  const populated = groups.filter((g) => g.entries.length > 0);
  if (populated.length === 0) throw new Error("Não há indicadores para exportar.");

  const response = await fetch(TEMPLATE_URL);
  if (!response.ok) throw new Error("Não foi possível carregar o modelo da UMa.");
  const zip = await JSZip.loadAsync(await response.arrayBuffer());

  // capa e slide final
  const month = new Intl.DateTimeFormat("pt-PT", { month: "long" }).format(now);
  const cover = (await readText(zip, "ppt/slides/slide1.xml"))
    .replace("{{TITLE}}", escapeXml(upper(`Resultados dos indicadores${year ? ` ${year}` : ""}`)))
    .replace("{{SUBTITLE}}", "REVISÃO PELA GESTÃO")
    .replace("{{SERVICE}}", SERVICE)
    .replace("{{DATE}}", escapeXml(upper(`${month} ${now.getFullYear()}`)));
  zip.file("ppt/slides/slide1.xml", cover);
  zip.file("ppt/slides/slide2.xml", (await readText(zip, "ppt/slides/slide2.xml")).replace("{{CLOSING}}", "Obrigado"));

  // slides de conteúdo: um por página de cada processo
  const slideIds: string[] = [];
  const presentationRels: string[] = [];
  const contentTypes: string[] = [];
  let slideNumber = 2; // a capa e o slide final já são o 1 e o 2 do modelo
  for (const group of populated) {
    const pages = chunk(group.entries, PER_SLIDE);
    for (const [pageIndex, page] of pages.entries()) {
      slideNumber += 1;
      const imageNames: string[] = [];
      let pictures = "";
      for (const [i, entry] of page.entries()) {
        const name = `indicador-${slideNumber}-${i + 1}.png`;
        zip.file(`ppt/media/${name}`, await renderIndicatorCard(entry.indicator, entry.result));
        imageNames.push(name);
        pictures += pictureXml(10 + i, `rId${i + 2}`, i, entry);
      }
      const title = upper(pages.length > 1 ? `${group.name} (${pageIndex + 1}/${pages.length})` : group.name);
      const summary = [group.macro, group.summary, filterNote].filter(Boolean).join(" · ");
      zip.file(`ppt/slides/slide${slideNumber}.xml`, slideXml(title, summary, pictures));
      zip.file(`ppt/slides/_rels/slide${slideNumber}.xml.rels`, slideRels(imageNames));

      const rId = `rId${100 + slideNumber}`;
      presentationRels.push(`<Relationship Id="${rId}" Type="${REL}/slide" Target="slides/slide${slideNumber}.xml"/>`);
      slideIds.push(`<p:sldId id="${300 + slideNumber}" r:id="${rId}"/>`);
      contentTypes.push(
        `<Override PartName="/ppt/slides/slide${slideNumber}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`,
      );
    }
  }

  // os slides novos ficam entre a capa e o slide final
  const presentation = await readText(zip, "ppt/presentation.xml");
  zip.file(
    "ppt/presentation.xml",
    presentation.replace(/<p:sldId id="258" r:id="rId11"\/>/, `${slideIds.join("")}<p:sldId id="258" r:id="rId11"/>`),
  );
  const rels = await readText(zip, "ppt/_rels/presentation.xml.rels");
  zip.file("ppt/_rels/presentation.xml.rels", rels.replace("</Relationships>", `${presentationRels.join("")}</Relationships>`));
  const types = await readText(zip, "[Content_Types].xml");
  zip.file("[Content_Types].xml", types.replace("</Types>", `${contentTypes.join("")}</Types>`));

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    compression: "DEFLATE",
  });
  if (returnBlob) return blob;
  const only = populated.length === 1 ? `-${slug(populated[0].name)}` : "";
  download(blob, `resultados-indicadores${year ? `-${year}` : ""}${only}.pptx`);
}
