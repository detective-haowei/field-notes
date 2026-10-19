import type { Note } from "../types";

interface Props {
  notes: Note[];
  onOpen: (note: Note) => void;
}

export default function NoteList({ notes, onOpen }: Props) {
  if (notes.length === 0) {
    return <p className="empty">No notes yet. Tap “New note” to start.</p>;
  }
  return (
    <ul className="note-list">
      {notes.map((note) => (
        <li key={note.id}>
          <button className="note-card" onClick={() => onOpen(note)}>
            <strong>{note.title || "Untitled"}</strong>
            <span className="meta">
              {new Date(note.updatedAt).toLocaleString()}
              {note.location && " · 📍"}
            </span>
            {note.body && <span className="preview">{note.body.slice(0, 140)}</span>}
            {note.tags.length > 0 && (
              <span className="tags">
                {note.tags.map((t) => (
                  <span key={t} className="tag">{t}</span>
                ))}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
