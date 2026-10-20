import { useRef, useState } from "react";
import { useStore } from "../store/StoreContext";
import { downloadExport, parseImport, readFileText } from "../api/exportImport";
import { useDismiss } from "../hooks/useDismiss";
import { CaretIcon, ExportIcon, GearIcon, ImportIcon, ManageIcon } from "./icons";

/** The Data menu: account, export, import and the Manage dialog. */
export function DataMenu({ onManage }: { onManage: () => void }) {
  const { tasks, days, accountEmail, signOut, flash, importData } = useStore();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useDismiss(open, () => setOpen(false), [wrapRef]);

  const onExport = async () => {
    setOpen(false);
    const outcome = await downloadExport(tasks, days);
    if (outcome === "saved") flash("Exported " + tasks.length + " tasks");
    else if (outcome === "sent") flash("Export sent");
    else if (outcome === "failed") flash("Couldn’t export");
  };

  const onImportFile = async (file: File) => {
    let text: string;
    try {
      text = await readFileText(file);
    } catch {
      flash("Couldn’t read that file");
      return;
    }
    const parsed = parseImport(text);
    if (!parsed.ok) {
      flash(parsed.error);
      return;
    }
    const { added, updated, days: dayCount } = importData(parsed.notes, parsed.days);
    flash(
      "Imported " +
        added +
        " new" +
        (updated ? ", " + updated + " updated" : "") +
        (dayCount ? " · " + dayCount + " day settings" : ""),
    );
  };

  return (
    <div className="dw" ref={wrapRef}>
      <button
        type="button"
        className={"data-btn" + (open ? " open" : "")}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Export, import and manage your data"
        onClick={() => setOpen((o) => !o)}
      >
        <GearIcon />
        Data
        <CaretIcon />
      </button>

      {open ? (
        <div className="dm" role="menu">
          {accountEmail ? (
            <>
              <div className="acct">{accountEmail}</div>
              <button type="button" role="menuitem" onClick={signOut}>
                Sign out
              </button>
              <div className="dsep" />
            </>
          ) : null}
          <button
            type="button"
            role="menuitem"
            title="Download all tasks, updates and day settings as a JSON file"
            onClick={onExport}
          >
            <ExportIcon />
            Export
          </button>
          <button
            type="button"
            role="menuitem"
            title="Load a previously exported JSON file"
            onClick={() => {
              setOpen(false);
              fileRef.current?.click();
            }}
          >
            <ImportIcon />
            Import
          </button>
          <div className="dsep" />
          <button
            type="button"
            role="menuitem"
            title="Review and clean up everything stored"
            onClick={() => {
              setOpen(false);
              onManage();
            }}
          >
            <ManageIcon />
            Manage
          </button>
        </div>
      ) : null}

      <input
        type="file"
        ref={fileRef}
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onImportFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
