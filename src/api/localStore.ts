import type { DayMap, Task } from "../types";
import type { Assets, Backend } from "./types";
import { UploadError } from "./types";
import { MAX_UPLOAD_BYTES } from "../lib/files";
import { randomHex16 } from "../lib/ids";
import * as assetUrls from "./assetUrls";

// Local-only mode: tasks and day marks in localStorage, attachment bytes in
// IndexedDB. Nothing leaves the browser.

const TASKS_KEY = "wt-notes";
const DAYS_KEY = "wt-days";
const DB_NAME = "fn-files";
const STORE = "files";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked; the in-memory copy still works for this session */
  }
}

export function readTasks(): Task[] {
  const v = read<Task[]>(TASKS_KEY, []);
  return Array.isArray(v) ? v : [];
}

export function readDays(): DayMap {
  const v = read<DayMap | unknown[]>(DAYS_KEY, {});
  return Array.isArray(v) ? {} : (v as DayMap);
}

export function writeTasks(tasks: Task[]) {
  write(TASKS_KEY, tasks);
}

export function writeDays(days: DayMap) {
  write(DAYS_KEY, days);
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Attachments kept in this browser. Resolves once existing files are mapped. */
export async function localAssets(): Promise<Assets> {
  const open = indexedDB.open(DB_NAME, 1);
  open.onupgradeneeded = () => open.result.createObjectStore(STORE, { keyPath: "id" });
  const idb = await request(open);
  const store = (mode: IDBTransactionMode) => idb.transaction(STORE, mode).objectStore(STORE);

  const rows = await request<{ id: string; blob: Blob }[]>(store("readonly").getAll());
  for (const row of rows) assetUrls.setUrl(row.id, URL.createObjectURL(row.blob));

  return {
    local: true,
    async upload(file, opts) {
      if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("too_large");
      const id = randomHex16();
      const blob = file.slice(0, file.size, opts?.type || file.type);
      try {
        await request(store("readwrite").put({ id, blob }));
      } catch (e) {
        const name = (e as DOMException | null)?.name;
        throw new UploadError(name === "QuotaExceededError" ? "quota_or_state" : "failed");
      }
      assetUrls.setUrl(id, URL.createObjectURL(blob));
      return { id, sizeBytes: file.size };
    },
    async delete(id) {
      assetUrls.dropUrl(id, true);
      await request(store("readwrite").delete(id));
    },
  };
}

/**
 * A backend over localStorage. There is nothing to listen to, so `subscribe`
 * emits what is stored once and the store keeps the authoritative copy from
 * then on, writing the whole list back on every change.
 */
export function createLocalBackend(assets: Assets | null): Backend {
  let tasks = readTasks();
  let days = readDays();

  return {
    mode: "local",
    synced: false,
    account: null,
    assets,
    items: {
      tasks: {
        subscribe(onData) {
          onData(tasks);
          return () => {};
        },
        async set(task) {
          const i = tasks.findIndex((t) => t.id === task.id);
          if (i < 0) tasks = [task, ...tasks];
          else tasks = tasks.map((t) => (t.id === task.id ? task : t));
          writeTasks(tasks);
        },
        async remove(id) {
          tasks = tasks.filter((t) => t.id !== id);
          writeTasks(tasks);
        },
      },
      days: {
        subscribe(onData) {
          onData(days);
          return () => {};
        },
        async set(day, status) {
          days = { ...days, [day]: status };
          writeDays(days);
        },
        async remove(day) {
          const next = { ...days };
          delete next[day];
          days = next;
          writeDays(days);
        },
      },
    },
  };
}
