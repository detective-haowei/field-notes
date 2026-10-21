import type { DayMap, Task } from "../types";
import type { Assets, Backend } from "./types";
import { claudeHost } from "./config";

/**
 * When the page runs as a Claude artifact it is handed a shared database and
 * file store, which are used in place of Supabase.
 */
export async function claudeDb(): Promise<ClaudeDb | null> {
  const host = claudeHost();
  if (!host) return null;
  try {
    return await host.use("db");
  } catch {
    return null;
  }
}

export async function claudeAssets(): Promise<ClaudeAssets | null> {
  const host = claudeHost();
  if (!host) return null;
  try {
    return await host.use("assets");
  } catch {
    return null;
  }
}

export async function claudeDownloads(): Promise<ClaudeDownloads | null> {
  const host = claudeHost();
  if (!host) return null;
  try {
    return await host.use("downloads");
  } catch {
    return null;
  }
}

export function createClaudeBackend(db: ClaudeDb, assets: Assets | null): Backend {
  return {
    mode: "claude",
    synced: true,
    account: null,
    assets,
    items: {
      tasks: {
        subscribe(onData, onError) {
          return db.collection("notes").onSnapshot(
            (snapshot) => onData(snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as Task)),
            onError,
          );
        },
        async set(task) {
          const { id, ...rest } = task;
          await db.collection("notes").doc(id).set(rest);
        },
        async remove(id) {
          await db.collection("notes").doc(id).delete();
        },
      },
      days: {
        subscribe(onData, onError) {
          return db.collection("days").onSnapshot((snapshot) => {
            const days: DayMap = {};
            for (const d of snapshot.docs) days[d.id] = d.data().status;
            onData(days);
          }, onError);
        },
        async set(day, status) {
          await db.collection("days").doc(day).set({ status });
        },
        async remove(day) {
          await db.collection("days").doc(day).delete();
        },
      },
    },
  };
}

/** Wraps the artifact file store in the app's own Assets shape. */
export function wrapClaudeAssets(ns: ClaudeAssets): Assets {
  return {
    local: false,
    fallbackUrl: (id) => "/_blob/" + id,
    upload: (file, opts) => ns.upload(file, opts),
    delete: (id) => ns.delete(id),
  };
}
