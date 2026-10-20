import { useSyncExternalStore } from "react";
import * as assetUrls from "../api/assetUrls";

/**
 * The URL for an attachment, which may only arrive after the task renders
 * (blob URLs are built on load, signed URLs are fetched).
 */
export function useAssetUrl(id: string | undefined): string | undefined {
  const url = useSyncExternalStore(
    assetUrls.subscribe,
    () => (id ? assetUrls.getUrl(id) : undefined),
    () => undefined,
  );
  return url;
}
