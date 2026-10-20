import { useCallback, useState } from "react";

/**
 * A set of ids kept in localStorage, used for the per-task "updates
 * collapsed" state so it survives a reload.
 */
export function useLocalFlags(storageKey: string) {
  const [flags, setFlags] = useState<Record<string, 1>>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "{}") || {};
    } catch {
      return {};
    }
  });

  const toggle = useCallback(
    (id: string) => {
      setFlags((prev) => {
        const next = { ...prev };
        if (next[id]) delete next[id];
        else next[id] = 1;
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* ignore: the flag is a convenience, not data */
        }
        return next;
      });
    },
    [storageKey],
  );

  return { flags, toggle };
}
