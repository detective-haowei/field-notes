import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { DayKey } from "../types";
import { dayLabel, key, monday, parse } from "../lib/dates";
import { DAY_TYPE_NAMES, DAY_TYPE_SHORT, dayType, holidayName, isDayOff } from "../lib/holidays";
import { useStore } from "../store/StoreContext";
import { useView } from "../store/ViewContext";
import { ChevronLeftIcon, ChevronRightIcon, ImportIcon, CalendarIcon } from "./icons";
import { MonthPicker } from "./MonthPicker";

interface Props {
  onWeekSummary: (weekStart: DayKey) => void;
}

interface Row {
  kind: "week" | "day";
  key: string;
  /** Week rows only. */
  number?: number;
  weekStart?: DayKey;
  /** Day rows only. */
  day?: DayKey;
  monday?: boolean;
}

/** Every day of the month, with a divider before each week. */
function monthRows(y: number, m: number): Row[] {
  const rows: Row[] = [];
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  let week = 0;
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(y, m, i);
    const k = key(date);
    if (i === 1 || date.getDay() === 1) {
      week++;
      rows.push({ kind: "week", key: "w" + k, number: week, weekStart: key(monday(date)) });
    }
    rows.push({ kind: "day", key: k, day: k, monday: date.getDay() === 1 });
  }
  return rows;
}

export function DayNav({ onWeekSummary }: Props) {
  const { tasks, days } = useStore();
  const { selection, select, todayK, narrow } = useView();
  const [view, setView] = useState(() => {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() };
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [showToday, setShowToday] = useState(false);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLButtonElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  /** Set when a jump should centre today rather than the selected day. */
  const centreOn = useRef<"selected" | "today">("selected");
  /** Cleared once the day of interest has actually been scrolled into view. */
  const centrePending = useRef(true);

  const centre = useCallback((el: HTMLElement | null, smooth = false) => {
    const box = scrollerRef.current;
    if (!box) return;
    const top = el ? Math.max(0, el.offsetTop - box.clientHeight / 2 + el.offsetHeight / 2) : 0;
    if (smooth) box.scrollTo({ top, behavior: "smooth" });
    else box.scrollTop = top;
  }, []);

  /** Whether the floating Today button is needed. */
  const refreshToday = useCallback(() => {
    const box = scrollerRef.current;
    const el = todayRef.current;
    if (!box) return;
    if (!el) {
      setShowToday(true);
      return;
    }
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    setShowToday(bottom <= box.scrollTop + 2 || top >= box.scrollTop + box.clientHeight - 2);
  }, []);

  /** Centres the selected day, or today when the selection is elsewhere. */
  const centreTarget = useCallback(() => {
    const box = scrollerRef.current;
    if (!box) return;
    const target =
      centreOn.current === "today" ? todayRef.current : selectedRef.current || todayRef.current;
    centre(target);
    // The stylesheet can land after the first paint, before which the list is
    // not yet a scroller; keep trying until the scroll actually takes.
    if (box.clientHeight > 0 && box.scrollHeight > box.clientHeight) {
      centrePending.current = false;
      centreOn.current = "selected";
    }
    refreshToday();
  }, [centre, refreshToday]);

  // Bring the day of interest into view whenever the month changes.
  useLayoutEffect(() => {
    centrePending.current = true;
    centreTarget();
  }, [view.y, view.m, centreTarget]);

  // Re-run it once the panel has its real height.
  useEffect(() => {
    const box = scrollerRef.current;
    if (!box) return;
    const observer = new ResizeObserver(() => {
      if (centrePending.current) centreTarget();
      else refreshToday();
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, [centreTarget, refreshToday]);

  useEffect(() => {
    refreshToday();
  }, [tasks, days, refreshToday]);

  const goToday = () => {
    if (todayRef.current) {
      centre(todayRef.current, true);
      return;
    }
    const now = new Date();
    centreOn.current = "today";
    centrePending.current = true;
    setView({ y: now.getFullYear(), m: now.getMonth() });
  };

  const step = (by: number) =>
    setView(({ y, m }) => {
      const next = m + by;
      return { y: y + Math.floor(next / 12), m: ((next % 12) + 12) % 12 };
    });

  return (
    <nav className="panel">
      <div className={"nvh" + (stuck ? " stuck" : "")}>
        <div className="allw">
          <button
            type="button"
            className={"day all" + (selection === "all" ? " on" : "")}
            onClick={() => select("all")}
          >
            <span>All Tasks</span>
            <span className="n">{tasks.length}</span>
          </button>
        </div>
        <div className="dv" />
        <div className="mh">
          <button type="button" className="ch" title="Previous month" onClick={() => step(-1)}>
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            className="ml"
            title="Pick a month"
            onClick={(e) => {
              e.stopPropagation();
              setPickerOpen((o) => !o);
            }}
          >
            {new Date(view.y, view.m, 1).toLocaleDateString(undefined, {
              month: "short",
              year: "numeric",
            })}
          </button>
          <button type="button" className="ch" title="Next month" onClick={() => step(1)}>
            <ChevronRightIcon />
          </button>
        </div>
        {pickerOpen ? (
          <MonthPicker
            view={view}
            onPick={(next) => {
              setPickerOpen(false);
              setView(next);
            }}
            onClose={() => setPickerOpen(false)}
          />
        ) : null}
      </div>

      <div
        className="days"
        ref={scrollerRef}
        onScroll={(e) => {
          setStuck(e.currentTarget.scrollTop > 2);
          refreshToday();
        }}
      >
        {monthRows(view.y, view.m).map((row) =>
          row.kind === "week" ? (
            <div className="wkl" key={row.key}>
              <span className="wkt">
                <CalendarIcon />
                Week {row.number}
              </span>
              <button
                type="button"
                className="wks"
                aria-label="Download week summary"
                title={"Download this week’s summary as a PDF"}
                onClick={() => onWeekSummary(row.weekStart!)}
              >
                <ImportIcon size={12} />
                <span>Summary</span>
              </button>
            </div>
          ) : (
            <DayRow
              key={row.key}
              day={row.day!}
              monday={!!row.monday}
              selected={selection === row.day}
              isToday={row.day === todayK}
              narrow={narrow}
              days={days}
              onSelect={select}
              innerRef={row.day === todayK ? todayRef : selection === row.day ? selectedRef : undefined}
            />
          ),
        )}
      </div>

      <button type="button" className={"tdb" + (showToday ? " show" : "")} onClick={goToday}>
        Today
      </button>
    </nav>
  );
}

interface DayRowProps {
  day: DayKey;
  monday: boolean;
  selected: boolean;
  isToday: boolean;
  narrow: boolean;
  days: Record<string, string>;
  onSelect: (day: DayKey) => void;
  /** Set on today's row and on the selected row, for scrolling them into view. */
  innerRef?: RefObject<HTMLButtonElement>;
}

function DayRow({ day, monday: isMonday, selected, isToday, narrow, days, onSelect, innerRef }: DayRowProps) {
  const off = isDayOff(day, days);
  const type = dayType(day, days);
  const holiday = holidayName(day);
  const weekday = parse(day).getDay() % 6 !== 0;
  const reason = type === "holiday" && holiday ? holiday.replace(/ \(observed\)$/, "") : DAY_TYPE_SHORT[type];

  return (
    <button
      type="button"
      ref={innerRef}
      className={"day" + (selected ? " on" : "") + (off ? " we" : "") + (isMonday ? " mo" : "")}
      title={holiday || (off ? DAY_TYPE_NAMES[type] : "")}
      onClick={() => onSelect(day)}
    >
      <span>{dayLabel(day, narrow)}</span>
      {off && weekday ? (
        <span className="rp" title={type === "holiday" && holiday ? holiday : DAY_TYPE_NAMES[type]}>
          {reason}
        </span>
      ) : null}
      {isToday ? <span className="tp">Today</span> : null}
    </button>
  );
}
