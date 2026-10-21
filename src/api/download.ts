import { claudeDownloads } from "./claudeArtifact";

export type SaveOutcome = "saved" | "sent" | "declined" | "failed";

/**
 * Saves a file: through the artifact host when there is one, otherwise with a
 * temporary link. The outcome is reported so callers can show a message.
 */
export async function saveFile(filename: string, data: string | ArrayBuffer, mime: string): Promise<SaveOutcome> {
  const downloads = await claudeDownloads();
  if (downloads) {
    try {
      const res = await downloads.save({ filename, data });
      return res?.status === "saved" ? "saved" : "sent";
    } catch (e) {
      return (e as { code?: string } | null)?.code === "declined" ? "declined" : "failed";
    }
  }
  try {
    const blob = data instanceof ArrayBuffer ? new Blob([data], { type: mime }) : new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return "saved";
  } catch {
    return "failed";
  }
}
