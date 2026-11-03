import { longLabel } from "../lib/dates";
import { holidayName } from "../lib/holidays";
import { visibleTasks } from "../lib/tasks";
import { useLocalFlags } from "../hooks/useLocalFlags";
import { useStore } from "../store/StoreContext";
import { useView } from "../store/ViewContext";
import { Compose } from "./Compose";
import { Dashboard } from "./Dashboard";
import { DayStatus } from "./DayStatus";
import { FilterButton } from "./FilterButton";
import { TaskCard } from "./TaskCard";

/** Which tasks have their update log folded away; kept across reloads. */
const COLLAPSED_KEY = "wt-col";
/** Which completed tasks are opened out; the rest stay folded to a heading. */
const OPEN_DONE_KEY = "wt-open";

export function TaskColumn() {
  const { tasks } = useStore();
  const { effectiveSelection: selection, filters, filtering, todayK } = useView();
  const { flags: collapsed, toggle: toggleCollapsed } = useLocalFlags(COLLAPSED_KEY);
  const { flags: openDone, toggle: toggleOpenDone } = useLocalFlags(OPEN_DONE_KEY);

  const list = visibleTasks(tasks, selection, filters, todayK);
  // With no search or filter on, the all-days view is the dashboard.
  const dashboard = selection === "all" && !filtering;
  const heading = filtering
    ? "Search results · " + list.length
    : selection === "all"
      ? "Dashboard"
      : longLabel(selection);
  const holiday = selection === "all" ? "" : holidayName(selection);

  return (
    <section className={"col" + (filtering ? " filtering" : "")}>
      <div className="hrow">
        <h2>{heading}</h2>
        {holiday ? <span className="hol">{holiday}</span> : null}
        {selection === "all" ? null : <DayStatus day={selection} />}
        {selection === "all" ? <FilterButton /> : null}
      </div>

      {dashboard ? <Dashboard /> : <Compose />}

      <div className="notes">
        {filtering && !list.length ? <div className="empty">No matching tasks.</div> : null}
        {(dashboard ? [] : list).map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            collapsed={!!collapsed[task.id]}
            onToggleCollapsed={() => toggleCollapsed(task.id)}
            expanded={!!openDone[task.id]}
            onToggleExpanded={() => toggleOpenDone(task.id)}
          />
        ))}
      </div>
    </section>
  );
}
