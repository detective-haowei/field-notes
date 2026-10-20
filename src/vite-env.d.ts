/// <reference types="vite/client" />

import type { DayMap, Task } from "./types";

/** The two hosts the app can run inside, both detected at runtime. */
declare global {
  /** Set by public/config.js, which is served unbundled so it can be edited. */
  interface FieldNotesConfig {
    supabaseUrl?: string;
    supabaseKey?: string;
  }

  /** Minimal shape of the namespaces used when hosted as a Claude artifact. */
  interface ClaudeDoc<T> {
    id: string;
    data: () => T;
  }
  interface ClaudeCollection<T> {
    doc: (id: string) => {
      set: (data: T) => Promise<void>;
      delete: () => Promise<void>;
    };
    onSnapshot: (
      onNext: (snapshot: { docs: ClaudeDoc<T>[] }) => void,
      onError?: (e: unknown) => void,
    ) => () => void;
  }
  interface ClaudeDb {
    collection: ((kind: "notes") => ClaudeCollection<Omit<Task, "id">>) &
      ((kind: "days") => ClaudeCollection<{ status: DayMap[string] }>);
  }
  interface ClaudeAssets {
    upload: (file: File, opts?: { type?: string }) => Promise<{ id: string; sizeBytes: number }>;
    delete: (id: string) => Promise<void>;
  }
  interface ClaudeDownloads {
    save: (opts: { filename: string; data: string | ArrayBuffer }) => Promise<{ status?: string }>;
  }
  interface ClaudeHost {
    use: ((ns: "db") => Promise<ClaudeDb>) &
      ((ns: "assets") => Promise<ClaudeAssets>) &
      ((ns: "downloads") => Promise<ClaudeDownloads>);
  }

  interface Window {
    FN_CONFIG?: FieldNotesConfig;
    claude?: ClaudeHost;
  }
}
