import type { DayKey, Task } from "../types";
import { MONTH_NAMES, key, parse } from "./dates";
import { dayCount, doneOn, newestFirst, startOf } from "./tasks";

export type PeriodKind = "month" | "quarter" | "year";

export interface Period {
  kind: PeriodKind;
  /** First and last day, inclusive. */
  start: DayKey;
  end: DayKey;
  /** The period's own name, e.g. "November 2026" or "Q4 2026". */
  name: string;
  /** A short name for comparisons, e.g. "October" or "Q3". */
  short: string;
}

export interface PeriodStats {
  completed: number;
  started: number;
  updates: number;
  /** Mean days from start to completion, or null with nothing completed. */
  avgDays: number | null;
}

/** The calendar month, quarter or year that contains `day`, shifted by `offset` periods. */
export function periodAt(kind: PeriodKind, day: DayKey, offset = 0): Period {
  const d = parse(day);
  const y = d.getFullYear();
  if (kind === "month") {
    const first = new Date(y, d.getMonth() + offset, 1);
    const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
    const m = MONTH_NAMES[first.getMonth()];
    return { kind, start: key(first), end: key(last), name: m + " " + first.getFullYear(), short: m };
  }
  if (kind === "quarter") {
    const first = new Date(y, Math.floor(d.getMonth() / 3) * 3 + offset * 3, 1);
    const last = new Date(first.getFullYear(), first.getMonth() + 3, 0);
    const q = Math.floor(first.getMonth() / 3) + 1;
    return {
      kind,
      start: key(first),
      end: key(last),
      name: "Q" + q + " " + first.getFullYear(),
      short: "Q" + q,
    };
  }
  const year = y + offset;
  return {
    kind,
    start: key(new Date(year, 0, 1)),
    end: key(new Date(year, 11, 31)),
    name: String(year),
    short: String(year),
  };
}

export function periodStats(tasks: Task[], p: Pick<Period, "start" | "end">): PeriodStats {
  const within = (k: DayKey) => k >= p.start && k <= p.end;
  let completed = 0;
  let started = 0;
  let updates = 0;
  let days = 0;
  for (const t of tasks) {
    if (within(startOf(t))) started++;
    updates += (t.updates || []).filter((u) => within(u.date)).length;
    const done = doneOn(t);
    if (done && within(done)) {
      completed++;
      days += dayCount(t, done);
    }
  }
  return { completed, started, updates, avgDays: completed ? days / completed : null };
}

/** Every completed task, most recently completed first. */
export function completedTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => t.done)
    .sort((a, b) => {
      const da = doneOn(a) || "";
      const db = doneOn(b) || "";
      return da === db ? newestFirst(a, b) : da < db ? 1 : -1;
    });
}

/** "+2 vs October", "Same as October" or "−3 vs October". */
export function deltaLabel(now: number, before: number, versus: string): string {
  const d = now - before;
  if (d === 0) return "Same as " + versus;
  return (d > 0 ? "+" : "−") + Math.abs(d) + " vs " + versus;
}
