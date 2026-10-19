import { useCallback, useEffect, useMemo, useState } from "react";
import { createNote, deleteNote, listNotes, matchesQuery, updateNote } from "./db";
import type { Note, NoteDraft } from "./types";
import NoteList from "./components/NoteList";
import NoteEditor from "./components/NoteEditor";

type View = { kind: "list" } | { kind: "edit"; note?: Note };

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>({ kind: "list" });
  const [error, setError] = useState<string>();
  const online = useOnline();

  const refresh = useCallback(async () => {
    try {
      setNotes(await listNotes());
      setError(undefined);
    } catch {
      setError("This browser is blocking local storage, so notes can't be saved here. Try a regular (non-private) window.");
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const visible = useMemo(() => notes.filter((n) => matchesQuery(n, query)), [notes, query]);

  async function save(draft: NoteDraft) {
    try {
      if (view.kind === "edit" && view.note) await updateNote(view.note.id, draft);
      else await createNote(draft);
    } catch {
      setError("Couldn't save the note. Local storage is unavailable in this browser.");
      return;
    }
    await refresh();
    setView({ kind: "list" });
  }

  async function remove(id: string) {
    await deleteNote(id);
    await refresh();
    setView({ kind: "list" });
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>Field Notes</h1>
        {!online && <span className="badge">Offline</span>}
      </header>
      <main>
        {error && <p className="error banner">{error}</p>}
        {view.kind === "list" ? (
          <>
            <div className="toolbar">
              <input
                type="search"
                placeholder="Search notes and tags"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button className="primary" onClick={() => setView({ kind: "edit" })}>
                New note
              </button>
            </div>
            <NoteList notes={visible} onOpen={(note) => setView({ kind: "edit", note })} />
          </>
        ) : (
          <NoteEditor
            note={view.note}
            onSave={save}
            onDelete={view.note ? () => remove(view.note!.id) : undefined}
            onCancel={() => setView({ kind: "list" })}
          />
        )}
      </main>
    </div>
  );
}

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}
