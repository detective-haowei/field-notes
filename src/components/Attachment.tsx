import { useState } from "react";
import { fmtSize, isImage, isVideo } from "../lib/files";
import { useAssetUrl } from "../hooks/useAssetUrl";
import { useStore } from "../store/StoreContext";
import { FileIcon } from "./icons";

export interface AttachmentView {
  id?: string;
  name: string;
  type: string;
  size: number;
  /** A local object URL shown while an upload is still running. */
  preview?: string;
}

/** An image, a video player, or a named chip for everything else. */
export function Attachment({ file }: { file: AttachmentView }) {
  const { assets } = useStore();
  const stored = useAssetUrl(file.id);
  const [broken, setBroken] = useState(false);

  // An attachment has no address until its URL is built or signed.
  const src = file.preview || stored || (file.id && assets?.fallbackUrl?.(file.id)) || "";

  if (isImage(file.type) && src && !broken) {
    return (
      <a className="att img" href={src} target="_blank" rel="noopener noreferrer" title={file.name}>
        <img src={src} alt={file.name} loading="lazy" onError={() => setBroken(true)} />
      </a>
    );
  }

  if (isVideo(file.type) && src) {
    return <video className="att vid" src={src} controls preload="metadata" title={file.name} />;
  }

  const content = (
    <>
      <FileIcon />
      <span className="fn2">{file.name}</span>
      {broken ? null : <span className="fs2">{fmtSize(file.size || 0)}</span>}
    </>
  );

  return src ? (
    <a className="att fch" href={src} target="_blank" rel="noopener noreferrer" title={file.name}>
      {content}
    </a>
  ) : (
    <span className="att fch" title={file.name}>
      {content}
    </span>
  );
}
