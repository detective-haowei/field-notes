import { useRef, useState } from "react";
import type { TagKind } from "../types";
import { TAG_SYMBOL, sortedTags } from "../lib/tags";
import { filterCount } from "../lib/tasks";
import { useDismiss } from "../hooks/useDismiss";
import { useStore } from "../store/StoreContext";
import { useView } from "../store/ViewContext";
import { FilterIcon } from "./icons";

const STATUSES: [string, "any" | "open" | "done"][] = [
  ["Any", "any"],
  ["Open", "open"],
  ["Completed", "done"],
];

/** Filters by status, project and person, across every day. */
export function FilterButton() {
  const { tasks } = useStore();
  const { filters, setStatus, toggleTag, clearFilters } = useView();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useDismiss(open, () => setOpen(false), [wrapRef]);

  const count = filterCount(filters);

  const group = (title: string, kind: TagKind) => {
    const all = sortedTags(tasks, kind);
    return (
      <div key={kind}>
        <div className="fh">{title}</div>
        <div className="fr">
          {all.length ? (
            all.map((t) => (
              <button
                type="button"
                key={t}
                className={"fchip" + (filters[kind].includes(t) ? " on" : "")}
                onClick={() => toggleTag(kind, t)}
              >
                {TAG_SYMBOL[kind]}
                {t}
              </button>
            ))
          ) : (
            <span className="fnone">None yet</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fw" ref={wrapRef}>
      <button
        type="button"
        className={"fbtn" + (count ? " on" : "")}
        title="Filter tasks"
        onClick={() => setOpen((o) => !o)}
      >
        <FilterIcon />
        <span>Filter</span>
        <span className="fn">{count ? String(count) : ""}</span>
      </button>

      {open ? (
        <div className="fpop">
          <div className="fh">Status</div>
          <div className="fr">
            {STATUSES.map(([text, value]) => (
              <button
                type="button"
                key={value}
                className={"fchip" + (filters.status === value ? " on" : "")}
                onClick={() => setStatus(value)}
              >
                {text}
              </button>
            ))}
          </div>
          {group("Projects", "projects")}
          {group("People", "people")}
          <button type="button" className="fclr" onClick={clearFilters}>
            Clear all
          </button>
        </div>
      ) : null}
    </div>
  );
}
