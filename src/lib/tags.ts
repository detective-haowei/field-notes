import type { Task, TagKind } from "../types";

export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 40;

/** Strips a leading # or @ and trims a tag to its stored form. */
export function normalizeTag(raw: string): string {
  return raw.trim().replace(/^[#@]+/, "").slice(0, MAX_TAG_LENGTH);
}

/** Splits a comma-separated string into unique tags. */
export function parseTags(s: string): string[] {
  const out: string[] = [];
  for (const part of (s || "").split(",")) {
    const t = normalizeTag(part);
    if (t && !out.includes(t)) out.push(t);
  }
  return out.slice(0, MAX_TAGS);
}

/** Every tag of one kind used by any task. */
export function allTags(tasks: Task[], kind: TagKind): string[] {
  const seen = new Set<string>();
  for (const t of tasks) for (const tag of t[kind] || []) seen.add(tag);
  return [...seen];
}

export function sortedTags(tasks: Task[], kind: TagKind): string[] {
  return allTags(tasks, kind).sort((a, b) => a.localeCompare(b));
}

/** Tags of one kind with how many tasks use each, most used first. */
export function tagCounts(tasks: Task[], kind: TagKind): { name: string; n: number }[] {
  const counts: Record<string, number> = {};
  for (const t of tasks) for (const tag of t[kind] || []) counts[tag] = (counts[tag] || 0) + 1;
  return Object.keys(counts)
    .sort((a, b) => counts[b] - counts[a] || a.localeCompare(b))
    .map((name) => ({ name, n: counts[name] }));
}

/** Renames a tag on one task, or drops it when `next` is "". De-duplicates. */
export function renameTagOn(task: Task, kind: TagKind, from: string, next: string): string[] {
  const out: string[] = [];
  for (const t of task[kind] || []) {
    const v = t === from ? next : t;
    if (v && !out.includes(v)) out.push(v);
  }
  return out;
}

export const TAG_SYMBOL: Record<TagKind, string> = { projects: "#", people: "@" };
