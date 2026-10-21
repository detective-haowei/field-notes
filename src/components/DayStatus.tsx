import { useRef, useState } from "react";
import type { DayKey } from "../types";
import { DAY_TYPE_NAMES, PICKABLE_DAY_TYPES, dayType } from "../lib/holidays";
import { useDismiss } from "../hooks/useDismiss";
import { useStore } from "../store/StoreContext";
import { ChevronDownIcon } from "./icons";

/**
 * The chip beside the date heading. Weekends and public holidays are fixed, so
 * they show as a label; a working day can be marked PTO or unpaid leave.
 */
export function DayStatus({ day }: { day: DayKey }) {
  const { days, setDayType } = useStore();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const type = dayType(day, days);

  useDismiss(open, () => setOpen(false), [wrapRef]);

  if (type === "weekend" || type === "holiday") {
    return (
      <div className="dd">
        <span className="dtag off">{DAY_TYPE_NAMES[type]}</span>
      </div>
    );
  }

  return (
    <div className="dd" ref={wrapRef}>
      <button
        type="button"
        className={"dtag " + (type === "work" ? "on" : "off") + (open ? " open" : "")}
        onClick={() => setOpen((o) => !o)}
      >
        {DAY_TYPE_NAMES[type]}
        <span className="car">
          <ChevronDownIcon size={10} />
        </span>
      </button>
      {open ? (
        <div className="daymenu" role="menu">
          {PICKABLE_DAY_TYPES.map((t) => (
            <button
              type="button"
              role="menuitem"
              key={t}
              onClick={() => {
                setOpen(false);
                setDayType(day, t);
              }}
            >
              <span className="ck2">{t === type ? "✓" : ""}</span>
              <span>{DAY_TYPE_NAMES[t]}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
