import { useEffect, useRef, useState } from "react";
import type { DayKey, Task } from "../types";
import { label } from "../lib/dates";
import { renderHighlighted } from "../lib/text";
import { completeDayFor, dayCount, doneOn, headingOf, isMutedOn, startOf } from "../lib/tasks";
import { useDismiss } from "../hooks/useDismiss";
import { useStore } from "../store/StoreContext";
import { useView } from "../store/ViewContext";
import { AddUpdate } from "./AddUpdate";
import { DatePicker } from "./DatePicker";
import { DeadlineChip } from "./DeadlineChip";
import { ChevronDownIcon } from "./icons";
import { TaskEditor } from "./TaskEditor";
import { Updates } from "./Updates";

interface Props {
  task: Task;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Whether a completed task is opened out rather than folded to its heading. */
  expanded: boolean;
  onToggleExpanded: () => void;
}

export function TaskCard({ task, collapsed, onToggleCollapsed, expanded, onToggleExpanded }: Props) {
  const { saveTask, removeTask } = useStore();
  const { effectiveSelection: selection, todayK, terms } = useView();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [changingDate, setChangingDate] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const kebabRef = useRef<HTMLButtonElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  useDismiss(menuOpen, () => setMenuOpen(false), [menuRef]);

  const start = startOf(task);
  const completedOn = doneOn(task);
  const finished = selection === "all" ? !!completedOn : completedOn === selection;
  const count = dayCount(task, selection === "all" ? completedOn || todayK : selection);

  // The native date input opens its own picker when it gets focus.
  useEffect(() => {
    if (!changingDate) return;
    const el = dateRef.current;
    el?.focus();
    try {
      el?.showPicker?.();
    } catch {
      /* not supported everywhere */
    }
  }, [changingDate]);

  const setDeadline = (value: DayKey | "") => {
    const next = { ...task };
    if (value) next.deadline = value;
    else delete next.deadline;
    saveTask(next);
  };

  const changeDate = (value: string) => {
    if (!value) return;
    const next: Task = { ...task, date: value };
    // A task cannot be completed before it starts.
    if (next.done && (doneOn(task) ?? "") < value) next.doneDate = value;
    saveTask(next);
  };

  const menuItem = (text: string, onClick: () => void, className?: string) => (
    <button
      type="button"
      key={text}
      className={className}
      onClick={() => {
        setMenuOpen(false);
        onClick();
      }}
    >
      {text}
    </button>
  );

  const completedBanner = completedOn ? (
    <div className="fb">
      <span>{"Task completed · " + label(completedOn)}</span>
      <button
        type="button"
        className={"x kb" + (expanded ? " open" : "")}
        title={expanded ? "Hide details" : "Show details"}
        aria-expanded={expanded}
        onClick={onToggleExpanded}
      >
        <ChevronDownIcon />
      </button>
    </div>
  ) : null;

  if (isMutedOn(task, selection)) {
    return (
      <div className="note muted" title={task.body}>
        <div className="t">{renderHighlighted(headingOf(task), terms)}</div>
        <span className="cr">Muted today</span>
        <button
          type="button"
          className="chk"
          onClick={() => saveTask({ ...task, mutedDays: (task.mutedDays || []).filter((d) => d !== selection) })}
        >
          Unmute
        </button>
      </div>
    );
  }

  if (finished && !expanded) {
    return (
      <div className="note fin folded">
        {completedBanner}
        <div className="fh">
          <div className="t">{renderHighlighted(headingOf(task), terms)}</div>
          <span className="lw">
            <span className="bd fin">{"✓ Done · " + count + (count === 1 ? " day" : " days")}</span>
            <span className="cr">{"Created " + label(start)}</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={"note" + (finished ? " fin" : "")}>
      {finished && completedOn ? completedBanner : null}

      <div className="hd">
        {changingDate ? (
          <input
            type="date"
            ref={dateRef}
            defaultValue={start}
            onChange={(e) => {
              changeDate(e.target.value);
              setChangingDate(false);
            }}
            onBlur={() => setChangingDate(false)}
          />
        ) : null}

        {editing ? (
          <TaskEditor task={task} onDone={() => setEditing(false)} />
        ) : (
          <div className="cb">
            {task.title ? <div className="t">{renderHighlighted(task.title, terms)}</div> : null}
            <div className="b">{renderHighlighted(task.body || "", terms)}</div>
            {task.deadline || task.projects?.length || task.people?.length ? (
              <div className="tags" ref={chipRef}>
                {task.deadline ? (
                  <DeadlineChip
                    task={task}
                    deadline={task.deadline}
                    selection={selection}
                    todayK={todayK}
                    onEdit={() => setDeadlineOpen(true)}
                  />
                ) : null}
                {(task.projects || []).map((p) => (
                  <span className="tg" key={"p" + p}>
                    {renderHighlighted("#" + p, terms)}
                  </span>
                ))}
                {(task.people || []).map((p) => (
                  <span className="tg" key={"e" + p}>
                    {renderHighlighted("@" + p, terms)}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        )}

        <div className="mw" ref={menuRef}>
          <button
            type="button"
            ref={kebabRef}
            className="x kb"
            title="More"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {"⋮"}
          </button>
          {menuOpen ? (
            <div className="mn">
              {menuItem("Edit", () => setEditing(true))}
              {menuItem("Change date", () => setChangingDate(true))}
              {menuItem(task.deadline ? "Change deadline" : "Set deadline", () => setDeadlineOpen(true))}
              {task.deadline ? menuItem("Remove deadline", () => setDeadline("")) : null}
              {selection === "all"
                ? null
                : menuItem("Mute for this day", () =>
                    saveTask({ ...task, mutedDays: [...(task.mutedDays || []), selection] }),
                  )}
              {menuItem("Delete", () => removeTask(task.id), "dl")}
            </div>
          ) : null}
        </div>
      </div>

      <Updates
        task={task}
        selection={selection}
        collapsed={collapsed}
        onToggleCollapsed={onToggleCollapsed}
      />

      <AddUpdate task={task} />

      <div className="meta">
        <span className="lw">
          <span className={"bd" + (finished ? " fin" : "")}>
            {finished
              ? "✓ Done · " + count + (count === 1 ? " day" : " days")
              : count + (count === 1 ? " day active" : " days active")}
          </span>
          <span className="cr">{"Created " + label(start)}</span>
        </span>
        <span>
          {!completedOn ? (
            <button
              type="button"
              className="chk"
              onClick={() =>
                saveTask({ ...task, done: true, doneDate: completeDayFor(task, selection, todayK) })
              }
            >
              {"✓ Complete"}
            </button>
          ) : selection === "all" || selection === completedOn ? (
            <button
              type="button"
              className="chk"
              onClick={() => {
                const next = { ...task, done: false };
                delete next.doneDate;
                saveTask(next);
              }}
            >
              Reopen
            </button>
          ) : null}
        </span>
      </div>

      {deadlineOpen ? (
        <DatePicker
          anchor={(chipRef.current?.querySelector(".tg.dl") as HTMLElement) || kebabRef.current!}
          value={task.deadline || ""}
          onPick={(value) => {
            setDeadline(value);
            setDeadlineOpen(false);
          }}
          onClose={() => setDeadlineOpen(false)}
        />
      ) : null}
    </div>
  );
}
