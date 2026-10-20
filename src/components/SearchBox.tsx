import { useRef } from "react";
import { useView } from "../store/ViewContext";
import { SearchIcon } from "./icons";

/** Search field; results appear as you type, across every day. */
export function SearchBox() {
  const { filters, setQuery } = useView();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="srch">
      <div className={"sbox" + (filters.query ? " hv" : "")}>
        <SearchIcon />
        <input
          ref={inputRef}
          type="search"
          placeholder="Search tasks"
          autoComplete="off"
          aria-label="Search tasks and updates"
          value={filters.query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && !filters.query) e.currentTarget.blur();
          }}
        />
        <button
          type="button"
          className="sgo"
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.blur()}
        >
          Search
        </button>
      </div>
    </div>
  );
}
