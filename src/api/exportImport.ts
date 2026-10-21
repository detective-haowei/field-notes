import type { DayMap, ExportPayload, Task } from "../types";
import { todayKey } from "../lib/dates";
import { saveFile, type SaveOutcome } from "./download";

const APP = "work-notes";

export function exportFilename(): string {
  return APP + "-" + todayKey() + ".json";
}

export function exportPayload(tasks: Task[], days: DayMap): string {
  const payload: ExportPayload = {
    app: APP,
    version: 1,
    exportedAt: new Date().toISOString(),
    notes: tasks,
    days,
  };
  return JSON.stringify(payload, null, 2);
}

export function downloadExport(tasks: Task[], days: DayMap): Promise<SaveOutcome> {
  return saveFile(exportFilename(), exportPayload(tasks, days), "application/json");
}

export type ParsedImport =
  | { ok: true; notes: unknown[]; days: unknown }
  | { ok: false; error: string };

/** Reads an export file without trusting its contents; see lib/schema. */
export function parseImport(text: string): ParsedImport {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "That isn’t a valid export file" };
  }
  const payload = data as Partial<ExportPayload> | null;
  if (!payload || !Array.isArray(payload.notes)) {
    return { ok: false, error: "That isn’t a Work Notes export" };
  }
  return { ok: true, notes: payload.notes, days: payload.days };
}

export function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn’t read that file"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(file);
  });
}
