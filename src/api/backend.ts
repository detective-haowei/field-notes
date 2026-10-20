import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { Assets, Backend } from "./types";
import { claudeAssets, claudeDb, createClaudeBackend, wrapClaudeAssets } from "./claudeArtifact";
import { claudeHost, supabaseConfig } from "./config";
import { createLocalBackend, localAssets } from "./localStore";
import { createSupabaseBackend, currentSession, getClient } from "./supabase";

export type Bootstrap =
  | { kind: "ready"; backend: Backend; warning?: string }
  /** Supabase is configured but nobody is signed in yet. */
  | { kind: "auth"; client: SupabaseClient };

async function bestLocalAssets(): Promise<Assets | null> {
  try {
    return await localAssets();
  } catch {
    return null;
  }
}

export function backendForSession(client: SupabaseClient, session: Session): Backend {
  return createSupabaseBackend(client, session);
}

/**
 * Picks where data lives, in the order the app prefers: the artifact host when
 * there is one, then a configured Supabase project, then this browser alone.
 */
export async function bootstrap(): Promise<Bootstrap> {
  if (claudeHost()) {
    const ns = await claudeAssets();
    const assets = ns ? wrapClaudeAssets(ns) : await bestLocalAssets();
    const db = await claudeDb();
    return { kind: "ready", backend: db ? createClaudeBackend(db, assets) : createLocalBackend(assets) };
  }

  if (supabaseConfig()) {
    try {
      const client = getClient();
      if (client) {
        const session = await currentSession(client);
        if (!session) return { kind: "auth", client };
        return { kind: "ready", backend: backendForSession(client, session) };
      }
    } catch (e) {
      const message = (e as Error | null)?.message || String(e);
      return {
        kind: "ready",
        backend: createLocalBackend(await bestLocalAssets()),
        warning: "Couldn’t reach the sync service: " + message,
      };
    }
  }

  return { kind: "ready", backend: createLocalBackend(await bestLocalAssets()) };
}
