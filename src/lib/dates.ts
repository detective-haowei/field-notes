import type { DayKey } from "../types";

// Day keys are "YYYY-MM-DD" strings in the viewer's local time, so they sort
// lexicographically and compare with < / > throughout the app.

const pad = (n: number) => (n < 10 ? "0" + n : "" + n);

export function key(d: Date): DayKey {
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

export function parse(k: DayKey): Date {
  const p = k.split("-");
  return new Date(+p[0], +p[1] - 1, +p[2]);
}

export function monday(d: Date): Date {
  const m = new Date(d);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

/** Days from key `a` to key `b`; negative when `b` is earlier. */
export function dayN(a: DayKey, b: DayKey): number {
  return Math.round((parse(b).getTime() - parse(a).getTime()) / 864e5);
}

export function addDays(k: DayKey, n: number): DayKey {
  const x = parse(k);
  x.setDate(x.getDate() + n);
  return key(x);
}

export function addWeeks(k: DayKey, n: number): DayKey {
  return addDays(k, 7 * n);
}

export function todayKey(): DayKey {
  return key(new Date());
}

export function isWeekend(k: DayKey): boolean {
  const g = parse(k).getDay();
  return g === 0 || g === 6;
}

/** "Mon 3 Feb" */
export function label(k: DayKey): string {
  return parse(k).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

/** "3 Feb" */
export function shortLabel(k: DayKey): string {
  return parse(k).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** "Monday 3 February" */
export function longLabel(k: DayKey): string {
  return parse(k).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}

export function ord(n: number): string {
  const j = n % 10;
  const c = n % 100;
  return n + (j === 1 && c !== 11 ? "st" : j === 2 && c !== 12 ? "nd" : j === 3 && c !== 13 ? "rd" : "th");
}

/** Sidebar row label: "3rd, Monday", or a short weekday on narrow screens. */
export function dayLabel(k: DayKey, narrow: boolean): string {
  const d = parse(k);
  return ord(d.getDate()) + ", " + d.toLocaleDateString(undefined, { weekday: narrow ? "short" : "long" });
}

export function timeOf(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/**
 * "Just now" / "5 mins ago" / "2 days ago" / "Mon 3 Feb" for an update. The
 * clock time only counts while the update is still on its own day.
 */
export function relativeUpdate(u: { date: DayKey; created?: number }, now: number = Date.now()): string {
  const c = u.created;
  if (c && key(new Date(c)) === u.date && key(new Date(now)) === u.date) {
    const m = Math.max(0, Math.floor((now - c) / 60000));
    if (m < 1) return "Just now";
    if (m < 60) return m + (m === 1 ? " min ago" : " mins ago");
    const h = Math.floor(m / 60);
    return h + (h === 1 ? " hour ago" : " hours ago");
  }
  const d = dayN(u.date, key(new Date(now)));
  if (d === 0) return "Today";
  if (d > 0 && d <= 7) return d + (d === 1 ? " day ago" : " days ago");
  return label(u.date);
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Monday-first initials for date-picker headers. */
export const WEEKDAY_INITIALS = ["M", "T", "W", "T", "F", "S", "S"];
