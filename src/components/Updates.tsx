import { useState } from "react";
import type { Selection, Task } from "../types";
import { visibleUpdates } from "../lib/tasks";
import { ChevronDownIcon } from "./icons";
import { UpdateRow } from "./UpdateRow";

/** Older updates are folded away until asked for. */
const SHOWN_BY_DEFAULT = 3;

interface Props {
  task: Task;
  selection: Selection;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function Updates({ task, selection, collapsed, onToggleCollapsed }: Props) {
  const [expanded, setExpanded] = useState(false);
  const updates = visibleUpdates(task, selection);
  if (!updates.length) return null;

  const hidden = updates.length - SHOWN_BY_DEFAULT;
  const showAll = collapsed ? [] : expanded || hidden <= 0 ? updates : updates.slice(-SHOWN_BY_DEFAULT);

  return (
    <div className="ups">
      <button
        type="button"
        className={"uh" + (collapsed ? " col" : "")}
        title={collapsed ? "Show updates" : "Hide updates"}
        onClick={onToggleCollapsed}
      >
        <ChevronDownIcon />
        <span>Updates</span>
        {collapsed ? <span className="ucnt">{updates.length}</span> : null}
      </button>

      {!collapsed && hidden > 0 && !expanded ? (
        <button type="button" className="more" onClick={() => setExpanded(true)}>
          Show {hidden} earlier
        </button>
      ) : null}

      {showAll.map((u) => (
        <UpdateRow
          key={u.id}
          task={task}
          update={u}
          current={selection !== "all" && u.date === selection}
        />
      ))}

      {!collapsed && hidden > 0 && expanded ? (
        <button type="button" className="more" onClick={() => setExpanded(false)}>
          Show less
        </button>
      ) : null}
    </div>
  );
}
