import { useEffect, useRef, useState } from "react";
import type { Task, Update } from "../types";
import { label, relativeUpdate, timeOf } from "../lib/dates";
import { renderUpdateText } from "../lib/text";
import { fitTextarea } from "../hooks/useAutoResize";
import { useStore } from "../store/StoreContext";
import { useView } from "../store/ViewContext";
import { Attachment } from "./Attachment";

const ARM_MS = 3000;
const MAX_UPDATE_LENGTH = 1000;

interface Props {
  task: Task;
  update: Update;
  /** True when the update falls on the day being viewed. */
  current: boolean;
}

/** One line of the update log: when, what, and a delete that asks once. */
export function UpdateRow({ task, update, current }: Props) {
  const { saveTask, deleteAttachments } = useStore();
  const { now, terms } = useView();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(update.text);
  const [armed, setArmed] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  /** Set when Escape cancels, so the blur handler does not also save. */
  const cancelled = useRef(false);

  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), ARM_MS);
    return () => clearTimeout(id);
  }, [armed]);

  useEffect(() => {
    if (!editing) return;
    const el = textRef.current;
    if (!el) return;
    fitTextarea(el);
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [editing]);

  const startEditing = () => {
    cancelled.current = false;
    setDraft(update.text);
    setEditing(true);
  };

  const commit = () => {
    if (cancelled.current) return;
    setEditing(false);
    const value = draft.trim();
    if (!value || value === update.text) return;
    saveTask({
      ...task,
      updates: (task.updates || []).map((u) => (u.id === update.id ? { ...u, text: value } : u)),
    });
  };

  const remove = () => {
    if (!armed) {
      setArmed(true);
      return;
    }
    deleteAttachments((update.files || []).map((f) => f.id));
    saveTask({ ...task, updates: (task.updates || []).filter((u) => u.id !== update.id) });
  };

  return (
    <div className={"up" + (current ? " cur" : "")}>
      <span
        className="ud"
        title={label(update.date) + (update.created ? " · " + timeOf(update.created) : "")}
      >
        <span className="dtx">{relativeUpdate(update, now)}</span>
      </span>

      {editing ? (
        <textarea
          className="ue"
          ref={textRef}
          rows={1}
          maxLength={MAX_UPDATE_LENGTH}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            fitTextarea(e.currentTarget);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              e.currentTarget.blur();
            } else if (e.key === "Escape") {
              cancelled.current = true;
              setEditing(false);
            }
          }}
          onBlur={commit}
        />
      ) : (
        <span className="ut" title="Double-click to edit" onDoubleClick={startEditing}>
          {renderUpdateText(update.text, terms)}
          {update.files?.length ? (
            <span className="atts" onDoubleClick={(e) => e.stopPropagation()}>
              {update.files.map((f) => (
                <Attachment key={f.id} file={f} />
              ))}
            </span>
          ) : null}
        </span>
      )}

      <button
        type="button"
        className={"x dx" + (armed ? " arm" : "")}
        title="Delete update"
        onClick={remove}
      >
        {armed ? "Delete?" : "✕"}
      </button>
    </div>
  );
}
