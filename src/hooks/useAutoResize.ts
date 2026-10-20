import { useEffect, type RefObject } from "react";

/** Grows a textarea to fit its content. */
export function fitTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

export function useAutoResize(ref: RefObject<HTMLTextAreaElement | null>, value: string) {
  useEffect(() => {
    fitTextarea(ref.current);
  }, [ref, value]);
}
