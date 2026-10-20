import type { DayKey, Filters, Selection, Task, Update } from "../types";
import { dayN, key } from "./dates";

/** The day a task starts: its explicit date, else the day it was created. */
export function startOf(t: Task): DayKey {
  return t.date || key(new Date(t.created || Date.now()));
}

/** The day a task was completed, or null while it is still open. */
export function doneOn(t: Task): DayKey | null {
  return t.done ? t.doneDate || startOf(t) : null;
}

/**
 * Whether a task shows on day `k`: from its start day until the day it was
 * completed, or until today for open tasks. A task dated in the future still
 * shows on its own start day.
 */
export function isActiveOn(t: Task, k: DayKey, todayK: DayKey): boolean {
  const s = startOf(t);
  if (k < s) return false;
  const d = doneOn(t);
  if (d) return k <= d;
  return k <= todayK || k === s;
}

/** How many days a task has been running, as shown on its badge. */
export function dayCount(t: Task, upTo: DayKey): number {
  return Math.max(1, dayN(startOf(t), upTo) + 1);
}

/** Updates on or before `sel`, oldest first. All of them in "all" view. */
export function visibleUpdates(t: Task, sel: Selection): Update[] {
  return (t.updates || [])
    .filter((u) => sel === "all" || u.date <= sel)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.created || 0) - (b.created || 0)));
}

export function newestFirst(a: Task, b: Task): number {
  return (b.created || 0) - (a.created || 0);
}

export function hasFilters(f: Filters): boolean {
  return !!(f.query || f.projects.length || f.people.length || f.status !== "any");
}

/** How many filter chips are on, for the count beside the Filter button. */
export function filterCount(f: Filters): number {
  return f.projects.length + f.people.length + (f.status !== "any" ? 1 : 0);
}

/** Search terms, lowercased; every term must appear somewhere in the task. */
export function queryTerms(query: string): string[] {
  return query.split(/\s+/).filter(Boolean);
}

export function matchesFilters(t: Task, f: Filters): boolean {
  if (f.status === "open" && t.done) return false;
  if (f.status === "done" && !t.done) return false;
  if (f.projects.length && !(t.projects || []).some((x) => f.projects.includes(x))) return false;
  if (f.people.length && !(t.people || []).some((x) => f.people.includes(x))) return false;
  if (f.query) {
    const haystack = [
      t.body || "",
      t.title || "",
      (t.projects || []).join(" "),
      (t.people || []).join(" "),
      (t.updates || [])
        .map((u) => u.text + " " + (u.files || []).map((x) => x.name).join(" "))
        .join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return queryTerms(f.query.toLowerCase()).every((w) => haystack.includes(w));
  }
  return true;
}

/** The tasks to show for a selection and filter set, newest first. */
export function visibleTasks(tasks: Task[], sel: Selection, f: Filters, todayK: DayKey): Task[] {
  const filtering = hasFilters(f);
  return tasks
    .filter((t) => (sel === "all" || isActiveOn(t, sel, todayK)) && (!filtering || matchesFilters(t, f)))
    .sort(newestFirst);
}

/** The day a new update lands on, given the current selection. */
export function updateDayFor(t: Task, sel: Selection, todayK: DayKey): DayKey {
  if (sel !== "all") return sel;
  const d = doneOn(t);
  if (d && todayK > d) return d;
  const s = startOf(t);
  return todayK < s ? s : todayK;
}

/** The day Complete marks, given the current selection. */
export function completeDayFor(t: Task, sel: Selection, todayK: DayKey): DayKey {
  if (sel !== "all") return sel;
  const s = startOf(t);
  return s > todayK ? s : todayK;
}

/** Totals for the Manage dialog. */
export function taskStats(tasks: Task[]) {
  return {
    tasks: tasks.length,
    completed: tasks.filter((t) => t.done).length,
    updates: tasks.reduce((a, t) => a + (t.updates || []).length, 0),
    deadlines: tasks.filter((t) => t.deadline).length,
  };
}
