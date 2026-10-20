import type { DayKey, Selection, Task } from "../types";
import { dayN, label } from "../lib/dates";
import { doneOn } from "../lib/tasks";
import { CalendarIcon } from "./icons";

interface Props {
  task: Task;
  deadline: DayKey;
  selection: Selection;
  todayK: DayKey;
  onEdit: () => void;
}

/**
 * The deadline chip. It is measured against today, or against the day being
 * viewed when that day is in the past, so old days read as they did then.
 */
export function DeadlineChip({ task, deadline, selection, todayK, onEdit }: Props) {
  const reference = selection === "all" ? todayK : selection < todayK ? selection : todayK;
  const finished = !!task.done && (doneOn(task) ?? "") <= reference;
  const diff = dayN(reference, deadline);

  let text = "Due " + label(deadline);
  let tone = "";
  if (!finished) {
    if (diff < 0) {
      text = "Overdue · " + label(deadline);
      tone = " od";
    } else if (diff === 0) {
      text = "Due today";
      tone = " td";
    } else if (diff === 1) {
      text = "Due tomorrow";
    }
  }

  const plural = (n: number) => (n === 1 ? "" : "s");
  const title =
    (diff < 0
      ? Math.abs(diff) + " day" + plural(Math.abs(diff)) + " overdue"
      : diff === 0
        ? "Due today"
        : "Due in " + diff + " day" + plural(diff)) + " · click to change";

  return (
    <button
      type="button"
      className={"tg dl" + tone}
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onEdit();
      }}
    >
      <CalendarIcon />
      {text}
    </button>
  );
}
