import type { jsPDF } from "jspdf";
import type { DayKey, Task, Update } from "../types";
import { DOT_RADII } from "../components/Logo";
import { MONTH_NAMES, label, parse } from "../lib/dates";
import { pdfSafe } from "../lib/text";
import { weekSummary, type WeekEntry } from "../lib/week";
import { saveFile, type SaveOutcome } from "./download";
import regularUrl from "../assets/fonts/Manrope-400.ttf?url";
import semiUrl from "../assets/fonts/Manrope-600.ttf?url";
import boldUrl from "../assets/fonts/Manrope-700.ttf?url";

// The page is laid out in points on A4. The look follows the app: white page,
// the wordmark, grey "Task completed" bar, highlighter-green date pills.

type RGB = readonly [number, number, number];

/** The app's palette (see styles/tokens.css) flattened onto white. */
const COLOR = {
  ink: [29, 29, 27],
  mute: [111, 110, 105],
  faint: [161, 161, 158],
  line: [228, 226, 220],
  rule: [235, 233, 229],
  band: [235, 235, 234],
  pf: [228, 240, 156],
  pi: [43, 50, 8],
  pill: [240, 247, 200],
} as const satisfies Record<string, RGB>;

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 36;
const CARD_W = PAGE_W - MARGIN * 2;
const CARD_PAD = 12;
const CARD_RADIUS = 6;
const CARD_GAP = 10.5;
const HEADER_FULL = 45;
const HEADER_SMALL = 33;
const FOOTER_H = 34.5;
const BODY_TOP_GAP = 19.5;
const BOTTOM = PAGE_H - FOOTER_H - 9;
/** Update rows start to the right of the date pill. */
const UPDATE_INDENT = 72;

type Face = "body" | "semi" | "bold";

const MANROPE: Record<Face, [string, string]> = {
  body: ["Manrope", "normal"],
  semi: ["ManropeSemi", "normal"],
  bold: ["Manrope", "bold"],
};

const HELVETICA: Record<Face, [string, string]> = {
  body: ["helvetica", "normal"],
  semi: ["helvetica", "bold"],
  bold: ["helvetica", "bold"],
};

interface Chunk {
  h: number;
  draw: (top: number) => void;
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Registers Manrope with the document. False means fall back to Helvetica. */
async function loadFonts(doc: jsPDF): Promise<boolean> {
  try {
    const files: [string, string, string, string][] = [
      [regularUrl, "Manrope-400.ttf", "Manrope", "normal"],
      [boldUrl, "Manrope-700.ttf", "Manrope", "bold"],
      [semiUrl, "Manrope-600.ttf", "ManropeSemi", "normal"],
    ];
    const buffers = await Promise.all(
      files.map(async ([url]) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error("font " + res.status);
        return res.arrayBuffer();
      }),
    );
    files.forEach(([, file, family, style], i) => {
      doc.addFileToVFS(file, toBase64(buffers[i]));
      doc.addFont(file, family, style);
    });
    return true;
  } catch {
    return false;
  }
}

/** "19 – 25 October 2026", or with both months or both years when they differ. */
function rangeLabel(start: DayKey, end: DayKey, long: boolean, dash: string): string {
  const a = parse(start);
  const b = parse(end);
  const month = (d: Date) => (long ? MONTH_NAMES[d.getMonth()] : MONTH_NAMES[d.getMonth()].slice(0, 3));
  if (a.getFullYear() !== b.getFullYear()) {
    return `${a.getDate()} ${month(a)} ${a.getFullYear()} ${dash} ${b.getDate()} ${month(b)} ${b.getFullYear()}`;
  }
  if (a.getMonth() !== b.getMonth()) {
    return `${a.getDate()} ${month(a)} ${dash} ${b.getDate()} ${month(b)} ${b.getFullYear()}`;
  }
  return `${a.getDate()} ${dash} ${b.getDate()} ${month(b)} ${b.getFullYear()}`;
}

/** Builds the weekly summary PDF and hands it to the browser or the host. */
export async function downloadWeekPdf(tasks: Task[], weekStart: DayKey): Promise<SaveOutcome> {
  const summary = weekSummary(tasks, weekStart);
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
  const fontsLoaded = await loadFonts(doc);
  const faces = fontsLoaded ? MANROPE : HELVETICA;
  const dash = fontsLoaded ? "–" : "-";

  const face = (f: Face, size: number, color: RGB) => {
    doc.setFont(faces[f][0], faces[f][1]);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
  };
  const fill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c: RGB, width = 0.75) => {
    doc.setDrawColor(c[0], c[1], c[2]);
    doc.setLineWidth(width);
  };

  /** Wraps text to a width at the current font, keeping the author's line breaks. */
  const wrap = (text: string, width: number): string[] =>
    text
      .trim()
      .split("\n")
      .flatMap((line) => {
        const safe = pdfSafe(line);
        return safe ? (doc.splitTextToSize(safe, width) as string[]) : [""];
      });

  let y = HEADER_FULL + BODY_TOP_GAP;
  const newPage = () => {
    doc.addPage();
    y = HEADER_SMALL + BODY_TOP_GAP;
  };

  // ---- a task card, built as chunks so it can break between update rows ----

  const innerX = MARGIN + CARD_PAD;
  const innerW = CARD_W - CARD_PAD * 2;

  const headChunk = (task: Task, doneDate?: DayKey): Chunk => {
    const lines = (task.body || "").trim().split("\n");
    const heading = pdfSafe(task.title || lines[0] || "") || "(untitled)";
    const rest = (task.title ? lines : lines.slice(1)).join("\n");
    face("semi", 11.25, COLOR.ink);
    const headLines = wrap(heading, innerW);
    face("body", 9.75, COLOR.mute);
    const restLines = rest.trim() ? wrap(rest, innerW) : [];
    const bannerH = doneDate ? 23 : 0;
    const topGap = doneDate ? 7.5 : 10.5;
    const h =
      bannerH + topGap + headLines.length * 14.5 + (restLines.length ? 1.5 + restLines.length * 14.2 : 0);
    return {
      h,
      draw: (top) => {
        if (doneDate) {
          fill(COLOR.band);
          doc.roundedRect(MARGIN, top, CARD_W, bannerH + CARD_RADIUS, CARD_RADIUS, CARD_RADIUS, "F");
          fill([255, 255, 255]);
          doc.rect(MARGIN, top + bannerH, CARD_W, CARD_RADIUS + 1, "F");
          stroke(COLOR.line);
          doc.line(MARGIN, top + bannerH, MARGIN + CARD_W, top + bannerH);
          face("semi", 8.25, COLOR.mute);
          doc.text("Task completed · " + label(doneDate), innerX, top + 15);
        }
        let ty = top + bannerH + topGap;
        face("semi", 11.25, COLOR.ink);
        headLines.forEach((l, i) => doc.text(l, innerX, ty + 11 + i * 14.5));
        ty += headLines.length * 14.5 + (restLines.length ? 1.5 : 0);
        face("body", 9.75, COLOR.mute);
        restLines.forEach((l, i) => doc.text(l, innerX, ty + 10 + i * 14.2));
      },
    };
  };

  const labelChunk = (count: number): Chunk => ({
    h: 29,
    draw: (top) => {
      stroke(COLOR.line, 0.6);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(innerX, top + 7.5, innerX + innerW, top + 7.5);
      doc.setLineDashPattern([], 0);
      face("bold", 7.2, COLOR.mute);
      doc.setCharSpace(0.55);
      doc.text("UPDATES THIS WEEK", innerX, top + 7.5 + 7.5 + 7.5);
      const w = doc.getTextWidth("UPDATES THIS WEEK") + 0.55 * 17;
      doc.setCharSpace(0);
      face("body", 7.2, COLOR.faint);
      doc.text(String(count), innerX + w + 5, top + 22.5);
    },
  });

  const rowChunk = (u: Update, first: boolean): Chunk => {
    const textW = innerW - UPDATE_INDENT;
    face("body", 9.4, COLOR.ink);
    const lines = u.text.trim() ? wrap(u.text, textW) : [];
    const textH = Math.max(lines.length, 1) * 14;

    // Files are listed by name, wrapped into rows of chips.
    face("body", 8.25, COLOR.mute);
    const chips = (u.files || []).map((f) => {
      let name = pdfSafe(f.name) || "file";
      while (name.length > 4 && doc.getTextWidth(name) > 170) name = name.slice(0, -4) + "...";
      return { name, w: doc.getTextWidth(name) + 25 };
    });
    const placed: { name: string; w: number; x: number; row: number }[] = [];
    let cx = 0;
    let row = 0;
    for (const c of chips) {
      if (cx > 0 && cx + c.w > textW) {
        cx = 0;
        row++;
      }
      placed.push({ ...c, x: cx, row });
      cx += c.w + 6;
    }
    const chipRows = placed.length ? row + 1 : 0;
    const filesH = chipRows ? 4.5 + chipRows * 15 + (chipRows - 1) * 4.5 : 0;
    const sep = first ? 0 : 6;

    return {
      h: sep + textH + filesH + 6,
      draw: (top) => {
        if (!first) {
          stroke(COLOR.rule, 0.6);
          doc.line(innerX, top, innerX + innerW, top);
        }
        const base = top + sep;
        face("semi", 8.25, COLOR.pi);
        const pillLabel = label(u.date);
        const pillW = doc.getTextWidth(pillLabel) + 9;
        fill(COLOR.pill);
        doc.roundedRect(innerX, base + 0.5, pillW, 12, 3, 3, "F");
        doc.text(pillLabel, innerX + 4.5, base + 9.2);

        face("body", 9.4, COLOR.ink);
        lines.forEach((l, i) => doc.text(l, innerX + UPDATE_INDENT, base + 9.8 + i * 14));

        placed.forEach((c) => {
          const x = innerX + UPDATE_INDENT + c.x;
          const cy = base + textH + 4.5 + c.row * 19.5;
          stroke(COLOR.line);
          doc.roundedRect(x, cy, c.w, 15, 4.5, 4.5, "S");
          stroke(COLOR.mute, 0.6);
          doc.roundedRect(x + 8, cy + 4, 3.4, 7, 1.7, 1.7, "S");
          doc.line(x + 9.7, cy + 6.2, x + 9.7, cy + 9);
          face("body", 8.25, COLOR.mute);
          doc.text(c.name, x + 17, cy + 10.3);
        });
      },
    };
  };

  const cardChunks = (entry: WeekEntry): Chunk[] => {
    const head = headChunk(entry.task, entry.doneDate);
    if (!entry.updates.length) return [head];
    const rows = entry.updates.map((u, i) => rowChunk(u, i === 0));
    const first: Chunk = {
      h: head.h + 29 + rows[0].h,
      draw: (top) => {
        head.draw(top);
        labelChunk(entry.updates.length).draw(top + head.h);
        rows[0].draw(top + head.h + 29);
      },
    };
    return [first, ...rows.slice(1)];
  };

  /** Draws a card, moving it to the next page when it does not fit. */
  const placeCard = (chunks: Chunk[]) => {
    const bottomPad = 7.5;
    const pageRoom = BOTTOM - (HEADER_SMALL + BODY_TOP_GAP);
    const total = chunks.reduce((a, c) => a + c.h, 0) + bottomPad;
    if (y + chunks[0].h + bottomPad > BOTTOM || (total <= pageRoom && y + total > BOTTOM)) newPage();

    let top = y;
    const close = () => {
      y += bottomPad;
      stroke(COLOR.line);
      doc.roundedRect(MARGIN, top, CARD_W, y - top, CARD_RADIUS, CARD_RADIUS, "S");
      y += CARD_GAP;
    };
    chunks.forEach((c, i) => {
      if (i > 0 && y + c.h + bottomPad > BOTTOM) {
        close();
        newPage();
        top = y;
        y += 10.5;
      }
      c.draw(y);
      y += c.h;
    });
    close();
  };

  const section = (title: string, entries: WeekEntry[], firstH: number) => {
    if (y + 24 + firstH > BOTTOM) newPage();
    y += 4.5;
    face("semi", 13.5, COLOR.ink);
    doc.text(title, MARGIN, y + 13);
    const w = doc.getTextWidth(title);
    face("bold", 8.25, COLOR.pi);
    const count = String(entries.length);
    const pw = doc.getTextWidth(count) + 13.5;
    fill(COLOR.pf);
    doc.roundedRect(MARGIN + w + 6, y + 3.2, pw, 12.5, 6.25, 6.25, "F");
    doc.text(count, MARGIN + w + 6 + pw / 2, y + 12.2, { align: "center" });
    y += 20 + CARD_GAP;
    for (const entry of entries) placeCard(cardChunks(entry));
  };

  // ---- page 1 title, then the sections ----

  face("bold", 21, COLOR.ink);
  doc.text(rangeLabel(summary.start, summary.end, true, dash), MARGIN, y + 16);
  y += 30;

  const sections: [string, WeekEntry[]][] = [
    ["Completed", summary.done],
    ["In progress", summary.inProgress],
  ];
  let any = false;
  for (const [title, entries] of sections) {
    if (!entries.length) continue;
    any = true;
    section(title, entries, cardChunks(entries[0])[0].h);
  }
  if (!any) {
    face("body", 10.5, COLOR.mute);
    doc.text("Nothing to report for this week.", MARGIN, y + 12);
  }

  // ---- header and footer on every page, now that the page count is known ----

  const pages = doc.getNumberOfPages();
  const shortRange = rangeLabel(summary.start, summary.end, false, dash);
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    const full = p === 1;
    const headH = full ? HEADER_FULL : HEADER_SMALL;
    const logo = full ? 21 : 16.5;
    const logoY = (headH - logo) / 2;

    fill(COLOR.ink);
    const cell = logo / 14;
    DOT_RADII.forEach((row, gy) =>
      row.forEach((r, gx) => doc.circle(MARGIN + (gx + 0.5) * cell, logoY + (gy + 0.5) * cell, r * cell, "F")),
    );
    face("semi", full ? 15 : 12, COLOR.ink);
    doc.text("Field Notes", MARGIN + logo + 7.5, logoY + logo / 2 + (full ? 5.2 : 4.2));
    face("body", 9, COLOR.mute);
    doc.text(full ? "Weekly summary" : "Weekly summary · " + shortRange, PAGE_W - MARGIN, logoY + logo / 2 + 3.3, {
      align: "right",
    });
    stroke(COLOR.line);
    doc.line(0, headH, PAGE_W, headH);

    stroke(COLOR.line);
    doc.line(0, PAGE_H - FOOTER_H, PAGE_W, PAGE_H - FOOTER_H);
    face("body", 8, COLOR.mute);
    const fy = PAGE_H - FOOTER_H / 2 + 2.8;
    doc.text("Field Notes · Weekly summary", MARGIN, fy);
    doc.text(shortRange, PAGE_W / 2, fy, { align: "center" });
    doc.text(`Page ${p} of ${pages}`, PAGE_W - MARGIN, fy, { align: "right" });
  }

  return saveFile("weekly-summary-" + weekStart + ".pdf", doc.output("arraybuffer"), "application/pdf");
}
