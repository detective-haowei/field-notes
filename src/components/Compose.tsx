import { useRef, useState } from "react";
import type { DayKey, Task } from "../types";
import { uid } from "../lib/ids";
import { useStore } from "../store/StoreContext";
import { useView } from "../store/ViewContext";
import { DeadlineField } from "./DeadlineField";
import { TagField } from "./TagField";

/** New task for the selected day. */
export function Compose() {
  const { saveTask } = useStore();
  const { selection, todayK } = useView();
  const [body, setBody] = useState("");
  const [projects, setProjects] = useState<string[]>([]);
  const [people, setPeople] = useState<string[]>([]);
  const [deadline, setDeadline] = useState<DayKey | "">("");
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const add = () => {
    const text = body.trim();
    if (!text) return;
    const task: Task = {
      id: uid("n"),
      body: text,
      projects,
      people,
      date: selection === "all" ? todayK : selection,
      created: Date.now(),
    };
    if (deadline) task.deadline = deadline;
    saveTask(task);
    setBody("");
    setProjects([]);
    setPeople([]);
    setDeadline("");
    bodyRef.current?.focus();
  };

  return (
    <div className="compose">
      <div className="clabel">New Task</div>
      <textarea
        ref={bodyRef}
        placeholder={"Add a task for this day…"}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) add();
        }}
      />
      <div className="foot">
        <div className="tfs">
          <TagField label="Projects" kind="projects" values={projects} onChange={setProjects} />
          <TagField label="People" kind="people" values={people} onChange={setPeople} />
          <DeadlineField value={deadline} onChange={setDeadline} />
        </div>
        <button type="button" className="pri" onClick={add}>
          Create
        </button>
      </div>
    </div>
  );
}
