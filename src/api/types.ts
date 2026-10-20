import type { DayMap, Task } from "../types";

/** Which store the app ended up using, for the Manage dialog's wording. */
export type BackendMode = "supabase" | "claude" | "local";

export interface Account {
  email: string;
  signOut: () => void | Promise<void>;
}

export interface UploadResult {
  id: string;
  sizeBytes: number;
}

/** File storage for attachments. */
export interface Assets {
  /** True when files live in this browser rather than in an account. */
  local: boolean;
  /**
   * A URL to try when no direct URL is known for an attachment. Only the
   * artifact host serves files by id; elsewhere a file with no URL yet simply
   * shows as a chip.
   */
  fallbackUrl?: (id: string) => string;
  upload: (file: File, opts?: { type?: string }) => Promise<UploadResult>;
  delete: (id: string) => Promise<void>;
}

export type UploadErrorCode = "too_large" | "quota_or_state" | "rate_limited" | "failed";

export class UploadError extends Error {
  code: UploadErrorCode;
  constructor(code: UploadErrorCode, message?: string) {
    super(message || code);
    this.code = code;
  }
}

/**
 * The two record kinds the app stores. `notes` holds tasks; `days` holds the
 * work / PTO / unpaid marks, one row per marked day.
 */
export interface Items {
  tasks: {
    subscribe: (onData: (tasks: Task[]) => void, onError: (e: unknown) => void) => () => void;
    set: (task: Task) => Promise<void>;
    remove: (id: string) => Promise<void>;
  };
  days: {
    subscribe: (onData: (days: DayMap) => void, onError: (e: unknown) => void) => () => void;
    set: (day: string, status: string) => Promise<void>;
    remove: (day: string) => Promise<void>;
  };
}

export interface Backend {
  mode: BackendMode;
  /** False for the local store, which has no cross-device sync. */
  synced: boolean;
  items: Items;
  assets: Assets | null;
  account: Account | null;
}
