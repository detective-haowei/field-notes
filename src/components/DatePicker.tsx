import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { DayKey } from "../types";
import { MONTH_NAMES, WEEKDAY_INITIALS, addDays, key, parse } from "../lib/dates";
import { useView } from "../store/ViewContext";

const WIDTH = 320;
const GAP = 8;
const EDGE = 12;

interface Props {
  /** What the picker is positioned against. */
  anchor: HTMLElement;
  /** The day currently set, or "" for none. A set day offers Clear. */
  value: DayKey | "";
  /** Called with the chosen day, or "" when cleared. */
  onPick: (day: DayKey | "") => void;
  onClose: () => void;
}

export function DatePicker({ anchor, value, onPick, onClose }: Props) {
  const { todayK } = useView();
  const boxRef = useRef<HTMLDivElement>(null);
  const start = value ? parse(value) : new Date();
  const [view, setView] = useState({ y: start.getFullYear(), m: start.getMonth() });
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  // Prefer below the anchor, flipping above when there is no room.
  useLayoutEffect(() => {
    const rect = anchor.getBoundingClientRect();
    const height = boxRef.current?.offsetHeight ?? 0;
    const left = Math.max(EDGE, Math.min(rect.left, window.innerWidth - WIDTH - EDGE));
    let top = rect.bottom + GAP;
    if (top + height > window.innerHeight - EDGE) top = Math.max(EDGE, rect.top - height - GAP);
    setPos({ left, top });
  }, [anchor, view]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const step = (by: number) =>
    setView(({ y, m }) => {
      const next = m + by;
      return { y: y + Math.floor(next / 12), m: ((next % 12) + 12) % 12 };
    });

  const firstOffset = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const quick: [string, DayKey][] = [
    ["Today", todayK],
    ["Tomorrow", addDays(todayK, 1)],
    ["Next week", addDays(todayK, 7)],
  ];

  return createPortal(
    <>
      <div className="dpb" onClick={onClose} />
      <div
        className="dp"
        ref={boxRef}
        style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, visibility: pos ? "visible" : "hidden" }}
      >
        <div className="dph">
          <div className="dpt">
            {MONTH_NAMES[view.m]} {view.y}
          </div>
          <div className="dpv">
            <button type="button" className="dpn" aria-label="Previous month" onClick={() => step(-1)}>
              {"‹"}
            </button>
            <button type="button" className="dpn" aria-label="Next month" onClick={() => step(1)}>
              {"›"}
            </button>
          </div>
        </div>

        <div className="dpw">
          {WEEKDAY_INITIALS.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>

        <div className="dpg">
          {Array.from({ length: firstOffset }, (_, i) => (
            <span key={"pad" + i} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const k = key(new Date(view.y, view.m, day));
            const weekend = (firstOffset + i) % 7 > 4;
            const className = [
              "dpd",
              k === todayK ? "now" : "",
              weekend ? "we" : "",
              k === value ? "sel" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button type="button" key={k} className={className} onClick={() => onPick(k)}>
                {day}
              </button>
            );
          })}
        </div>

        <div className="dpf">
          {quick.map(([label, k]) => (
            <button type="button" key={label} onClick={() => onPick(k)}>
              {label}
            </button>
          ))}
        </div>

        {value ? (
          <button type="button" className="dpc" onClick={() => onPick("")}>
            Clear deadline
          </button>
        ) : null}
      </div>
    </>,
    document.body,
  );
}
