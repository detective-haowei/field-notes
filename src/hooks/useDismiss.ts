import { useEffect, type RefObject } from "react";

/**
 * Closes a popover on Escape or on a pointer press outside it. Listeners are
 * captured so a press inside another popover still closes this one.
 */
export function useDismiss(
  active: boolean,
  onClose: () => void,
  refs: RefObject<HTMLElement | null>[],
) {
  useEffect(() => {
    if (!active) return;
    const inside = (target: Node) => refs.some((r) => r.current?.contains(target));
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!inside(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
    // The refs themselves are stable; spreading them keeps the list honest
    // for callers that pass a different number of them.
  }, [active, onClose, ...refs]);
}
