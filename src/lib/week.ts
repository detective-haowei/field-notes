import type { DayKey, Task, Update } from "../types";
import { addDays } from "./dates";
import { doneOn, startOf } from "./tasks";

export interface WeekEntry {
  task: Task;
  updates: Update[];
  doneDate?: DayKey;
}

export interface WeekSummary {
  start: DayKey;
  end: DayKey;
  done: WeekEntry[];
  inProgress: WeekEntry[];
  /** Tasks running through the week with nothing new to report. */
  carried: number;
  updates: number;
}

/** Everything the weekly PDF needs for the week starting on Monday `start`. */
export function weekSummary(tasks: Task[], start: DayKey): WeekSummary {
  const end = addDays(start, 6);
  const done: WeekEntry[] = [];
  const inProgress: WeekEntry[] = [];
  let carried = 0;
  let updates = 0;

  for (const task of tasks) {
    const s = startOf(task);
    const dd = doneOn(task);
    const weekUpdates = (task.updates || [])
      .filter((u) => u.date >= start && u.date <= end)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.created || 0) - (b.created || 0)));
    updates += weekUpdates.length;

    if (dd && dd >= start && dd <= end) {
      done.push({ task, updates: weekUpdates, doneDate: dd });
    } else if (s <= end && (!dd || dd > end)) {
      if (s >= start || weekUpdates.length) inProgress.push({ task, updates: weekUpdates });
      else carried++;
    }
  }

  done.sort((a, b) =>
    a.doneDate! < b.doneDate! ? -1 : a.doneDate! > b.doneDate! ? 1 : (a.task.created || 0) - (b.task.created || 0),
  );
  inProgress.sort((a, b) => (a.task.created || 0) - (b.task.created || 0));

  return { start, end, done, inProgress, carried, updates };
}
