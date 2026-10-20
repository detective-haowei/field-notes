import type { DayKey, Task } from "../types";
import { parse, shortLabel } from "../lib/dates";
import { pdfSafe } from "../lib/text";
import { weekSummary, type WeekEntry } from "../lib/week";
import { saveFile, type SaveOutcome } from "./download";

const PAGE = { margin: 56, top: 68, bottom: 56 };

/** Builds the weekly summary PDF and hands it to the browser or the host. */
export async function downloadWeekPdf(tasks: Task[], weekStart: DayKey): Promise<SaveOutcome> {
  const summary = weekSummary(tasks, weekStart);
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const textWidth = width - PAGE.margin * 2;
  let y = PAGE.top;

  const need = (h: number) => {
    if (y + h > height - PAGE.bottom) {
      doc.addPage();
      y = PAGE.top;
    }
  };

  const line = (text: string, size: number, style: string, gray: number, after: number) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(gray);
    const lineHeight = size * 1.4;
    for (const l of doc.splitTextToSize(text, textWidth)) {
      need(lineHeight);
      doc.text(l, PAGE.margin, y);
      y += lineHeight;
    }
    y += after;
  };

  const bullet = (text: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const lineHeight = 15.5;
    const lines = doc.splitTextToSize(pdfSafe(text) || "(untitled)", textWidth - 18);
    need(lineHeight);
    doc.setFillColor(110, 110, 110);
    doc.circle(PAGE.margin + 4, y - 3.6, 1.7, "F");
    for (const l of lines) {
      need(lineHeight);
      doc.setTextColor(35);
      doc.text(l, PAGE.margin + 18, y);
      y += lineHeight;
    }
    y += 6;
  };

  const section = (title: string, entries: WeekEntry[]) => {
    need(40);
    line(title + " (" + entries.length + ")", 13, "bold", 30, 6);
    if (!entries.length) line("None", 11, "italic", 130, 6);
    for (const entry of entries) bullet(entry.task.body);
    y += 10;
  };

  line("Weekly summary", 20, "bold", 30, 2);
  line(
    shortLabel(summary.start) + " to " + shortLabel(summary.end) + " " + parse(summary.end).getFullYear(),
    12,
    "normal",
    110,
    22,
  );
  section("Completed", summary.done);
  section("In progress", summary.inProgress);

  return saveFile(
    "weekly-summary-" + weekStart + ".pdf",
    doc.output("arraybuffer"),
    "application/pdf",
  );
}
