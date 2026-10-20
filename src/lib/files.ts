/** The only file types that can be attached, by extension. */
const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
  pdf: "application/pdf",
  csv: "text/csv",
  md: "text/markdown",
  json: "application/json",
  txt: "text/plain",
};

export const ACCEPT_ATTR = "image/*,video/mp4,video/webm,application/pdf,.csv,.md,.json,.txt";

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

/** The file's type if it is one we accept, otherwise "". */
export function fileType(f: File): string {
  const ext = (f.name.split(".").pop() || "").toLowerCase();
  const byExt = MIME_BY_EXT[ext];
  if (byExt) return byExt;
  const declared = (f.type || "").split(";")[0];
  return Object.values(MIME_BY_EXT).includes(declared) ? declared : "";
}

export function fmtSize(b: number): string {
  return b < 1024
    ? b + " B"
    : b < 1048576
      ? Math.round(b / 1024) + " KB"
      : (b / 1048576).toFixed(1) + " MB";
}

export const isImage = (type: string) => /^image\//.test(type);
export const isVideo = (type: string) => /^video\//.test(type);
