import type { Attachment, Task, Update } from "../types";

// Imports come from a file the user picked, so every field is re-checked and
// clamped before it reaches the store.

const MAX = {
  id: 80,
  body: 20000,
  title: 200,
  updateText: 2000,
  tag: 40,
  tags: 10,
  fileName: 200,
  fileType: 60,
  files: 20,
  mutedDays: 400,
};

export function isDayKey(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function cleanTags(a: unknown): string[] {
  if (!Array.isArray(a)) return [];
  return a
    .filter((x): x is string => typeof x === "string" && !!x)
    .map((x) => x.slice(0, MAX.tag))
    .slice(0, MAX.tags);
}

function cleanFiles(a: unknown): Attachment[] {
  if (!Array.isArray(a)) return [];
  return a
    .filter(
      (f): f is Attachment =>
        !!f &&
        typeof f.id === "string" &&
        /^[0-9a-f]{32}$/.test(f.id) &&
        typeof f.name === "string" &&
        typeof f.type === "string",
    )
    .slice(0, MAX.files)
    .map((f) => ({
      id: f.id,
      name: f.name.slice(0, MAX.fileName),
      type: f.type.slice(0, MAX.fileType),
      size: typeof f.size === "number" ? f.size : 0,
    }));
}

function cleanUpdates(a: unknown): Update[] {
  if (!Array.isArray(a)) return [];
  return a
    .filter((u) => u && typeof u.id === "string" && typeof u.text === "string" && isDayKey(u.date))
    .map((u) => {
      const out: Update = {
        id: u.id.slice(0, MAX.id),
        text: u.text.slice(0, MAX.updateText),
        date: u.date,
        created: typeof u.created === "number" ? u.created : Date.now(),
      };
      const files = cleanFiles(u.files);
      if (files.length) out.files = files;
      return out;
    });
}

/** A task from an import file, or null when it cannot be trusted. */
export function cleanTask(raw: unknown): Task | null {
  const n = raw as Partial<Task> | null;
  if (!n || typeof n.id !== "string" || !n.id || typeof n.body !== "string") return null;
  const out: Task = {
    id: n.id.slice(0, MAX.id),
    body: n.body.slice(0, MAX.body),
    projects: cleanTags(n.projects),
    people: cleanTags(n.people),
    created: typeof n.created === "number" ? n.created : Date.now(),
    updates: cleanUpdates(n.updates),
  };
  if (isDayKey(n.date)) out.date = n.date;
  if (isDayKey(n.deadline)) out.deadline = n.deadline;
  if (Array.isArray(n.mutedDays)) out.mutedDays = n.mutedDays.filter(isDayKey).slice(0, MAX.mutedDays);
  if (typeof n.title === "string" && n.title) out.title = n.title.slice(0, MAX.title);
  if (n.done === true) {
    out.done = true;
    if (isDayKey(n.doneDate)) out.doneDate = n.doneDate;
  }
  return out;
}
