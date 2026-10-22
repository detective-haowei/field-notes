import { useRef, useState } from "react";
import type { Task, Update } from "../types";
import { ACCEPT_ATTR } from "../lib/files";
import { uid } from "../lib/ids";
import { updateDayFor } from "../lib/tasks";
import { toAttachments } from "../store/pendingAttachments";
import { usePendingAttachments } from "../hooks/usePendingAttachments";
import { useAutoResize } from "../hooks/useAutoResize";
import { useStore } from "../store/StoreContext";
import { useView } from "../store/ViewContext";
import { Attachment } from "./Attachment";
import { ClipIcon, SendIcon } from "./icons";

const MAX_UPDATE_LENGTH = 1000;

/**
 * Adds an update to a task: a line of text, files, or both. Files can be
 * picked, pasted or dropped, and upload as soon as they are added.
 */
export function AddUpdate({ task }: { task: Task }) {
  const { assets, saveTask } = useStore();
  const { effectiveSelection, todayK } = useView();
  const { items, addFiles, removeItem, clear, uploading } = usePendingAttachments(task.id);
  const [text, setText] = useState("");
  const [dropping, setDropping] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useAutoResize(textRef, text);

  const ready = !!text.trim() || items.length > 0;

  const add = () => {
    const value = text.trim();
    if (uploading) return;
    const files = toAttachments(items);
    if (!value && !files.length) return;

    const update: Update = {
      id: uid("u"),
      text: value,
      date: updateDayFor(task, effectiveSelection, todayK),
      created: Date.now(),
    };
    if (files.length) update.files = files;

    setText("");
    textRef.current?.blur();
    clear();
    saveTask({ ...task, updates: [...(task.updates || []), update] });
  };

  return (
    <div
      className={"addup" + (dropping ? " drop" : "") + (text || items.length ? " filled" : "")}
      onClick={(e) => {
        if (e.target === e.currentTarget) textRef.current?.focus();
      }}
      onDragOver={
        assets
          ? (e) => {
              if (!Array.from(e.dataTransfer?.types || []).includes("Files")) return;
              e.preventDefault();
              setDropping(true);
            }
          : undefined
      }
      onDragLeave={assets ? () => setDropping(false) : undefined}
      onDrop={
        assets
          ? (e) => {
              setDropping(false);
              if (!e.dataTransfer?.files.length) return;
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }
          : undefined
      }
    >
      <div className="pend">
        {items.map((item, i) => (
          <div className={"pa" + (item.busy ? " busy" : "")} key={item.name + i}>
            {item.busy && !item.preview ? (
              <span className="fch">{item.name + " · uploading…"}</span>
            ) : (
              <Attachment file={item} />
            )}
            <button
              type="button"
              className="pax"
              aria-label="Remove attachment"
              onClick={() => removeItem(item)}
            >
              {"✕"}
            </button>
          </div>
        ))}
      </div>

      <textarea
        ref={textRef}
        rows={1}
        maxLength={MAX_UPDATE_LENGTH}
        placeholder={"Add an update…"}
        title="Enter to add · Shift+Enter for a new line"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            add();
          }
        }}
        onPaste={
          assets
            ? (e) => {
                const files = e.clipboardData?.files;
                if (!files?.length) return;
                e.preventDefault();
                addFiles(files);
              }
            : undefined
        }
      />

      <div className="atb">
        <div className="atl">
          {assets ? (
            <>
              <button
                type="button"
                className="clip"
                title="Attach images or files"
                aria-label="Attach files"
                onClick={() => fileRef.current?.click()}
              >
                <ClipIcon />
              </button>
              <input
                type="file"
                ref={fileRef}
                multiple
                hidden
                accept={ACCEPT_ATTR}
                onChange={(e) => {
                  if (e.target.files?.length) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </>
          ) : null}
        </div>
        <button
          type="button"
          className={"asend" + (ready ? " on" : "")}
          title="Add update"
          aria-label="Add update"
          onClick={add}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}
