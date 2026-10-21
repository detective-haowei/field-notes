import { useEffect, useRef, useState } from "react";
import type { BackendMode } from "../api/types";
import type { TagKind } from "../types";
import { TAG_SYMBOL, normalizeTag, tagCounts } from "../lib/tags";
import { taskStats } from "../lib/tasks";
import { useStore } from "../store/StoreContext";

/** How long a destructive button stays armed. */
const ARM_MS = 3500;

const WHERE: Record<BackendMode, string> = {
  supabase: "Stored in your account and synced to your devices.",
  claude: "Stored in your shared artifact database.",
  local: "Stored in this browser only.",
};

export function ManageDialog({ onClose }: { onClose: () => void }) {
  const { tasks, days, mode, retag, wipeAll } = useStore();
  const [wipeArmed, setWipeArmed] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!wipeArmed) return;
    const id = setTimeout(() => setWipeArmed(false), ARM_MS);
    return () => clearTimeout(id);
  }, [wipeArmed]);

  const stats = taskStats(tasks);
  const nothingStored = !tasks.length && !Object.keys(days).length;

  return (
    <div
      className="mgb"
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="mgd" role="dialog" aria-label="Manage data">
        <div className="mgtop">
          <div className="mgtt">Manage data</div>
          <button type="button" className="mgx" aria-label="Close" onClick={onClose}>
            {"✕"}
          </button>
        </div>

        <div className="mgbody">
          <div className="mgstats">
            {(
              [
                ["Tasks", stats.tasks],
                ["Completed", stats.completed],
                ["Updates", stats.updates],
                ["Deadlines", stats.deadlines],
                ["Days marked", Object.keys(days).length],
              ] as [string, number][]
            ).map(([name, value]) => (
              <div className="mgst" key={name}>
                <div className="mgv">{value}</div>
                <div className="mgl">{name}</div>
              </div>
            ))}
          </div>

          <div className="mgnote">{WHERE[mode]}</div>

          <TagSection title="Projects" kind="projects" onRename={retag} />
          <TagSection title="People" kind="people" onRename={retag} />

          <div className="mgsec mgdz">
            <div className="mgh">
              <div className="mgt">Danger zone</div>
              <div className="mgs">Export first if you might want it back.</div>
            </div>
            <button
              type="button"
              className={"mgb2 dg wide" + (wipeArmed ? " arm" : "")}
              disabled={nothingStored}
              onClick={() => {
                if (!wipeArmed) {
                  setWipeArmed(true);
                  return;
                }
                wipeAll();
                setWipeArmed(false);
              }}
            >
              {wipeArmed ? "Click again to delete everything" : "Delete all data"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TagSectionProps {
  title: string;
  kind: TagKind;
  onRename: (kind: TagKind, from: string, to: string) => void;
}

/** Renames or removes a project or person across every task that uses it. */
function TagSection({ title, kind, onRename }: TagSectionProps) {
  const { tasks } = useStore();
  const list = tagCounts(tasks, kind);

  return (
    <div className="mgsec">
      <div className="mgh">
        <div className="mgt">{title}</div>
        <div className="mgs">{list.length ? list.length + (list.length === 1 ? " tag" : " tags") : ""}</div>
      </div>
      {list.length ? (
        list.map((tag) => (
          <TagRow key={tag.name} kind={kind} name={tag.name} count={tag.n} onRename={onRename} />
        ))
      ) : (
        <div className="mge">None yet</div>
      )}
    </div>
  );
}

interface TagRowProps {
  kind: TagKind;
  name: string;
  count: number;
  onRename: (kind: TagKind, from: string, to: string) => void;
}

function TagRow({ kind, name, count, onRename }: TagRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), ARM_MS);
    return () => clearTimeout(id);
  }, [armed]);

  const commit = () => {
    const value = normalizeTag(draft);
    setEditing(false);
    if (!value || value === name) return;
    onRename(kind, name, value);
  };

  if (editing) {
    return (
      <div className="mrow ed">
        <input
          autoFocus
          aria-label="New name"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              e.stopPropagation();
              setEditing(false);
            }
          }}
        />
        <button type="button" className="mgb2 ok" onClick={commit}>
          Save
        </button>
        <button type="button" className="mgb2" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="mrow">
      <div className="mgn">
        <span className="tg">
          {TAG_SYMBOL[kind]}
          {name}
        </span>
      </div>
      <span className="mgc">{count + (count === 1 ? " task" : " tasks")}</span>
      <div className="mga">
        <button
          type="button"
          className="mgb2"
          onClick={() => {
            setDraft(name);
            setEditing(true);
          }}
        >
          Rename
        </button>
        <button
          type="button"
          className={"mgb2 dg" + (armed ? " arm" : "")}
          onClick={() => {
            if (!armed) {
              setArmed(true);
              return;
            }
            onRename(kind, name, "");
          }}
        >
          {armed ? "Remove from " + count + "?" : "Remove"}
        </button>
      </div>
    </div>
  );
}
