import { useRef, useState } from "react";
import type { DayKey } from "../types";
import { label } from "../lib/dates";
import { DatePicker } from "./DatePicker";

interface Props {
  value: DayKey | "";
  onChange: (value: DayKey | "") => void;
}

/** The "+ Deadline" button, which opens the date picker. */
export function DeadlineField({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="tf">
      <div className="ta2">
        <button
          type="button"
          ref={buttonRef}
          className={"tadd dlb" + (value ? " set" : "")}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          {value ? "Due " + label(value) : "+ Deadline"}
        </button>
        {value ? (
          <button type="button" className="tx" title="Remove deadline" onClick={() => onChange("")}>
            {"✕"}
          </button>
        ) : null}
      </div>
      {open && buttonRef.current ? (
        <DatePicker
          anchor={buttonRef.current}
          value={value}
          onPick={(next) => {
            onChange(next);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}
