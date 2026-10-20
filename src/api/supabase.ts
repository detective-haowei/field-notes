import { createClient, type SupabaseClient, type Session } from "@supabase/supabase-js";
import type { DayMap, Task } from "../types";
import type { Assets, Backend } from "./types";
import { UploadError } from "./types";
import { MAX_UPLOAD_BYTES } from "../lib/files";
import { randomHex16 } from "../lib/ids";
import { supabaseConfig } from "./config";
import * as assetUrls from "./assetUrls";

// Everything a signed-in user owns lives in one `items` table, keyed by
// (user_id, kind, id), plus a private storage bucket for attachments. Row-level
// security in supabase/setup.sql keeps each account to its own rows.

const BUCKET = "attachments";
const SIGNED_URL_TTL = 604800; // seconds (7 days)
const DEBOUNCE_MS = 150;

type Kind = "notes" | "days";
interface Row<T> {
  id: string;
  data: T;
}
type DayRow = { status: string };

let client: SupabaseClient | null = null;

export function getClient(): SupabaseClient | null {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  if (!client) client = createClient(cfg.url, cfg.key);
  return client;
}

export async function currentSession(c: SupabaseClient): Promise<Session | null> {
  const { data } = await c.auth.getSession();
  return data?.session ?? null;
}

export async function signIn(c: SupabaseClient, email: string, password: string) {
  return c.auth.signInWithPassword({ email, password });
}

export async function signUp(c: SupabaseClient, email: string, password: string) {
  return c.auth.signUp({ email, password });
}

function unwrap<T extends { error: unknown | null }>(res: T): T {
  if (res.error) throw res.error;
  return res;
}

export function createSupabaseBackend(c: SupabaseClient, session: Session): Backend {
  const userId = session.user.id;

  /** Signs the attachments we do not already have a URL for. */
  async function signUrls(ids: string[]) {
    const missing = ids.filter((id) => !assetUrls.hasUrl(id));
    if (!missing.length) return;
    const { data } = await c.storage
      .from(BUCKET)
      .createSignedUrls(missing.map((id) => userId + "/" + id), SIGNED_URL_TTL);
    for (const row of data || []) {
      if (row.signedUrl && row.path) assetUrls.setUrl(row.path.split("/").pop()!, row.signedUrl);
    }
  }

  function attachmentIds(rows: Row<Omit<Task, "id">>[]): string[] {
    const out: string[] = [];
    for (const row of rows)
      for (const u of row.data?.updates || []) for (const f of u.files || []) if (f?.id) out.push(f.id);
    return out;
  }

  async function put(kind: Kind, id: string, data: unknown) {
    unwrap(
      await c
        .from("items")
        .upsert({ user_id: userId, kind, id, data, updated_at: new Date().toISOString() }),
    );
  }

  async function drop(kind: Kind, id: string) {
    unwrap(await c.from("items").delete().eq("kind", kind).eq("id", id));
  }

  /**
   * Loads a kind, then reloads it when Postgres reports a change for this
   * user. Changes are debounced because one save can produce several events.
   */
  function watch<T>(kind: Kind, onRows: (rows: Row<T>[]) => Promise<void> | void, onError: (e: unknown) => void) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let dead = false;

    const load = async () => {
      try {
        const res = unwrap(await c.from("items").select("id,data").eq("kind", kind));
        if (!dead) await onRows((res.data || []) as Row<T>[]);
      } catch (e) {
        if (!dead) onError(e);
      }
    };

    void load();
    const channel = c
      .channel("items-" + kind + "-" + Math.random().toString(36).slice(2))
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items", filter: "user_id=eq." + userId },
        (payload) => {
          const changed =
            (payload.new as { kind?: string } | null)?.kind ||
            (payload.old as { kind?: string } | null)?.kind;
          if (changed && changed !== kind) return;
          clearTimeout(timer);
          timer = setTimeout(load, DEBOUNCE_MS);
        },
      )
      .subscribe();

    return () => {
      dead = true;
      clearTimeout(timer);
      void c.removeChannel(channel);
    };
  }

  const assets: Assets = {
    local: false,
    async upload(file, opts) {
      if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("too_large");
      const id = randomHex16();
      const res = await c.storage
        .from(BUCKET)
        .upload(userId + "/" + id, file, { contentType: opts?.type || file.type, upsert: false });
      if (res.error) {
        throw new UploadError(/exceed|size|limit/i.test(res.error.message || "") ? "too_large" : "failed");
      }
      await signUrls([id]);
      return { id, sizeBytes: file.size };
    },
    async delete(id) {
      assetUrls.dropUrl(id);
      await c.storage.from(BUCKET).remove([userId + "/" + id]);
    },
  };

  return {
    mode: "supabase",
    synced: true,
    assets,
    account: {
      email: session.user.email || "",
      signOut: async () => {
        await c.auth.signOut();
      },
    },
    items: {
      tasks: {
        subscribe(onData, onError) {
          return watch<Omit<Task, "id">>(
            "notes",
            async (rows) => {
              await signUrls(attachmentIds(rows));
              onData(rows.map((r) => ({ ...r.data, id: r.id }) as Task));
            },
            onError,
          );
        },
        async set(task) {
          const { id, ...rest } = task;
          await put("notes", id, rest);
        },
        remove: (id) => drop("notes", id),
      },
      days: {
        subscribe(onData, onError) {
          return watch<DayRow>(
            "days",
            (rows) => {
              const days: DayMap = {};
              for (const r of rows) days[r.id] = r.data.status;
              onData(days);
            },
            onError,
          );
        },
        set: (day, status) => put("days", day, { status }),
        remove: (day) => drop("days", day),
      },
    },
  };
}

/** Reloads the page on sign-out so no signed-in state is left behind. */
export function onSignedOut(c: SupabaseClient, fn: () => void) {
  const { data } = c.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") fn();
  });
  return () => data.subscription.unsubscribe();
}
