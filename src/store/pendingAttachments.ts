import type { Attachment } from "../types";

/**
 * Files chosen for an update that has not been added yet, per task. These live
 * outside React so an upload in flight survives switching days.
 */
export interface PendingAttachment {
  name: string;
  type: string;
  size: number;
  busy: boolean;
  /** A local preview URL, available before the upload finishes. */
  preview?: string;
  /** The stored id, set once the upload finishes. */
  id?: string;
}

const pending = new Map<string, PendingAttachment[]>();
const listeners = new Set<() => void>();
const EMPTY: PendingAttachment[] = [];

function notify() {
  for (const fn of listeners) fn();
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function get(taskId: string): PendingAttachment[] {
  return pending.get(taskId) ?? EMPTY;
}

export function add(taskId: string, item: PendingAttachment) {
  pending.set(taskId, [...get(taskId), item]);
  notify();
}

export function update(taskId: string, item: PendingAttachment, changes: Partial<PendingAttachment>) {
  const list = get(taskId);
  const i = list.indexOf(item);
  if (i < 0) return;
  const next = [...list];
  next[i] = { ...item, ...changes };
  pending.set(taskId, next);
  notify();
  return next[i];
}

export function remove(taskId: string, item: PendingAttachment) {
  const next = get(taskId).filter((x) => x !== item);
  if (next.length) pending.set(taskId, next);
  else pending.delete(taskId);
  notify();
}

export function clear(taskId: string) {
  pending.delete(taskId);
  notify();
}

/** The attachment records to store on the update being added. */
export function toAttachments(list: PendingAttachment[]): Attachment[] {
  return list
    .filter((x): x is PendingAttachment & { id: string } => !!x.id)
    .map((x) => ({ id: x.id, name: x.name, type: x.type, size: x.size }));
}
