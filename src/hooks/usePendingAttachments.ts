import { useCallback, useSyncExternalStore } from "react";
import { useStore } from "../store/StoreContext";
import * as pending from "../store/pendingAttachments";
import type { PendingAttachment } from "../store/pendingAttachments";
import { setUrl } from "../api/assetUrls";
import { fileType } from "../lib/files";
import type { UploadErrorCode } from "../api/types";

function uploadMessage(name: string, code: UploadErrorCode | undefined): string {
  switch (code) {
    case "too_large":
      return "“" + name + "” is too large (20 MB max, 2 MB for SVG)";
    case "quota_or_state":
      return "Attachment storage is full";
    case "rate_limited":
      return "Slow down — try again in a moment";
    default:
      return "Couldn’t upload “" + name + "”";
  }
}

/** The files staged for one task's next update, plus the actions on them. */
export function usePendingAttachments(taskId: string) {
  const { assets, flash, deleteAttachments } = useStore();
  const items = useSyncExternalStore(
    pending.subscribe,
    () => pending.get(taskId),
    () => pending.get(taskId),
  );

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      if (!assets) return;
      for (const file of Array.from(files)) {
        const type = fileType(file);
        if (!type) {
          flash(
            "“" + file.name + "” can’t be attached — images, PDFs, video and text files only",
          );
          continue;
        }
        const item: PendingAttachment = {
          name: file.name.slice(0, 200),
          type,
          size: file.size,
          busy: true,
        };
        // Show images straight away, before the upload finishes.
        if (/^image\//.test(type) && type !== "image/svg+xml") {
          try {
            item.preview = URL.createObjectURL(file);
          } catch {
            /* previews are optional */
          }
        }
        pending.add(taskId, item);
        assets.upload(file, { type }).then(
          (res) => {
            if (item.preview) setUrl(res.id, item.preview);
            pending.update(taskId, item, { id: res.id, size: res.sizeBytes, busy: false });
          },
          (e: unknown) => {
            pending.remove(taskId, item);
            flash(uploadMessage(file.name, (e as { code?: UploadErrorCode } | null)?.code));
          },
        );
      }
    },
    [taskId, assets, flash],
  );

  const removeItem = useCallback(
    (item: PendingAttachment) => {
      pending.remove(taskId, item);
      if (item.id) deleteAttachments([item.id]);
    },
    [taskId, deleteAttachments],
  );

  const clear = useCallback(() => pending.clear(taskId), [taskId]);

  return { items, addFiles, removeItem, clear, uploading: items.some((x) => x.busy) };
}
