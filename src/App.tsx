import { useState } from "react";
import type { DayKey } from "./types";
import { downloadWeekPdf } from "./api/pdf";
import { AuthScreen } from "./components/AuthScreen";
import { DayNav } from "./components/DayNav";
import { Header } from "./components/Header";
import { ManageDialog } from "./components/ManageDialog";
import { TaskColumn } from "./components/TaskColumn";
import { useStore } from "./store/StoreContext";
import { ViewProvider } from "./store/ViewContext";

export function App() {
  const { authClient, signIn, tasks, flash } = useStore();
  const [managing, setManaging] = useState(false);

  if (authClient) return <AuthScreen client={authClient} onSignedIn={signIn} />;

  const onWeekSummary = async (weekStart: DayKey) => {
    flash("Creating PDF…");
    const outcome = await downloadWeekPdf(tasks, weekStart);
    if (outcome === "saved") flash("Summary downloaded");
    else if (outcome === "sent") flash("Summary sent");
    else if (outcome === "failed") flash("Couldn’t download the PDF");
    else flash("");
  };

  return (
    <ViewProvider>
      <div className="wrap">
        <Header onManage={() => setManaging(true)} />
        <div className="grid">
          <DayNav onWeekSummary={onWeekSummary} />
          <TaskColumn />
        </div>
      </div>
      {managing ? <ManageDialog onClose={() => setManaging(false)} /> : null}
    </ViewProvider>
  );
}
