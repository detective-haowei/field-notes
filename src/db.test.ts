import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { createNote, deleteNote, listNotes, matchesQuery, parseTags, updateNote } from "./db";

describe("notes store", () => {
  it("creates, lists newest first, updates and deletes", async () => {
    const a = await createNote({ title: "Creek survey", body: "Low water", tags: ["water"] });
    await new Promise((r) => setTimeout(r, 5));
    const b = await createNote({ title: "Bird count", body: "12 jays", tags: [] });

    expect((await listNotes()).map((n) => n.id)).toEqual([b.id, a.id]);

    await new Promise((r) => setTimeout(r, 5));
    const updated = await updateNote(a.id, { ...a, body: "Very low water" });
    expect(updated.createdAt).toBe(a.createdAt);
    expect((await listNotes())[0].id).toBe(a.id);

    await deleteNote(b.id);
    expect((await listNotes()).map((n) => n.id)).toEqual([a.id]);
  });
});

describe("helpers", () => {
  const note = { id: "1", title: "Ridge", body: "Fog at dawn", tags: ["Weather"], createdAt: 0, updatedAt: 0 };

  it("matches title, body and tags case-insensitively", () => {
    expect(matchesQuery(note, "ridge")).toBe(true);
    expect(matchesQuery(note, "DAWN")).toBe(true);
    expect(matchesQuery(note, "weath")).toBe(true);
    expect(matchesQuery(note, "river")).toBe(false);
    expect(matchesQuery(note, "  ")).toBe(true);
  });

  it("parses comma-separated tags", () => {
    expect(parseTags(" birds, water,,birds ")).toEqual(["birds", "water"]);
  });
});
