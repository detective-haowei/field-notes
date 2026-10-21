/** Day keys are "YYYY-MM-DD" in the viewer's local time. */
export type DayKey = string;

/** The sidebar selection: a single day, or every task at once. */
export type Selection = DayKey | "all";

/** A file attached to an update. */
export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
}

/** A dated note on a task. */
export interface Update {
  id: string;
  text: string;
  date: DayKey;
  created: number;
  files?: Attachment[];
}

/** A task. `date` is the day it starts; it stays active until completed. */
export interface Task {
  id: string;
  body: string;
  projects: string[];
  people: string[];
  created: number;
  date?: DayKey;
  deadline?: DayKey;
  /** Only set by older data and by imports. */
  title?: string;
  done?: boolean;
  doneDate?: DayKey;
  updates?: Update[];
}

/** What a day counts as. `work` and `off` are the only values ever stored. */
export type DayType = "work" | "off" | "weekend" | "holiday" | "pto" | "lwop";

/** Manual day marks, keyed by day. Days left at their default are absent. */
export type DayMap = Record<DayKey, string>;

/** Which tag list a chip or filter belongs to. */
export type TagKind = "projects" | "people";

export interface Filters {
  query: string;
  projects: string[];
  people: string[];
  status: "any" | "open" | "done";
}

/** The JSON shape written by Export and accepted by Import. */
export interface ExportPayload {
  app: string;
  version: number;
  exportedAt: string;
  notes: Task[];
  days: DayMap;
}
