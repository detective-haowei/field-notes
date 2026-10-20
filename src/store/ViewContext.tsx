import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { DayKey, Filters, Selection } from "../types";
import { todayKey } from "../lib/dates";
import { hasFilters, queryTerms } from "../lib/tasks";
import { useNow } from "../hooks/useNow";
import { NARROW, useMediaQuery } from "../hooks/useMediaQuery";

/** Relative update times are refreshed on this interval. */
const TICK_MS = 60000;

const EMPTY_FILTERS: Filters = { query: "", projects: [], people: [], status: "any" };

interface ViewValue {
  /** The day whose tasks are shown, or "all". */
  selection: Selection;
  select: (next: Selection) => void;
  /** "all" while a search or filter is on, since results span every day. */
  effectiveSelection: Selection;
  todayK: DayKey;
  /** A clock that advances once a minute, for relative times. */
  now: number;
  narrow: boolean;
  filters: Filters;
  filtering: boolean;
  /** Lowercased search words, for highlighting matches. */
  terms: string[];
  setQuery: (query: string) => void;
  setStatus: (status: Filters["status"]) => void;
  toggleTag: (kind: "projects" | "people", tag: string) => void;
  clearFilters: () => void;
}

const ViewContext = createContext<ViewValue | null>(null);

export function useView(): ViewValue {
  const value = useContext(ViewContext);
  if (!value) throw new Error("useView must be used inside <ViewProvider>");
  return value;
}

export function ViewProvider({ children }: { children: ReactNode }) {
  const now = useNow(TICK_MS);
  const narrow = useMediaQuery(NARROW);
  const [selection, setSelection] = useState<Selection>(() => todayKey());
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  // Derived from the ticking clock, so the app notices midnight.
  const todayK = useMemo(() => todayKey(), [now]);

  const setQuery = useCallback((query: string) => setFilters((f) => ({ ...f, query })), []);
  const setStatus = useCallback(
    (status: Filters["status"]) => setFilters((f) => ({ ...f, status })),
    [],
  );
  const toggleTag = useCallback((kind: "projects" | "people", tag: string) => {
    setFilters((f) => {
      const on = f[kind].includes(tag);
      return { ...f, [kind]: on ? f[kind].filter((t) => t !== tag) : [...f[kind], tag] };
    });
  }, []);
  const clearFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const filtering = hasFilters(filters);

  const value = useMemo<ViewValue>(
    () => ({
      selection,
      select: setSelection,
      effectiveSelection: filtering ? "all" : selection,
      todayK,
      now,
      narrow,
      filters,
      filtering,
      terms: queryTerms(filters.query.toLowerCase()),
      setQuery,
      setStatus,
      toggleTag,
      clearFilters,
    }),
    [selection, filtering, todayK, now, narrow, filters, setQuery, setStatus, toggleTag, clearFilters],
  );

  return <ViewContext.Provider value={value}>{children}</ViewContext.Provider>;
}
