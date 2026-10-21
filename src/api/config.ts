/**
 * Supabase credentials come from public/config.js at runtime rather than from
 * the build, so the deployed site can be pointed at a project by editing one
 * file. Empty values mean local-only mode.
 */
export function supabaseConfig(): { url: string; key: string } | null {
  const cfg = window.FN_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseKey) return null;
  return { url: cfg.supabaseUrl, key: cfg.supabaseKey };
}

/** True when the page is hosted as a Claude artifact, which brings its own store. */
export function claudeHost(): ClaudeHost | null {
  return window.claude && typeof window.claude.use === "function" ? window.claude : null;
}
