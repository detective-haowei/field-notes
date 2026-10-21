import { useRef, useState } from "react";
import { useDismiss } from "../hooks/useDismiss";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

interface Props {
  view: { y: number; m: number };
  onPick: (view: { y: number; m: number }) => void;
  onClose: () => void;
}

/** Jump to any month, or back to this one. */
export function MonthPicker({ view, onPick, onClose }: Props) {
  const [year, setYear] = useState(view.y);
  const popRef = useRef<HTMLDivElement>(null);
  const now = new Date();

  useDismiss(true, onClose, [popRef]);

  return (
    <div className="mpop" ref={popRef} onClick={(e) => e.stopPropagation()}>
      <div className="mph">
        <button type="button" className="ch" title="Previous year" onClick={() => setYear((y) => y - 1)}>
          <ChevronLeftIcon />
        </button>
        <span className="myr">{year}</span>
        <button type="button" className="ch" title="Next year" onClick={() => setYear((y) => y + 1)}>
          <ChevronRightIcon />
        </button>
      </div>

      <div className="mgrid">
        {Array.from({ length: 12 }, (_, m) => {
          const selected = year === view.y && m === view.m;
          const current = year === now.getFullYear() && m === now.getMonth();
          return (
            <button
              type="button"
              key={m}
              className={"mb" + (selected ? " on" : "") + (current ? " cur" : "")}
              onClick={() => onPick({ y: year, m })}
            >
              {new Date(year, m, 1).toLocaleDateString(undefined, { month: "short" })}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="mtd"
        onClick={() => onPick({ y: now.getFullYear(), m: now.getMonth() })}
      >
        This month
      </button>
    </div>
  );
}
