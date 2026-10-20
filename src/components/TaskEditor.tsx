import { useRef, useState } from "react";
import type { DayKey, Task } from "../types";
import { useStore } from "../store/StoreContext";
import { DeadlineField } from "./DeadlineField";
import { TagField } from "./TagField";

interface Props {
  task: Task;
  onDone: () => void;
}

/** Edits a task in place: body, projects, people and deadline. */
export function TaskEditor({ task, onDone }: Props) {
  const { saveTask } = useStore();
  const [body, setBody] = useState(task.body || "");
  const [projects, setProjects] = useState<string[]>(task.projects || []);
  const [people, setPeople] = useState<string[]>(task.people || []);
  const [deadline, setDeadline] = useState<DayKey | "">(task.deadline || "");
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const save = () => {
    const value = body.trim();
    if (!value) {
      onDone();
      return;
    }
    const next: Task = { ...task, body: value, projects, people };
    if (deadline) next.deadline = deadline;
    else delete next.deadline;
    saveTask(next);
    onDone();
  };

  return (
    <div className="cb">
      <textarea autoFocus ref={bodyRef} value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="tfs">
        <TagField label="Projects" kind="projects" values={projects} onChange={setProjects} />
        <TagField label="People" kind="people" values={people} onChange={setPeople} />
        <DeadlineField value={deadline} onChange={setDeadline} />
      </div>
      <div className="row">
        <button type="button" className="pri" onClick={save}>
          Save
        </button>
        <button type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}
