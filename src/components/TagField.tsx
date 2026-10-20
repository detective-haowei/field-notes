import { useMemo, useRef, useState } from "react";
import type { TagKind } from "../types";
import { MAX_TAGS, MAX_TAG_LENGTH, TAG_SYMBOL, normalizeTag, sortedTags } from "../lib/tags";
import { useDismiss } from "../hooks/useDismiss";
import { useStore } from "../store/StoreContext";

interface Props {
  label: string;
  kind: TagKind;
  values: string[];
  onChange: (values: string[]) => void;
}

/**
 * Picks projects or people: a chip per value, and a popover listing every tag
 * already in use with the option to create a new one.
 */
export function TagField({ label, kind, values, onChange }: Props) {
  const { tasks } = useStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const symbol = TAG_SYMBOL[kind];

  useDismiss(open, () => setOpen(false), [boxRef]);

  const toggle = (tag: string) => {
    if (values.includes(tag)) onChange(values.filter((t) => t !== tag));
    else if (values.length < MAX_TAGS) onChange([...values, tag]);
  };

  const typed = normalizeTag(query);
  const options = useMemo(() => {
    const all = sortedTags(tasks, kind);
    for (const v of values) if (!all.includes(v)) all.push(v);
    all.sort((a, b) => a.localeCompare(b));
    const needle = typed.toLowerCase();
    return all.filter((t) => !needle || t.toLowerCase().includes(needle));
  }, [tasks, kind, values, typed]);

  const canCreate = !!typed && !options.some((t) => t.toLowerCase() === typed.toLowerCase());

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "Enter") {
      e.preventDefault();
      if (options.length) toggle(options[0]);
      else if (canCreate) {
        toggle(typed);
        setQuery("");
      }
    } else if (e.key === "Backspace" && !query && values.length) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div className="tf" ref={boxRef}>
      <div className="ta2">
        <button
          type="button"
          className="tadd"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
            setQuery("");
          }}
        >
          + {label}
        </button>
        {values.map((v) => (
          <span className="tg" key={v}>
            {symbol}
            {v}
            <button
              type="button"
              className="tx"
              aria-label={"Remove " + v}
              onClick={() => onChange(values.filter((t) => t !== v))}
            >
              {"✕"}
            </button>
          </span>
        ))}
      </div>

      {open ? (
        <div className="pop">
          <div className="ph">{label}</div>
          <input
            autoFocus
            maxLength={MAX_TAG_LENGTH}
            placeholder={"Select one or more options…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <div className="opts">
            {options.map((t) => {
              const on = values.includes(t);
              return (
                <div
                  key={t}
                  className={"opt" + (on ? " on" : "")}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggle(t)}
                >
                  <span className="ck">{on ? "✓" : ""}</span>
                  <span className="tg">{t}</span>
                </div>
              );
            })}
            {canCreate ? (
              <div
                className="opt"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  toggle(typed);
                  setQuery("");
                }}
              >
                <span className="ck">+</span>
                <span>Create </span>
                <span className="tg">{typed}</span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
