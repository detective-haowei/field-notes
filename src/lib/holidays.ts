import type { DayKey, DayMap, DayType } from "../types";
import { isWeekend, key } from "./dates";

/**
 * NZ public holidays: the national days on their observed dates, plus
 * Wellington Anniversary. Matariki follows no formula, so its gazetted dates
 * are listed and the table ends where they do.
 */
const MATARIKI: Record<number, string> = {
  2025: "2025-06-20",
  2026: "2026-07-10",
  2027: "2027-06-25",
  2028: "2028-07-14",
};
const FIRST_YEAR = 2025;
const LAST_YEAR = 2028;

function add(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Mondayisation: a weekend date moves forward by `sat` or `sun` days. */
function shift(d: Date, sat: number, sun: number): Date {
  const g = d.getDay();
  return g === 6 ? add(d, sat) : g === 0 ? add(d, sun) : d;
}

function nthMonday(y: number, m: number, n: number): Date {
  const d = new Date(y, m, 1);
  return new Date(y, m, 1 + ((8 - d.getDay()) % 7) + (n - 1) * 7);
}

/** Anonymous Gregorian computus. */
function easter(y: number): Date {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mo = Math.floor((h + l - 7 * m + 114) / 31);
  const da = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, mo - 1, da);
}

function buildHolidays(): Record<DayKey, string> {
  const out: Record<DayKey, string> = {};
  const put = (d: Date, name: string, from?: Date) => {
    out[key(d)] = name + (from && key(from) !== key(d) ? " (observed)" : "");
  };
  const CLOSEST_MONDAY: Record<number, number> = { 0: 1, 1: 0, 2: -1, 3: -2, 4: -3, 5: 3, 6: 2 };
  for (let y = FIRST_YEAR; y <= LAST_YEAR; y++) {
    let a = new Date(y, 0, 1);
    put(shift(a, 2, 1), "New Year’s Day", a);
    a = new Date(y, 0, 2);
    put(a.getDay() === 1 ? add(a, 1) : shift(a, 2, 2), "Day after New Year’s Day", a);
    a = new Date(y, 0, 22);
    put(add(a, CLOSEST_MONDAY[a.getDay()]), "Wellington Anniversary Day");
    a = new Date(y, 1, 6);
    put(shift(a, 2, 1), "Waitangi Day", a);
    const e = easter(y);
    put(add(e, -2), "Good Friday");
    put(add(e, 1), "Easter Monday");
    a = new Date(y, 3, 25);
    put(shift(a, 2, 1), "ANZAC Day", a);
    put(nthMonday(y, 5, 1), "King’s Birthday");
    const m = MATARIKI[y].split("-");
    put(new Date(+m[0], +m[1] - 1, +m[2]), "Matariki");
    put(nthMonday(y, 9, 4), "Labour Day");
    a = new Date(y, 11, 25);
    put(shift(a, 2, 2), "Christmas Day", a);
    a = new Date(y, 11, 26);
    put(shift(a, 2, 2), "Boxing Day", a);
  }
  return out;
}

export const HOLIDAYS = buildHolidays();

/** Full names, used in titles and the day-status menu. */
export const DAY_TYPE_NAMES: Record<DayType, string> = {
  work: "Work Day",
  off: "Not working",
  weekend: "Weekend",
  holiday: "Public Holiday",
  pto: "PTO",
  lwop: "Leave w/o pay",
};

/** Short names, used on the sidebar pills. */
export const DAY_TYPE_SHORT: Partial<Record<DayType, string>> = {
  off: "Off",
  holiday: "Holiday",
  pto: "PTO",
  lwop: "Unpaid",
};

/** The types a day can be switched to by hand. */
export const PICKABLE_DAY_TYPES: DayType[] = ["work", "pto", "lwop"];

export function holidayName(k: DayKey): string {
  return HOLIDAYS[k] || "";
}

/** What a day is before any manual mark. */
export function defaultDayType(k: DayKey): DayType {
  return isWeekend(k) ? "weekend" : HOLIDAYS[k] ? "holiday" : "work";
}

/** What a day is, honouring the user's PTO / unpaid-leave marks. */
export function dayType(k: DayKey, days: DayMap): DayType {
  const d = defaultDayType(k);
  if (d === "weekend" || d === "holiday") return d;
  const o = days[k];
  return o === "pto" || o === "lwop" ? o : d;
}

export function isDayOff(k: DayKey, days: DayMap): boolean {
  return dayType(k, days) !== "work";
}

export function isKnownDayStatus(v: unknown): boolean {
  return typeof v === "string" && (v === "working" || v in DAY_TYPE_NAMES);
}
