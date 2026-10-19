import { useState, type FormEvent } from "react";
import { parseTags } from "../db";
import type { GeoPoint, Note, NoteDraft } from "../types";

interface Props {
  note?: Note;
  onSave: (draft: NoteDraft) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export default function NoteEditor({ note, onSave, onCancel, onDelete }: Props) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [tags, setTags] = useState(note?.tags.join(", ") ?? "");
  const [location, setLocation] = useState<GeoPoint | undefined>(note?.location);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string>();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function captureLocation() {
    if (!("geolocation" in navigator)) {
      setGeoError("Location isn't available on this device.");
      return;
    }
    setLocating(true);
    setGeoError(undefined);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setLocating(false);
      },
      (err) => {
        setGeoError(err.code === err.PERMISSION_DENIED ? "Location access was refused. Allow it in your browser settings to tag notes." : err.message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    onSave({ title: title.trim(), body, tags: parseTags(tags), location });
  }

  return (
    <form className="editor" onSubmit={submit}>
      <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      <textarea placeholder="What did you observe?" value={body} onChange={(e) => setBody(e.target.value)} rows={10} />
      <input placeholder="Tags, comma separated" value={tags} onChange={(e) => setTags(e.target.value)} />

      <div className="location">
        {location ? (
          <span>
            📍 {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
            {location.accuracy !== undefined && ` (±${Math.round(location.accuracy)} m)`}
            <button type="button" className="link" onClick={() => setLocation(undefined)}>Remove</button>
          </span>
        ) : (
          <button type="button" onClick={captureLocation} disabled={locating}>
            {locating ? "Locating…" : "Add current location"}
          </button>
        )}
        {geoError && <span className="error">{geoError}</span>}
      </div>

      <div className="actions">
        {onDelete &&
          (confirmingDelete ? (
            <>
              <span>Delete this note?</span>
              <button type="button" className="danger" onClick={onDelete}>Delete</button>
              <button type="button" onClick={() => setConfirmingDelete(false)}>Keep</button>
            </>
          ) : (
            <button type="button" className="danger" onClick={() => setConfirmingDelete(true)}>
              Delete
            </button>
          ))}
        <span className="spacer" />
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit" className="primary">Save</button>
      </div>
    </form>
  );
}
