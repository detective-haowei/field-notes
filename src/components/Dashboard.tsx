import { useMemo } from "react";
import type { Task } from "../types";
import { MONTH_NAMES, label, parse } from "../lib/dates";
import { TAG_SYMBOL } from "../lib/tags";
import { dayCount, doneOn, headingOf } from "../lib/tasks";
import { completedTasks, deltaLabel, periodAt, periodStats, type PeriodKind } from "../lib/stats";
import { useStore } from "../store/StoreContext";
import { useView } from "../store/ViewContext";

const PERIODS: [PeriodKind, string][] = [
  ["month", "This month"],
  ["quarter", "This quarter"],
  ["year", "This year"],
];

function monthHeading(day: string): string {
  const d = parse(day);
  return MONTH_NAMES[d.getMonth()] + " " + d.getFullYear();
}

/** Summaries for the month, quarter and year, then every completed task. */
export function Dashboard() {
  const { tasks } = useStore();
  const { todayK, select } = useView();

  const cards = useMemo(
    () =>
      PERIODS.map(([kind, kicker]) => {
        const period = periodAt(kind, todayK);
        const before = periodAt(kind, todayK, -1);
        return {
          kind,
          kicker,
          period,
          before,
          now: periodStats(tasks, period),
          prev: periodStats(tasks, before),
        };
      }),
    [tasks, todayK],
  );

  const done = useMemo(() => completedTasks(tasks), [tasks]);

  // Grouped by the month a task was finished in; the list is already newest first.
  const groups = useMemo(() => {
    const out: { heading: string; tasks: Task[] }[] = [];
    for (const t of done) {
      const heading = monthHeading(doneOn(t) || todayK);
      const last = out[out.length - 1];
      if (last && last.heading === heading) last.tasks.push(t);
      else out.push({ heading, tasks: [t] });
    }
    return out;
  }, [done, todayK]);

  return (
    <div className="dash">
      <div className="dash-cards">
        {cards.map(({ kind, kicker, period, before, now, prev }) => (
          <section className="panel dash-card" key={kind}>
            <div className="dash-kicker">{kicker}</div>
            <div className="dash-period">{period.name}</div>
            <div className="dash-num">{now.completed}</div>
            <div className="dash-label">completed</div>
            <div className="dash-delta">{deltaLabel(now.completed, prev.completed, before.short)}</div>
            <dl className="dash-facts">
              <div>
                <dt>Started</dt>
                <dd>{now.started}</dd>
              </div>
              <div>
                <dt>Updates</dt>
                <dd>{now.updates}</dd>
              </div>
              <div>
                <dt>Avg days to finish</dt>
                <dd>{now.avgDays === null ? "—" : String(Math.round(now.avgDays * 10) / 10)}</dd>
              </div>
            </dl>
          </section>
        ))}
      </div>

      <div className="dash-head">
        <h3>Completed tasks</h3>
        <span className="dash-count">{done.length}</span>
      </div>

      {done.length ? (
        groups.map((g) => (
          <div className="dash-group" key={g.heading}>
            <div className="dash-month">
              {g.heading}
              <span>{g.tasks.length}</span>
            </div>
            {g.tasks.map((t) => {
              const day = doneOn(t) || todayK;
              const n = dayCount(t, day);
              return (
                <button
                  type="button"
                  key={t.id}
                  className="note muted dash-row"
                  title="Open this day"
                  onClick={() => select(day)}
                >
                  <span className="t">{headingOf(t)}</span>
                  {(t.projects || []).map((p) => (
                    <span className="tg" key={"p" + p}>
                      {TAG_SYMBOL.projects + p}
                    </span>
                  ))}
                  {(t.people || []).map((p) => (
                    <span className="tg" key={"e" + p}>
                      {TAG_SYMBOL.people + p}
                    </span>
                  ))}
                  <span className="cr">{label(day)}</span>
                  <span className="bd">{n + (n === 1 ? " day" : " days")}</span>
                </button>
              );
            })}
          </div>
        ))
      ) : (
        <div className="empty">Nothing completed yet. Finished tasks will be listed here.</div>
      )}
    </div>
  );
}
