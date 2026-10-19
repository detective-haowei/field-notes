import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Note, NoteDraft } from "./types";

interface FieldNotesDB extends DBSchema {
  notes: {
    key: string;
    value: Note;
    indexes: { "by-updated": number };
  };
}

let dbPromise: Promise<IDBPDatabase<FieldNotesDB>> | undefined;

function db() {
  dbPromise ??= openDB<FieldNotesDB>("field-notes", 1, {
    upgrade(database) {
      const store = database.createObjectStore("notes", { keyPath: "id" });
      store.createIndex("by-updated", "updatedAt");
    },
  });
  return dbPromise;
}

/** All notes, most recently updated first. */
export async function listNotes(): Promise<Note[]> {
  const notes = await (await db()).getAllFromIndex("notes", "by-updated");
  return notes.reverse();
}

export async function getNote(id: string): Promise<Note | undefined> {
  return (await db()).get("notes", id);
}

export async function createNote(draft: NoteDraft): Promise<Note> {
  const now = Date.now();
  const note: Note = { ...draft, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  await (await db()).put("notes", note);
  return note;
}

export async function updateNote(id: string, draft: NoteDraft): Promise<Note> {
  const existing = await getNote(id);
  if (!existing) throw new Error(`Note ${id} not found`);
  const note: Note = { ...existing, ...draft, updatedAt: Date.now() };
  await (await db()).put("notes", note);
  return note;
}

export async function deleteNote(id: string): Promise<void> {
  await (await db()).delete("notes", id);
}

/** Case-insensitive match against title, body and tags. */
export function matchesQuery(note: Note, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    note.title.toLowerCase().includes(q) ||
    note.body.toLowerCase().includes(q) ||
    note.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export function parseTags(input: string): string[] {
  return [...new Set(input.split(",").map((t) => t.trim()).filter(Boolean))];
}
