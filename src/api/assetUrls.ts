/**
 * Attachment ids resolve to URLs that are either blob: URLs for files held in
 * this browser or signed Supabase URLs. They arrive after the task they belong
 * to, so components subscribe instead of reading once.
 */
const urls = new Map<string, string>();
const listeners = new Set<() => void>();

function notify() {
  for (const fn of listeners) fn();
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getUrl(id: string): string | undefined {
  return urls.get(id);
}

export function setUrl(id: string, url: string) {
  urls.set(id, url);
  notify();
}

export function hasUrl(id: string): boolean {
  return urls.has(id);
}

export function dropUrl(id: string, revoke = false) {
  const url = urls.get(id);
  if (url && revoke && url.startsWith("blob:")) URL.revokeObjectURL(url);
  urls.delete(id);
  notify();
}

/** A version counter, so a hook can re-render when any URL resolves. */
let version = 0;
subscribe(() => {
  version++;
});
export function getVersion(): number {
  return version;
}
