export function uid(prefix: string): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** 32 lowercase hex characters, the id shape attachments are stored under. */
export function randomHex16(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => (x < 16 ? "0" : "") + x.toString(16)).join("");
}
