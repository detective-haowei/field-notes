import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { DayKey, DayMap, DayType, TagKind, Task } from "../types";
import type { Assets, Backend, BackendMode } from "../api/types";
import { backendForSession, bootstrap } from "../api/backend";
import { getClient, onSignedOut } from "../api/supabase";
import { defaultDayType, isKnownDayStatus } from "../lib/holidays";
import { isDayKey, cleanTask } from "../lib/schema";
import { newestFirst } from "../lib/tasks";
import { renameTagOn } from "../lib/tags";

const FLASH_MS = 4000;
const READ_ONLY = "Couldn’t save — read-only view";

export interface ImportResult {
  added: number;
  updated: number;
  days: number;
}

interface StoreValue {
  ready: boolean;
  mode: BackendMode;
  synced: boolean;
  accountEmail: string | null;
  /** Null when there is nowhere to put files, which hides the attach button. */
  assets: Assets | null;
  status: string;
  tasks: Task[];
  days: DayMap;
  /** Shown instead of the app until someone signs in. */
  authClient: SupabaseClient | null;
  flash: (message: string) => void;
  signIn: (session: Session) => void;
  signOut: () => void;
  saveTask: (task: Task) => void;
  removeTask: (id: string) => void;
  deleteAttachments: (ids: string[]) => void;
  setDayType: (day: DayKey, type: DayType) => void;
  importData: (notes: unknown[], days: unknown) => ImportResult;
  retag: (kind: TagKind, from: string, to: string) => void;
  wipeAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside <StoreProvider>");
  return value;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [backend, setBackend] = useState<Backend | null>(null);
  const [authClient, setAuthClient] = useState<SupabaseClient | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [days, setDays] = useState<DayMap>({});
  const [status, setStatus] = useState("");

  // Writes read the current lists, but must not re-create their callbacks on
  // every change, so the latest copies are kept in refs as well as in state.
  const tasksRef = useRef<Task[]>(tasks);
  const daysRef = useRef<DayMap>(days);
  tasksRef.current = tasks;
  daysRef.current = days;
  const backendRef = useRef<Backend | null>(null);
  backendRef.current = backend;

  const flash = useCallback((message: string) => {
    setStatus(message);
    setTimeout(() => setStatus((s) => (s === message ? "" : s)), FLASH_MS);
  }, []);

  const warn = useCallback(() => setStatus(READ_ONLY), []);

  // Choose a backend once, on load.
  useEffect(() => {
    let cancelled = false;
    void bootstrap().then((result) => {
      if (cancelled) return;
      if (result.kind === "auth") setAuthClient(result.client);
      else {
        if (result.warning) setStatus(result.warning);
        setBackend(result.backend);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Follow the chosen backend.
  useEffect(() => {
    if (!backend) return;
    const offTasks = backend.items.tasks.subscribe(
      (next) => setTasks([...next].sort(newestFirst)),
      () => setStatus("Using this browser only"),
    );
    const offDays = backend.items.days.subscribe(
      (next) => setDays(next),
      () => {},
    );
    return () => {
      offTasks();
      offDays();
    };
  }, [backend]);

  const signIn = useCallback(
    (session: Session) => {
      if (!authClient) return;
      setBackend(backendForSession(authClient, session));
      setAuthClient(null);
    },
    [authClient],
  );

  // Signing out elsewhere (or from the Data menu) clears the page completely.
  useEffect(() => {
    if (backend?.mode !== "supabase") return;
    const client = getClient();
    if (!client) return;
    return onSignedOut(client, () => location.reload());
  }, [backend]);

  const signOut = useCallback(() => {
    void backend?.account?.signOut();
  }, [backend]);

  const deleteAttachments = useCallback((ids: string[]) => {
    const assets = backendRef.current?.assets;
    if (!assets) return;
    for (const id of ids) void assets.delete(id).catch(() => {});
  }, []);

  const saveTask = useCallback(
    (task: Task) => {
      setTasks((prev) => {
        const i = prev.findIndex((t) => t.id === task.id);
        return i < 0 ? [task, ...prev] : prev.map((t) => (t.id === task.id ? task : t));
      });
      void backendRef.current?.items.tasks.set(task).catch(warn);
    },
    [warn],
  );

  const removeTask = useCallback(
    (id: string) => {
      const task = tasksRef.current.find((t) => t.id === id);
      if (task) {
        deleteAttachments((task.updates || []).flatMap((u) => (u.files || []).map((f) => f.id)));
      }
      setTasks((prev) => prev.filter((t) => t.id !== id));
      void backendRef.current?.items.tasks.remove(id).catch(() => {});
    },
    [deleteAttachments],
  );

  /** Marking a day back to its default removes the row instead of storing it. */
  const setDayType = useCallback(
    (day: DayKey, type: DayType) => {
      const items = backendRef.current?.items.days;
      if (type === defaultDayType(day)) {
        setDays((prev) => {
          const next = { ...prev };
          delete next[day];
          return next;
        });
        void items?.remove(day).catch(() => {});
      } else {
        setDays((prev) => ({ ...prev, [day]: type }));
        void items?.set(day, type).catch(warn);
      }
    },
    [warn],
  );

  const retag = useCallback(
    (kind: TagKind, from: string, to: string) => {
      for (const task of tasksRef.current) {
        if (!(task[kind] || []).includes(from)) continue;
        saveTask({ ...task, [kind]: renameTagOn(task, kind, from, to) });
      }
    },
    [saveTask],
  );

  const importData = useCallback(
    (notes: unknown[], rawDays: unknown): ImportResult => {
      const items = backendRef.current?.items;
      let added = 0;
      let updated = 0;
      const merged = [...tasksRef.current];
      for (const raw of notes) {
        const task = cleanTask(raw);
        if (!task) continue;
        const i = merged.findIndex((t) => t.id === task.id);
        if (i < 0) {
          merged.push(task);
          added++;
        } else {
          merged[i] = task;
          updated++;
        }
        void items?.tasks.set(task).catch(warn);
      }

      const nextDays = { ...daysRef.current };
      let dayCount = 0;
      if (rawDays && typeof rawDays === "object" && !Array.isArray(rawDays)) {
        for (const [day, value] of Object.entries(rawDays as Record<string, unknown>)) {
          if (!isDayKey(day) || !isKnownDayStatus(value)) continue;
          nextDays[day] = value as string;
          dayCount++;
          void items?.days.set(day, value as string).catch(() => {});
        }
      }

      setTasks(merged.sort(newestFirst));
      setDays(nextDays);
      return { added, updated, days: dayCount };
    },
    [warn],
  );

  const wipeAll = useCallback(() => {
    const items = backendRef.current?.items;
    for (const task of tasksRef.current) {
      deleteAttachments((task.updates || []).flatMap((u) => (u.files || []).map((f) => f.id)));
      void items?.tasks.remove(task.id).catch(() => {});
    }
    for (const day of Object.keys(daysRef.current)) void items?.days.remove(day).catch(() => {});
    setTasks([]);
    setDays({});
  }, [deleteAttachments]);

  const value = useMemo<StoreValue>(
    () => ({
      ready: !!backend,
      mode: backend?.mode ?? "local",
      synced: backend?.synced ?? false,
      accountEmail: backend?.account?.email || null,
      assets: backend?.assets ?? null,
      status,
      tasks,
      days,
      authClient,
      flash,
      signIn,
      signOut,
      saveTask,
      removeTask,
      deleteAttachments,
      setDayType,
      importData,
      retag,
      wipeAll,
    }),
    [
      backend,
      status,
      tasks,
      days,
      authClient,
      flash,
      signIn,
      signOut,
      saveTask,
      removeTask,
      deleteAttachments,
      setDayType,
      importData,
      retag,
      wipeAll,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
